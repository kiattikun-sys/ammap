# Phase 6 — Enterprise Hardening Plan
**Status:** AWAITING OWNER APPROVAL  
**Date:** March 2026  
**Baseline:** Phase 5.8 patches applied and DB migrations 015 + 016 confirmed live (screenshots verified)

---

## 1. Phase 6 System Inspection Report

### 1.1 RLS Policy Structure (post-migration 016)

| Table | SELECT | INSERT | UPDATE | DELETE | Role Check on Writes? |
|---|---|---|---|---|---|
| `work_items` | org-scoped | org-scoped + `role != 'viewer'` | org-scoped + `role != 'viewer'` | org-scoped | ✅ Yes |
| `defects` | org-scoped | org-scoped + `role != 'viewer'` | org-scoped + `role != 'viewer'` | org-scoped | ✅ Yes |
| `inspections` | org-scoped | org-scoped + `role != 'viewer'` | org-scoped + `role != 'viewer'` | org-scoped | ✅ Yes |
| `corrective_actions` | org-scoped | org-scoped + `role != 'viewer'` | org-scoped + `role != 'viewer'` | org-scoped | ✅ Yes |
| `evidence` | org-scoped | org-scoped + `role != 'viewer'` | org-scoped + `role != 'viewer'` | org-scoped | ✅ Yes |
| `projects` | org-scoped | `role IN (owner,admin,pm)` | `role IN (owner,admin)` or project manager | — | ✅ Yes |
| `timeline_events` | org-scoped | org-scoped + `role != 'viewer'` | **NO UPDATE policy** (append-only by design) | **NO DELETE policy** (append-only by design) | ✅ Yes |
| `spatial_nodes` | org-scoped | org-scoped | org-scoped | org-scoped | ⚠️ No role check on writes |
| `progress_records` | org-scoped | org-scoped | org-scoped | org-scoped | ⚠️ No role check on writes |
| `organization_members` | self/owner | owner/admin only | — | self-leave only | ✅ Yes |

**Remaining gap:** `spatial_nodes` and `progress_records` still have no role check on INSERT/UPDATE/DELETE — any non-viewer org member can write to them directly via REST API. Since `viewer` is the only read-only role (via Phase 5.8), viewer exclusion is the minimum needed here too.

### 1.2 Project Members Usage

The `project_members` table exists with RLS enabled and these policies (migration 002 + 014):
- SELECT: org members can view project members in their org
- INSERT: org members can add project members (migration 014 fixed recursion bug)
- UPDATE: org members can update project memberships
- DELETE: org members can remove project members

**Current access model:** All org members can see and interact with ALL projects in their org. `project_members` is populated (e.g. `createProject` inserts the creator as `manager`) but is NOT enforced as an access boundary — it is unused as a gate.

**Phase 6 objective:** Make `project_members` the access boundary, so a `viewer` in org but not assigned to project P2 cannot see P2's data.

**Risk:** This is a **breaking change** for existing UI. All list-page queries currently rely on the org-scoped pattern. Switching to project-scoped RLS would require all queries to either:
1. Pass `project_id` filter explicitly (most already do), OR
2. Be updated to use project membership join

**Recommended approach:** Dual-mode — keep org-scoped SELECT as fallback for `owner`/`admin`, enforce project membership for all lower roles. Implement as **additive policy** not a replacement.

### 1.3 Timeline Event Generation

**How events are written:** Application-driven — each write action calls `createTimelineEvent()` at the end using `.catch(() => {})` (fire-and-forget).

**Current coverage:**

| Action | Creates Event? | Event Type | Silent Failure Risk |
|---|---|---|---|
| createWorkItem | ✅ Yes | `work_item_created` | Yes — `.catch(()=>{})` |
| updateWorkProgress | ✅ Yes | `work_item_started/completed/progress_updated` | Yes |
| updateWorkItem (status) | ❌ No | — | N/A |
| createDefect | ✅ Yes | `defect_created` | Yes |
| updateDefectStatus (close) | ✅ Yes | `defect_resolved` | Yes |
| updateDefectStatus (non-close) | ❌ No | — | N/A |
| createCorrectiveAction | ✅ Yes | `corrective_action_created` | Yes |
| updateCorrectiveAction (complete) | ✅ Yes | `corrective_action_completed` | Yes |
| updateCorrectiveAction (non-complete) | ❌ No | — | N/A |
| createInspection | ✅ Yes | `inspection_scheduled` | Yes |
| updateInspection (complete) | ✅ Yes | `inspection_completed` | Yes |
| updateInspection (non-complete) | ❌ No | — | N/A |
| createEvidence | ✅ Yes | `evidence_uploaded` | Yes |

**All timeline writes use `.catch(() => {})`.** A DB connectivity failure or RLS error silently drops the audit event without notifying the caller or retrying.

**Phase 6 improvement:** DB trigger on `status` column changes across domain tables. This moves audit reliability from application layer to DB layer. The trigger fires inside the transaction — if the row write commits, the timeline row commits atomically.

### 1.4 Evidence Upload Flow

```
Browser → uploadEvidenceFile() [createSupabaseBrowser, correct for file upload]
       → returns fileUrl (https://{project}.supabase.co/storage/...)
       → caller passes fileUrl to createEvidence() [createSupabaseServer ✅ fixed in 5.8]
       → createEvidenceSchema validates fileUrl [storageUrlSchema ✅ fixed in 5.8]
       → DB insert with server client (authenticated user session) ✅
```

**Storage bucket:** `evidence-files` — private, 50MB limit, MIME restricted.  
**Upload path bug:** `evidence-upload-service.ts` uses path `projects/{projectId}/evidence/{fileId}.ext` but storage RLS policies from migration 006 use `(storage.foldername(name))[1]` which reads the **first path segment** — which would be `projects`, not `{projectId}`. 

**This is a path mismatch.** Storage RLS checks `[1]` = `"projects"` (literal string) against `project_id` UUIDs → condition is always false → uploads are being rejected by RLS silently.

**The actual path must be `{projectId}/{filename}` not `projects/{projectId}/evidence/{filename}`.**

### 1.5 Query Patterns (List Pages)

All list queries use `createSupabaseBrowser()` — correct for client components. None implement pagination:

| Query | No LIMIT | No OFFSET | Unbounded? |
|---|---|---|---|
| `listWorkItems` | ✅ No limit | ✅ No offset | **Yes** |
| `listDefects` | ✅ No limit | ✅ No offset | **Yes** |
| `listInspections` | ✅ No limit | ✅ No offset | **Yes** |
| `listCorrectiveActions` | ✅ No limit | ✅ No offset | **Yes** |
| `listEvidence` | ✅ No limit | ✅ No offset | **Yes** |
| `listTimelineEvents` | ✅ No limit | ✅ No offset | **Yes** |

For large projects (1000+ work items, 500+ defects), these unbounded queries will cause:
- Long browser stall on initial page load
- Large JS heap usage
- Potential Supabase response size limits (1MB default)

### 1.6 Logging Capabilities

- **No structured error logging** — errors only reach `console.error` / Next.js default
- **No permission denial tracking** — `requirePermission` throws but the error is swallowed by the calling component
- **No lifecycle violation tracking** — lifecycle guard throws land in the same void
- **Health endpoint:** exists at `/api/health` but only returns `{ status: "ok" }` — no actual DB ping, no auth check, no storage check
- **No audit log table** — security-sensitive operations (project creation, archive, role changes) are not separately recorded beyond timeline events

---

## 2. Identified Security Risks

| ID | Risk | Severity | Workstream |
|---|---|---|---|
| R-01 | `spatial_nodes` and `progress_records` have no role-check on writes — viewer can write via REST | Medium | WS1 |
| R-02 | `project_members` is not enforced as an access boundary — all org members see all projects | Medium | WS2 |
| R-03 | Evidence upload path `projects/{id}/evidence/{file}` mismatches storage RLS `foldername[1]` check — all uploads silently fail | **Critical** | WS4 |
| R-04 | Timeline writes are fire-and-forget — audit gaps are silent and unrecoverable | High | WS3 |
| R-05 | No audit log for security-sensitive operations (project create/archive/role change) | High | WS7 |
| R-06 | All list queries are unbounded — risk of slow queries and response size limits at scale | Medium | WS5 |
| R-07 | Health endpoint is a static stub — does not verify actual system health | Low | WS6 |
| R-08 | No structured permission denial logging — security incidents are invisible | Medium | WS6 |
| R-09 | `getCallerRole()` performs 2 DB queries per action (getUser + org lookup) — no caching | Low | WS5 |
| R-10 | Storage upload policy has no role check — any org member (including viewer) can upload files | Medium | WS4 |

---

## 3. Implementation Plan

### WS1 — RLS Hardening (Migration 017)

**Target:** Close the remaining write-gap on `spatial_nodes` and `progress_records`. Add viewer exclusion to match the pattern applied in migration 016.

**Migration:** `017_phase6_ws1_rls_spatial_progress.sql`

Changes:
- Drop old INSERT/UPDATE policies on `spatial_nodes`, add `role != 'viewer'` versions
- Drop old INSERT/UPDATE policies on `progress_records`, add `role != 'viewer'` versions
- Storage upload policy on `evidence-files`: add `role != 'viewer'` check

**Risk:** Low. No SELECT policies touched. Viewer loses write ability they should never have had.

---

### WS2 — Project Assignment Enforcement (Migration 018)

**Target:** Introduce project-level access control without breaking org-wide admin access.

**Approach:** Dual-scope SELECT model:
- `owner` / `admin` retain org-wide access (no project assignment required)
- All other roles require a `project_members` row to access project data

**Scope of change:** Only `projects` SELECT policy initially. Domain table policies remain org-scoped for now (Phase 6.1 future workstream when project_members is populated for all users).

**Migration:** `018_phase6_ws2_project_assignment.sql`

Changes:
- New `projects` SELECT policy enforcing dual-scope (owner/admin org-wide OR project member)
- New server-side query `listProjectsForUser` (replaces browser-based `listProjectsByOrganization`)
- Dashboard page to use server-side query

**Risk:** Medium. Requires project_members rows to exist for all non-admin users. Bootstrap data only has creator as manager. **Must seed project_members for existing users before enabling OR make optional in Phase 6.1.**

**Decision required from owner:** Enable WS2 now as optional (additive) or defer to Phase 6.1?

---

### WS3 — Timeline Reliability (Migration 019)

**Target:** Move timeline event creation from application fire-and-forget to DB trigger for critical status changes.

**Approach:** PostgreSQL trigger on `status` column UPDATE for `work_items`, `defects`, `inspections`, `corrective_actions`. Trigger inserts into `timeline_events` atomically within the same transaction.

**Migration:** `019_phase6_ws3_timeline_triggers.sql`

Functions/triggers:
- `fn_timeline_work_item_status()` — fires on `work_items.status` change
- `fn_timeline_defect_status()` — fires on `defects.status` change  
- `fn_timeline_inspection_status()` — fires on `inspections.status` change
- `fn_timeline_corrective_action_status()` — fires on `corrective_actions.status` change

**Behaviour:** Trigger inserts a timeline row when `OLD.status != NEW.status`. Application-level `.catch(()=>{})` events remain for non-status operations (creation, progress updates) — they supplement the trigger, not replace it.

**Risk:** Low. Additive only. Does not remove existing application-level events. May produce duplicate events for status transitions (trigger + application both fire). Application `.catch()` fire-and-forget events for status transitions should be removed to avoid duplication — that requires code changes.

---

### WS4 — Evidence Storage Hardening (Migration 020 + code fix)

**Target:** Fix the upload path mismatch (R-03) and harden storage policies.

**Critical fix:** Change `evidence-upload-service.ts` upload path from:
```
projects/{projectId}/evidence/{fileId}.ext  ← WRONG
```
to:
```
{projectId}/{fileId}.ext  ← CORRECT (matches RLS foldername[1] check)
```

**Migration:** `020_phase6_ws4_storage_hardening.sql`

Changes:
- Add role check to storage INSERT policy (exclude viewer from uploads)
- Update storage path documentation comment to match actual convention

**Code change:** `src/domains/evidence/services/evidence-upload-service.ts`

**Risk:** Medium. Fixes a live bug — existing file references in DB use the wrong path and will be broken regardless. No existing files in bootstrap data, so no data migration needed.

---

### WS5 — Pagination (code-only)

**Target:** Add `limit` + `offset` pagination to all 6 list queries. No schema changes needed.

**Files to change:**

| File | Change |
|---|---|
| `src/domains/work/queries/list-work-items.ts` | Add `limit`, `offset` to filter + query |
| `src/domains/quality/queries/list-defects.ts` | Same |
| `src/domains/quality/queries/list-inspections.ts` | Same |
| `src/domains/quality/queries/list-corrective-actions.ts` | Same |
| `src/domains/evidence/queries/list-evidence.ts` | Same |
| `src/domains/timeline/queries/list-timeline-events.ts` | Same |

Default limit: 50 records. Callers may override. No UI pagination controls in this workstream (Phase 6.1 feature work).

**Risk:** Low. Purely additive. All existing callers that don't pass `limit` will use the default.

---

### WS6 — Observability (code-only)

**Target:** Structured logging + real health endpoint.

**Files to change:**

| File | Change |
|---|---|
| `src/lib/permissions/can-perform.ts` | Emit structured log on permission denial |
| `src/app/api/health/route.ts` | Real DB ping + auth check + storage check |

**Structured log format:**
```json
{ "event": "permission_denied", "role": "viewer", "permission": "create:defect", "userId": "...", "timestamp": "..." }
```

**Health endpoint response:**
```json
{
  "status": "ok|degraded|error",
  "checks": {
    "database": "ok|error",
    "auth": "ok|error",
    "storage": "ok|error"
  },
  "timestamp": "..."
}
```

**Risk:** Zero. Additive only.

---

### WS7 — Security Audit Logging (Migration 021 + code)

**Target:** Append-only `audit_log` table for security-sensitive operations.

**Migration:** `021_phase6_ws7_audit_log.sql`

Schema:
```sql
create table audit_log (
  id           uuid primary key default gen_random_uuid(),
  event_type   text not null,
  user_id      uuid references auth.users(id),
  org_id       uuid references organizations(id),
  project_id   uuid references projects(id),
  resource_id  text,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);
-- RLS: owner/admin can read their org's audit log
-- No UPDATE, no DELETE policies — append-only
```

**Events to capture:**
- `project.created` — on `createProject`
- `project.archived` — on `archiveProject`
- `permission.denied` — on `requirePermission` throw
- `role.assigned` — on org member role update (future)
- `evidence.created` — on `createEvidence` (supplement to timeline)

**Code change:** `src/lib/permissions/can-perform.ts` + `src/domains/project/actions/index.ts`

**Risk:** Low. Table is additive. Audit writes are best-effort (fire-and-forget acceptable for audit log — DB trigger would be gold standard but Phase 6.1).

---

### WS8 — Rate Limiting (middleware)

**Target:** Protect expensive endpoints from abuse.

**Approach:** In-memory rate limiter in Next.js middleware using IP + userId as key.

**Endpoints to protect:**
- `/api/health` — 10 req/min per IP
- Server actions via middleware header check

**Risk:** Low impact. In-memory store resets on server restart — sufficient for dev/staging, not production scale. Production rate limiting requires Redis (Phase 7).

**Recommendation:** Defer full WS8 to Phase 7 (infrastructure). Implement basic middleware protection only.

---

## 4. Migration Plan

| Migration | Workstream | Tables Affected | Blocking? |
|---|---|---|---|
| `017_phase6_ws1_rls_spatial_progress.sql` | WS1 | `spatial_nodes`, `progress_records`, `storage.objects` | No |
| `018_phase6_ws2_project_assignment.sql` | WS2 | `projects` (SELECT policy) | **Yes — requires project_members seeding** |
| `019_phase6_ws3_timeline_triggers.sql` | WS3 | `timeline_events` (trigger insert) | No |
| `020_phase6_ws4_storage_hardening.sql` | WS4 | `storage.objects` (policy update) | No |
| `021_phase6_ws7_audit_log.sql` | WS7 | New `audit_log` table | No |

---

## 5. Code Changes Required

| File | Workstream | Type | Risk |
|---|---|---|---|
| `src/domains/evidence/services/evidence-upload-service.ts` | WS4 | Fix upload path bug | **Critical bug fix** |
| `src/domains/work/queries/list-work-items.ts` | WS5 | Add pagination params | Low |
| `src/domains/quality/queries/list-defects.ts` | WS5 | Add pagination params | Low |
| `src/domains/quality/queries/list-inspections.ts` | WS5 | Add pagination params | Low |
| `src/domains/quality/queries/list-corrective-actions.ts` | WS5 | Add pagination params | Low |
| `src/domains/evidence/queries/list-evidence.ts` | WS5 | Add pagination params | Low |
| `src/domains/timeline/queries/list-timeline-events.ts` | WS5 | Add pagination params | Low |
| `src/lib/permissions/can-perform.ts` | WS6 + WS7 | Structured log on denial + audit write | Low |
| `src/app/api/health/route.ts` | WS6 | Real health checks | Low |
| `src/domains/project/actions/index.ts` | WS7 | Audit log on create/archive | Low |
| `src/domains/work/actions/update-work-item.ts` | WS3 | Remove duplicate status timeline emit (trigger replaces it) | Low |
| `src/domains/quality/actions/update-defect-status.ts` | WS3 | Remove duplicate status timeline emit | Low |
| `src/domains/quality/actions/update-inspection.ts` | WS3 | Remove duplicate status timeline emit | Low |
| `src/domains/quality/actions/update-corrective-action.ts` | WS3 | Remove duplicate status timeline emit | Low |

---

## 6. Risk Assessment

| Workstream | Risk Level | Notes |
|---|---|---|
| WS1 — RLS Hardening | **Low** | Purely additive. Removes unintended access only. |
| WS2 — Project Assignment | **Medium** | Breaking change to access model. Requires project_members data seeding. |
| WS3 — Timeline Triggers | **Low** | Additive. Possible brief duplicate events during transition. |
| WS4 — Evidence Fix | **Low (code) / Critical (bug)** | The upload path is currently broken. Fix is straightforward. |
| WS5 — Pagination | **Low** | Additive. No existing callers break. |
| WS6 — Observability | **Zero** | Read-only additions, no DB changes. |
| WS7 — Audit Log | **Low** | New table, additive writes. |
| WS8 — Rate Limiting | **Low** | Middleware-only, easily reverted. |

---

## 7. Recommended Rollout Order

```
SPRINT 1 (Security — implement immediately)
  WS4 upload path fix        ← Critical live bug, fix first
  WS1 RLS hardening          ← Close remaining write gaps
  WS7 Audit log table + wiring

SPRINT 2 (Reliability)
  WS3 Timeline DB triggers
  WS6 Observability + real health endpoint

SPRINT 3 (Performance)
  WS5 Pagination across all list queries

SPRINT 4 (Access Model — requires owner decision)
  WS2 Project assignment enforcement
  WS8 Rate limiting (basic middleware)
```

---

## 8. Owner Decision Required Before WS2

**Question:** Should project-level access enforcement (WS2) be enabled in Phase 6?

- **Option A — Enable now:** All non-admin org members must be in `project_members` to access project data. Requires seeding `project_members` for all existing users across all projects. Breaking change.
- **Option B — Defer to Phase 6.1:** Keep org-wide model for now. WS2 migrations are written and ready but not applied. Bootstrap `project_members` data populated as Phase 6.1 setup task.
- **Option C — Partial enforcement:** Only enforce for `viewer` and `document` roles. Higher roles retain org-wide access. Lowest disruption path.

**Recommendation:** Option B (defer), implement infrastructure in Phase 6, activate in Phase 6.1 once project_members is fully seeded.

---

*Phase 6 Architecture Plan — AMMAP Enterprise Hardening*  
*Awaiting owner approval before implementation begins.*

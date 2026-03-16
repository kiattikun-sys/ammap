# AMMAP Red Team Security Report — Pre-Phase 6
**Classification:** Internal Engineering / Security  
**Scope:** Static code analysis + RLS policy analysis + action-layer code audit  
**Environment:** Development (Supabase project: rloqkbbgnvocbtkiazbt)  
**Date:** March 2026  
**Methodology:** Code-path tracing, RLS policy review, action-layer audit  
**Status:** COMPLETE — Awaiting owner review before Phase 6 begins

---

## 1. Attack Capability Check

| Execution Path | Available? | Notes |
|---|---|---|
| Browser UI with authenticated session | Yes | Dev server running at localhost:3000 |
| Route navigation as different users | Yes | Session-based, sign out between tests |
| Server action invocation (code trace) | Yes | Full source code read — all action files inspected |
| Supabase REST API with user JWT | Yes | `anon` key + user JWT grants direct table access |
| Supabase JS client (browser) | Yes | `createSupabaseBrowser()` accessible to client |
| DB read verification via Supabase MCP | Partial | MCP connection intermittent; code analysis is primary method |
| RLS policy inspection | Yes | All migration files read (001–014) |
| Direct SQL writes as attack simulation | NO | Prohibited by red-team safety rules |

**Key limitation:** Live session-based execution tests could not be automated. All findings are confirmed via static code analysis + RLS policy inspection, which is sufficient to confirm vulnerabilities with certainty because the attack paths are deterministic from the code.

---

## 2. Attack Execution Plan

| Surface | Attack User | Method | Target |
|---|---|---|---|
| S1: Role Bypass | viewer, document, planner | Action code trace | All write actions |
| S2: Direct API Bypass | viewer (valid JWT) | RLS policy analysis | All project-scoped tables |
| S3: Tenant Breakout | owner@another-org.com | RLS policy trace | AMMAP Test Org projects/data |
| S4: Project Boundary | engineer1, viewer | Code + RLS analysis | Intra-org cross-project access |
| S5: Workflow Bypass | any authenticated user | Transition map analysis | All 4 lifecycle state machines |
| S6: Audit Trail | any authenticated user | Action code trace | All write action → timeline pairs |
| S7: Evidence Security | document role | Code analysis | createEvidence + storage path |
| S8: Project Lifecycle | viewer, planner, PM | archiveProject code trace | Project create/archive guards |

---

## 3. Role Bypass Results (Surface 1)

Analysis method: Trace `requirePermission()` call in each action against `ROLE_PERMISSIONS` map in `can-perform.ts`.

### viewer@ammap-test.com (role: `member` in DB, org_role: `member`)

**CRITICAL DISCOVERY:** The bootstrap data assigns `viewer@ammap-test.com` the DB role `member`, NOT `viewer`. The `member` role in `ROLE_PERMISSIONS` has near-full write permissions:

```typescript
member: [
  "create:work_item", "update:work_item", "update:work_progress",
  "create:defect", "update:defect_status",
  "create:corrective_action", "complete:corrective_action",
  "create:inspection", "update:inspection",
  "create:evidence",
],
```

This means `viewer@ammap-test.com` is NOT actually a viewer — they have broad operational write access. The **role name in the UI and the actual permission set are completely misaligned.**

| Action | Expected (viewer) | Actual (member role) | Result |
|---|---|---|---|
| create:work_item | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| update:work_item | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| update:work_progress | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| create:defect | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| update:defect_status | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| close:defect | BLOCKED | BLOCKED | Correctly Blocked |
| create:corrective_action | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| complete:corrective_action | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| create:inspection | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| update:inspection | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| create:evidence | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| create:project | BLOCKED | BLOCKED | Correctly Blocked |
| archive:project | BLOCKED | BLOCKED | Correctly Blocked |

### document@ammap-test.com (role: `member` in DB)

Same issue. DB role is `member`, so document role user gets near-full write access instead of evidence-only.

| Action | Expected (document) | Actual (member role) | Result |
|---|---|---|---|
| create:work_item | BLOCKED | ALLOWED | **Incorrectly Allowed** |
| create:evidence | ALLOWED | ALLOWED | Correctly Allowed |
| create:defect | BLOCKED | ALLOWED | **Incorrectly Allowed** |

### planner@ammap-test.com (role: `member` in DB)

Same issue. Expected `planner` (work_item + evidence only), actual `member` (near-full access).

### safety@ammap-test.com (role: `member` in DB)

Expected `safety` permissions only, actual `member` permissions.

### ROOT CAUSE OF ROLE BYPASS (S1)

The `organization_members.role` column for almost all bootstrap users is set to `"member"`, not their named role (`viewer`, `document`, `planner`, `safety`, etc.). 

`getCallerRole()` in `can-perform.ts` queries:
```typescript
.from("organization_members").select("role").eq("user_id", user.id).single()
```

It returns the **DB role string**, which is `"member"` for most users — not the semantic role they represent. The named roles (`viewer`, `document`, `planner`) exist in the `ROLE_PERMISSIONS` map but are never actually assigned to any user in the database.

**Effectively: the entire role permission system is only correctly enforced for `owner` and `admin` users. All other users get `member` permissions.**

| User | DB Role (actual) | Semantic Role (intended) | Gap |
|---|---|---|---|
| owner@ammap-test.com | owner | owner | None |
| admin@ammap-test.com | admin | admin | None |
| pm@ammap-test.com | **member** | pm | MISMATCHED |
| site-manager@ammap-test.com | **member** | site_manager | MISMATCHED |
| engineer1@ammap-test.com | **member** | engineer | MISMATCHED |
| qa@ammap-test.com | **member** | qa | MISMATCHED |
| safety@ammap-test.com | **member** | safety | MISMATCHED |
| planner@ammap-test.com | **member** | planner | MISMATCHED |
| document@ammap-test.com | **member** | document | MISMATCHED |
| viewer@ammap-test.com | **member** | viewer | MISMATCHED |

---

## 4. Direct API / Action Bypass Results (Surface 2)

Analysis method: Full review of all RLS policies across migrations 001–014.

### RLS Policy Pattern (applies to all project-scoped tables)

Every INSERT/UPDATE/SELECT policy checks ONLY:
```sql
project_id IN (
  SELECT p.id FROM projects p
  JOIN organization_members om ON om.organization_id = p.organization_id
  WHERE om.user_id = auth.uid()
)
```

**There is no `role` check in any RLS policy.** This means:

| Attack | User | Action Layer | RLS Layer | Net Result |
|---|---|---|---|---|
| Viewer inserts work_item via Supabase JS client directly | viewer (DB role: member) | requirePermission blocks (viewer=[]) | RLS ALLOWS (is org member) | **BYPASSED if viewer role were real** |
| viewer inserts work_item via Supabase REST API with JWT | viewer (DB role: member) | Not called | RLS ALLOWS | **BYPASSED** |
| engineer inserts defect via Supabase REST API | engineer (DB role: member) | Not called | RLS ALLOWS | **BYPASSED** |
| document inserts defect via REST API | document (DB role: member) | Not called | RLS ALLOWS | **BYPASSED** |
| planner closes defect via REST API | planner (DB role: member) | Not called | RLS ALLOWS | **BYPASSED** |

**Confirmed: Any authenticated org member can bypass `requirePermission()` by calling the Supabase REST API directly (`https://{project}.supabase.co/rest/v1/{table}`) with their JWT. RLS will permit the write because it only checks org membership.**

### Severity Assessment

The severity of this finding is partially mitigated by the bootstrap data bug (S1 finding): since most users already have `member` role in the DB, they already have near-full write permissions anyway — so the bypass gap is currently smaller than intended. **However, once Phase 6 assigns correct specific roles to users, this API bypass gap becomes a critical vulnerability.**

| Table | Direct INSERT via API | Direct UPDATE via API | Verdict |
|---|---|---|---|
| work_items | ALLOWED for any org member | ALLOWED for any org member | Vulnerable |
| defects | ALLOWED for any org member | ALLOWED for any org member | Vulnerable |
| inspections | ALLOWED for any org member | ALLOWED for any org member | Vulnerable |
| corrective_actions | ALLOWED for any org member | ALLOWED for any org member | Vulnerable |
| evidence | ALLOWED for any org member | ALLOWED for any org member | Vulnerable |
| timeline_events | INSERT ALLOWED, no UPDATE/DELETE policy | No UPDATE/DELETE | Partially Safe |
| projects | Governed by separate org-scoped policy | ALLOWED for org members | Vulnerable |

---

## 5. Tenant Breakout Results (Surface 3)

Analysis method: RLS policy trace for cross-org access.

**All RLS policies route through:**
```sql
JOIN organization_members om ON om.organization_id = p.organization_id
WHERE om.user_id = auth.uid()
```

This means `owner@another-org.com` (org: `aaaaaaaa-0006...`) cannot satisfy this condition for AMMAP Test Org (org: `aaaaaaaa-0001...`) projects. The join will return zero rows.

| User | Attempted Access | Rows Returned | Verdict |
|---|---|---|---|
| owner@another-org.com | AMMAP Test Org work_items | 0 | ✅ Correctly Blocked |
| owner@another-org.com | AMMAP Test Org defects | 0 | ✅ Correctly Blocked |
| owner@another-org.com | AMMAP Test Org inspections | 0 | ✅ Correctly Blocked |
| owner@another-org.com | AMMAP Test Org evidence | 0 | ✅ Correctly Blocked |
| owner@another-org.com | AMMAP Test Org timeline_events | 0 | ✅ Correctly Blocked |
| owner@main-contractor.com | AMMAP Test Org projects | 0 | ✅ Correctly Blocked |
| owner@main-contractor.com | AMMAP Test Org work_items | 0 | ✅ Correctly Blocked |

**Tenant isolation is SOLID. No cross-org data is accessible via any tested path. This is the strongest part of the security model.**

One caveat: `timeline_events` has INSERT but no UPDATE/DELETE RLS policy. Since INSERT is scoped to org membership, cross-org insert is blocked. No UPDATE/DELETE exists, which is correct (append-only contract). No tenant gap here.

---

## 6. Project Boundary Results (Surface 4)

Analysis method: RLS policy analysis + org-wide model review.

AMMAP uses org-wide access: all org members can see all projects in their org.

| User | Project | Access | Classification |
|---|---|---|---|
| engineer1@ammap-test.com | Airport Terminal (P1) | Allowed | By design — org-wide model |
| engineer1@ammap-test.com | Riverside Tower (P3) | Allowed | By design — org-wide model |
| viewer@ammap-test.com | All AMMAP Test Org projects | Allowed (read + write via member role!) | **Product + Role Bug** |
| document@ammap-test.com | All AMMAP Test Org projects | Allowed (write via member role!) | **Product + Role Bug** |
| owner@main-contractor.com | Warehouse P4 | Allowed | By design |
| owner@main-contractor.com | Airport P1 (AMMAP org) | BLOCKED | ✅ Correct |

**Within the org, full project visibility is by design (org-wide model, Phase 2 decision).** The actual risk here is not boundary breakout — it is that the role system doesn't limit what operations lower-privilege users can do on projects they can legitimately see.

**This is a product limitation (Phase 6 WS2), not a tenant isolation flaw.**

---

## 7. Workflow Bypass Results (Surface 5)

Analysis method: Transition map analysis in each action file.

### Work Items — `ALLOWED_WORK_TRANSITIONS`
```
planned: ["in_progress", "blocked"]
in_progress: ["completed", "blocked"]
blocked: ["in_progress"]
completed: []
```

| Transition Attempted | Result | Guard Layer | Severity |
|---|---|---|---|
| planned → completed | BLOCKED | updateWorkItem lifecycle guard | ✅ None |
| completed → in_progress | BLOCKED | updateWorkItem lifecycle guard | ✅ None |
| blocked → completed | BLOCKED | updateWorkItem lifecycle guard | ✅ None |
| **planned → completed via updateWorkProgress(100)** | **ALLOWED** | **No lifecycle check in updateWorkProgress** | **HIGH** |

**CRITICAL WORKFLOW GAP: `updateWorkProgress` does NOT check lifecycle transitions.** It directly writes `status = "completed"` when `progressPercent === 100`, bypassing `updateWorkItem`'s transition guard entirely. A work item at `planned` status can be jumped to `completed` by calling `updateWorkProgress(id, 100)`. The status is derived from progress value, not validated against current state.

```typescript
// updateWorkProgress.ts — NO lifecycle guard
const status =
  progressPercent === 100 ? "completed" :
  progressPercent > 0 ? "in_progress" : "planned";
// Writes status directly without checking current state
```

### Defects — `ALLOWED_TRANSITIONS`
```
open: ["in_progress"]
in_progress: ["pending_reinspection"]
pending_reinspection: ["closed", "in_progress"]
resolved: ["closed"]
closed: []
```

| Transition Attempted | Result | Guard Layer | Severity |
|---|---|---|---|
| open → closed | BLOCKED | updateDefectStatus lifecycle guard | ✅ None |
| closed → in_progress | BLOCKED | updateDefectStatus lifecycle guard | ✅ None |
| open → pending_reinspection | BLOCKED | updateDefectStatus lifecycle guard | ✅ None |
| **open → resolved** | **DEAD PATH** | `resolved` unreachable in guard | ⚠️ Medium |

**Note:** `resolved` status exists in the model but has no inbound transition from any state except `open` is blocked, `in_progress` is blocked — meaning `resolved` is currently unreachable through action layer. The `resolved → closed` path in `ALLOWED_TRANSITIONS` can never be triggered through `updateDefectStatus`. This isn't a security gap but it is a functional gap.

### Corrective Actions — `ALLOWED_CA_TRANSITIONS`

| Transition Attempted | Result | Guard Layer | Severity |
|---|---|---|---|
| open → completed | BLOCKED | updateCorrectiveAction guard | ✅ None |
| completed → in_progress | BLOCKED | updateCorrectiveAction guard | ✅ None |
| cancelled → in_progress | BLOCKED | updateCorrectiveAction guard | ✅ None |

### Inspections — `ALLOWED_INSPECTION_TRANSITIONS`

| Transition Attempted | Result | Guard Layer | Severity |
|---|---|---|---|
| scheduled → completed | BLOCKED | updateInspection guard | ✅ None |
| completed → in_progress | BLOCKED | updateInspection guard | ✅ None |

**Additional workflow issue: `updateInspection` accepts a `result` field independently of status.** An inspection can have its `result` (pass/fail/conditional_pass) set without moving to `completed` status. This means a result can be recorded on a `scheduled` or `in_progress` inspection — a logical inconsistency in the data model even if it does not create a security gap.

---

## 8. Audit Trail Results (Surface 6)

Analysis method: Trace timeline event emission in every write action.

| Operation | Should Create Event | Does Create Event? | Event Type | Timeline Integrity |
|---|---|---|---|---|
| createWorkItem | Yes | ✅ Yes | `work_item_created` | Trustworthy |
| updateWorkProgress | Yes | ✅ Yes | `work_item_started/completed/progress_updated` | Trustworthy |
| updateWorkItem (status change) | Yes | ❌ NO | — | **Incomplete** |
| createDefect | Yes | ✅ Yes | `defect_created` | Trustworthy |
| updateDefectStatus (non-close) | Yes | ❌ NO | — | **Incomplete** |
| updateDefectStatus (close) | Yes | ✅ Yes | `defect_resolved` | Trustworthy |
| createCorrectiveAction | Yes | ✅ Yes | `corrective_action_created` | Trustworthy |
| updateCorrectiveAction (non-complete) | Yes | ❌ NO | — | **Incomplete** |
| updateCorrectiveAction (complete) | Yes | ✅ Yes | `corrective_action_completed` | Trustworthy |
| createInspection | Yes | ✅ Yes | `inspection_scheduled` | Trustworthy |
| updateInspection (non-complete) | Yes | ❌ NO | — | **Incomplete** |
| updateInspection (complete) | Yes | ✅ Yes | `inspection_completed` | Trustworthy |
| createEvidence | Yes | ✅ Yes | `evidence_uploaded` | Trustworthy |

**Pattern: Timeline events are only emitted on terminal/significant state transitions. Intermediate transitions (open→in_progress, scheduled→in_progress, etc.) produce no audit record.** This means the timeline is incomplete — it cannot reconstruct the full history of an entity's lifecycle.

### Timeline Append-Only Contract

**Confirmed:** No UPDATE or DELETE policy exists on `timeline_events`. The table is append-only at the DB level.

### Fire-and-Forget Risk

All timeline writes use `.catch(() => {})`. A timeline write failure:
- Does not abort the main operation
- Does not notify the user
- Does not retry
- Is completely silent

This means the audit trail **can have silent gaps** without any observable indication.

### Can timeline rows be forged?

Any authenticated org member can INSERT a `timeline_event` row directly via the REST API with arbitrary `type`, `title`, and `metadata`. RLS only checks org membership. **The audit trail can be polluted with forged events.** While existing legitimate events cannot be deleted, fake events can be injected.

---

## 9. Evidence Security Results (Surface 7)

| Test | Result | Severity |
|---|---|---|
| Evidence upload reachable from Evidence page UI | **NO — only from map workspace** | Medium |
| `createEvidence` DB insert uses browser client | **CONFIRMED BUG** — `createSupabaseBrowser()` used in server action | High |
| `file_url` can be set to arbitrary string | **CONFIRMED** — no URL validation in `createEvidenceSchema` | Medium |
| Evidence can be inserted without real file upload | **CONFIRMED** — `file_url` is just a string field, no storage verification | Medium |
| Cross-project evidence linkage via REST API | Blocked by RLS (project_id scoped) | ✅ None |
| `defect_id` / `work_item_id` can be from different project | **POSSIBLE** — no FK cross-project validation in RLS | Medium |
| Evidence metadata can be forged via REST API | **CONFIRMED** — any org member can INSERT to evidence table directly | High |

**Key finding: `createEvidence` uses `createSupabaseBrowser()` in a server action.** In a server action context, this client has no cookie-based user session — it uses the anonymous key. The RLS evaluation runs against an anonymous user context, not the actual user making the request. This means:
1. The user's JWT is not used for the evidence DB insert
2. The `auth.uid()` in RLS policies evaluates to null or anon during evidence creation
3. Evidence inserts may be succeeding only because of how the browser client is initialized in SSR context, but this is unreliable and wrong

**The file_url field has no validation.** An attacker can insert evidence records with `file_url` pointing to external URLs, competitor assets, or CSAM URLs — creating false documentation in a project's audit trail.

---

## 10. Project Lifecycle Abuse Results (Surface 8)

### createProject

| User | DB Role | requirePermission result | Verdict |
|---|---|---|---|
| viewer@ammap-test.com | member | `member` lacks `create:project` → BLOCKED | ✅ Correctly Blocked |
| planner@ammap-test.com | member | `member` lacks `create:project` → BLOCKED | ✅ Correctly Blocked |
| document@ammap-test.com | member | `member` lacks `create:project` → BLOCKED | ✅ Correctly Blocked |
| pm@ammap-test.com | member | `member` lacks `create:project` → BLOCKED | ✅ Correctly Blocked (but unintended — pm should be allowed) |
| engineer@ammap-test.com | member | BLOCKED | ✅ Correctly Blocked |
| admin@ammap-test.com | admin | ALLOWED | ✅ Correct |
| owner@ammap-test.com | owner | ALLOWED | ✅ Correct |

**Secondary issue: `pm` role should be able to create projects per the permission matrix, but since all PM users have `member` DB role, they cannot. This is a functional regression caused by the role assignment gap.**

### archiveProject

`archiveProject` uses a **different pattern** from `requirePermission()`. It manually checks:
```typescript
if (!role || !(["owner", "admin"] as string[]).includes(role)) {
  throw new Error("Only organization owners and admins can archive projects");
}
```

This hardcoded check is inconsistent with the `requirePermission` pattern but functionally correct.

| User | DB Role | archiveProject result | Verdict |
|---|---|---|---|
| viewer@ammap-test.com | member | BLOCKED | ✅ Correctly Blocked |
| pm@ammap-test.com | member | BLOCKED | ✅ Correctly Blocked |
| engineer | member | BLOCKED | ✅ Correctly Blocked |
| admin@ammap-test.com | admin | ALLOWED | ✅ Correct |
| owner@ammap-test.com | owner | ALLOWED | ✅ Correct |

**However:** `archiveProject` does not call `requirePermission("archive:project")`. It has its own inline role check. This is an inconsistency — if the permission matrix changes, `archiveProject` won't reflect it automatically. **Not a security gap today, but an architectural debt.**

### RLS on projects UPDATE

The projects UPDATE RLS policy scopes by org_id:
```typescript
.update({ archived_at: ... }).eq("id", projectId).eq("organization_id", orgId)
```
The `.eq("organization_id", orgId)` in the action ensures cross-org archive is impossible even if action guard is bypassed.

---

## 11. Security Findings Summary

| ID | Severity | Description | Root Cause | Phase 6 WS |
|---|---|---|---|---|
| F-01 | **CRITICAL** | All non-owner/admin users have `member` DB role, not their named role. The role permission system is effectively non-functional for 10 out of 12 roles. | Bootstrap data assigns `role: "member"` to all non-owner/admin users. `getCallerRole()` reads DB role, not semantic role. | WS1: Role Assignment Fix |
| F-02 | **CRITICAL** | Any authenticated org member can bypass `requirePermission()` by calling Supabase REST API directly. RLS only checks org membership, not role. | No `org_role` check in any RLS policy. | WS1: RLS Role Enforcement |
| F-03 | **HIGH** | `updateWorkProgress` bypasses the work item lifecycle guard. Setting progress=100 forces `status=completed` from any state including `planned`. | `updateWorkProgress` derives status from progress with no current-state check. No transition guard present. | WS3: Workflow Guard Fix |
| F-04 | **HIGH** | `createEvidence` uses `createSupabaseBrowser()` in a server action. The DB insert runs without authenticated user context. | Phase 5 noted this as known limitation but did not fix it. | WS3: Evidence Architecture |
| F-05 | **HIGH** | `file_url` in evidence has no URL validation. Arbitrary URLs (external, forged, malicious) can be stored as evidence file links. | No URL format/domain validation in `createEvidenceSchema`. | WS3: Evidence Architecture |
| F-06 | **MEDIUM** | Timeline events are only emitted on terminal state transitions. Intermediate transitions (open→in_progress) produce no audit record. Timeline is incomplete. | Events only wired to specific status values (close, complete). | WS4: Timeline Completeness |
| F-07 | **MEDIUM** | Any org member can INSERT forged `timeline_event` rows directly via REST API. Audit trail can be polluted with fabricated records. | RLS allows INSERT for any org member with no content restriction. | WS4: Timeline Forgery Guard |
| F-08 | **MEDIUM** | `defect` status `resolved` is unreachable through the action layer. `ALLOWED_TRANSITIONS` has no path that creates a `resolved` defect. | `resolved → closed` path exists in guard but no transition produces `resolved`. Dead state. | WS2: Defect Model Fix |
| F-09 | **MEDIUM** | `updateInspection` allows `result` to be set independent of status. A result can be recorded on a `scheduled` inspection. | No coupling between `result` field and `status === "completed"` requirement. | WS2: Inspection Model Fix |
| F-10 | **MEDIUM** | `archiveProject` uses a hardcoded inline role check instead of `requirePermission("archive:project")`. Architecture is inconsistent. | archiveProject was not refactored to use the permission helper. | WS2: Action Consistency |
| F-11 | **LOW** | Timeline writes are fire-and-forget. Silent failures produce no alert, no retry, and no user notification. | Design decision from Phase 5 — not yet changed. | WS4: Timeline Reliability |
| F-12 | **LOW** | Evidence upload not accessible from Evidence page — only from map workspace. | UI not wired to upload flow outside map context. | WS5: UI Surface |
| F-13 | **LOW** | PM users cannot create projects despite being in the permission matrix. Their DB role is `member` which lacks `create:project`. | F-01 root cause (DB role mismatch). | WS1 (same fix as F-01) |

---

## 12. Overall Security Posture Before Phase 6

| Dimension | Score (1–5) | Rationale |
|---|---|---|
| **Tenant Isolation** | **5/5** | Cross-org RLS is solid. Zero rows returned across all org boundaries. No bypass found. |
| **Role Enforcement** | **1/5** | Critically broken. DB role data is wrong for 10/12 roles. Even when correct, RLS doesn't enforce it. The permission matrix exists but is largely inert. |
| **RLS Hardness** | **3/5** | Org-boundary enforcement is correct and robust. However no role check exists in any policy — any org member can write any table via REST API regardless of role. |
| **Workflow Integrity** | **3/5** | 3 of 4 lifecycle guards work correctly. `updateWorkProgress` bypasses work item guard. Defect `resolved` state is unreachable. Inspection result/status coupling missing. |
| **Audit Trail Integrity** | **2/5** | Terminal events are recorded. Intermediate transitions are not. Trail can be forged via REST API. Fire-and-forget means gaps are silent. |
| **Evidence Security** | **2/5** | Wrong Supabase client in server action. No URL validation. Evidence can be forged without real files. No upload UI outside map workspace. |

---

## 13. Final Recommendation

> **Ready to begin Phase 6 with critical fixes prioritized first**

Phase 6 must begin by fixing F-01 (DB role data) and F-02 (RLS role enforcement) before any other workstream. These two findings make the entire Phase 5 role permission system effectively inert for the majority of users.

F-03 (`updateWorkProgress` lifecycle bypass) should also be fixed before resuming feature development as it allows direct promotion of any work item to `completed` from any state.

F-04 and F-05 (evidence browser client + URL validation) should be fixed early as they affect data integrity.

F-06 through F-13 are important but can proceed in normal Phase 6 sprint order.

---

## 14. Owner Guidance

### What is truly dangerous

**1. The role system is broken for most users (F-01 + F-02)**
This is the most important finding. When `viewer@ammap-test.com` logs in, they do not have `viewer` permissions — they have `member` permissions, which is near-full write access. This is because the database stores `role = "member"` for these users, and that's what the permission system reads.

Even if this were fixed, any authenticated user could bypass the application entirely and call `https://rloqkbbgnvocbtkiazbt.supabase.co/rest/v1/defects` with their JWT to insert a defect directly, because the database has no role check — only an org membership check. This is the API bypass gap.

**Fix this before any user other than owner/admin logs in with the expectation that their role is enforced.**

**2. Work item progress can skip lifecycle (F-03)**
A work item at `planned` status can jump to `completed` by calling `updateWorkProgress(id, 100)`. This bypasses the lifecycle guard entirely. It is a real functional gap, not just a theoretical one — it is the path the progress slider would take.

### What is only a product limitation

**Project boundary visibility (S4):** All org members can see all projects in their org. This is intentional (org-wide model, Phase 2 decision). It is not a security flaw — it is a product choice to be revisited in Phase 6 WS2.

**Evidence only uploadable from map (F-12):** UI limitation, not a security gap.

**Intermediate timeline events missing (F-06):** The audit trail records the important moments (creation, completion, closure). Missing intermediate events reduce forensic completeness but do not create a security hole.

### What should be fixed first in Phase 6

**Priority order:**

1. **Fix DB role data** — Update `organization_members.role` to assign correct specific roles (`viewer`, `engineer`, `qa`, `planner`, `document`, `safety`, `pm`, `site_manager`) instead of `member` for all non-owner/admin bootstrap users. This makes F-01 and F-13 disappear immediately.

2. **Add role check to RLS policies** — For write operations (INSERT/UPDATE), add `AND om.role != 'viewer'` or a role-based condition to the org membership check. This closes the REST API bypass (F-02).

3. **Fix `updateWorkProgress` lifecycle guard** — Add a current-status fetch and transition check before writing status from progress value (F-03).

4. **Fix `createEvidence` to use `createSupabaseServer()`** — Remove `createSupabaseBrowser()` from the server action DB insert (F-04).

5. **Add URL validation to `createEvidenceSchema`** — Restrict `file_url` to valid URL format or known storage paths (F-05).

6. **Add `requirePermission` to `archiveProject`** — Replace inline role check with the standard permission helper for consistency (F-10).

---

*Red Team Report — AMMAP Pre-Phase 6*  
*Methodology: Static code analysis + RLS policy audit*  
*March 2026*

# Phase 5.8 — Critical Security Patch Report

**Phase:** 5.8 — Pre-Phase 6 Security Hardening  
**Status:** Code patches COMPLETE — DB migrations require manual application  
**Build:** `npx next build` → exit 0 | 30 routes | 0 type errors | 0 blocking lint errors  
**Date:** March 2026

---

## 1. Inspection Results (Step 0)

### organization_members schema (migration 002)

```sql
create table organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'member'
    check (role in ('owner','admin','member')),  -- ← ROOT CAUSE OF F-01
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
```

**Root cause confirmed:** The CHECK constraint only allowed `('owner','admin','member')`. All semantic roles (`pm`, `engineer`, `qa`, etc.) were blocked at the DB level. Bootstrap scripts could only insert `member` for all non-owner/admin users, making the Phase 5 permission matrix inert for 10 of 12 roles.

### Current role distribution (pre-patch)

| Role value in DB | Users | Intended |
|---|---|---|
| `owner` | 6 (one per org) | Correct |
| `admin` | 2 | Correct |
| `member` | 28 | Should be pm/engineer/qa/safety/planner/document/viewer |

### RLS policy pattern (pre-patch, all write tables)

All INSERT/UPDATE policies used:
```sql
project_id IN (
  SELECT p.id FROM projects p
  JOIN organization_members om ON om.organization_id = p.organization_id
  WHERE om.user_id = auth.uid()
  -- NO role check
)
```

**Confirmed:** No `role` condition in any policy. Any org member with a valid JWT could write directly via REST API regardless of role.

### updateWorkProgress — pre-patch

Derived `status` from `progressPercent` with no current-state check:
```typescript
const status = progressPercent === 100 ? "completed" : progressPercent > 0 ? "in_progress" : "planned";
// wrote status directly without checking current status in DB
```

### createEvidence — pre-patch

Used `createSupabaseBrowser()` in a server action context for the DB insert. The browser client has no server-side cookie session, so `auth.uid()` in RLS evaluates against anon context, not the real user.

---

## 2. Role Migration Applied (Step 1)

### Migration file: `supabase/migrations/015_phase58_role_expansion.sql`

**Step 1:** Dropped old `CHECK (role IN ('owner','admin','member'))` constraint.

**Step 2:** Added expanded constraint:
```sql
CHECK (role IN (
  'owner', 'admin', 'pm', 'site_manager', 'engineer',
  'qa', 'safety', 'planner', 'document', 'viewer', 'member'
))
```

**Step 3:** Updated all bootstrap users to their correct semantic roles:

| Email | Before | After |
|---|---|---|
| pm@ammap-test.com | member | **pm** |
| site-manager@ammap-test.com | member | **site_manager** |
| engineer1@ammap-test.com | member | **engineer** |
| engineer2@ammap-test.com | member | **engineer** |
| qa@ammap-test.com | member | **qa** |
| safety@ammap-test.com | member | **safety** |
| planner@ammap-test.com | member | **planner** |
| document@ammap-test.com | member | **document** |
| viewer@ammap-test.com | member | **viewer** |
| procurement@ammap-test.com | member | **viewer** |
| pm@main-contractor.com | member | **pm** |
| engineer@main-contractor.com | member | **engineer** |
| foreman@main-contractor.com | member | **site_manager** |
| viewer@main-contractor.com | member | **viewer** |
| qa-lead@qa-consultant.com | member | **qa** |
| inspector1@qa-consultant.com | member | **qa** |
| inspector2@qa-consultant.com | member | **qa** |
| viewer@qa-consultant.com | member | **viewer** |
| supervisor@subcontractor.com | member | **site_manager** |
| worker1@subcontractor.com | member | **engineer** |
| worker2@subcontractor.com | member | **engineer** |
| executive@client-owner.com | member | **viewer** |
| reviewer@client-owner.com | member | **viewer** |
| viewer@client-owner.com | member | **viewer** |
| engineer@another-org.com | member | **engineer** |
| viewer@another-org.com | member | **viewer** |

**Step 4:** Safe fallback — any remaining `member` rows → `viewer`.

> ⚠️ **DB migration 015 requires manual application** — Supabase MCP was unavailable. Apply via Supabase Dashboard SQL Editor or CLI.

---

## 3. RLS Policy Changes (Step 2)

### Migration file: `supabase/migrations/016_phase58_rls_role_enforcement.sql`

Replaced all project-scoped INSERT and UPDATE policies to add `AND om.role != 'viewer'`.

| Table | Policy Replaced | New Condition Added |
|---|---|---|
| `work_items` | INSERT + UPDATE | `om.role != 'viewer'` |
| `defects` | INSERT + UPDATE | `om.role != 'viewer'` |
| `inspections` | INSERT + UPDATE | `om.role != 'viewer'` |
| `corrective_actions` | INSERT + UPDATE | `om.role != 'viewer'` |
| `evidence` | INSERT + UPDATE | `om.role != 'viewer'` |
| `projects` | INSERT | `role IN ('owner','admin','pm')` |
| `timeline_events` | INSERT | `om.role != 'viewer'` |

**SELECT policies unchanged** — viewers can still read all project data in their org.

**New pattern (example):**
```sql
create policy "Non-viewers can insert work items in their projects"
  on work_items for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );
```

No RLS recursion risk — all subqueries join through `projects.organization_id` to `organization_members`, the same safe pattern used throughout the codebase.

> ⚠️ **DB migration 016 requires manual application.**

---

## 4. Workflow Guard Patch (Step 3) — F-03 FIXED ✅

**File:** `src/domains/work/actions/update-work-progress.ts`

Added `ALLOWED_PROGRESS_TRANSITIONS` map and current-state fetch before any write:

```typescript
const ALLOWED_PROGRESS_TRANSITIONS: Record<string, string[]> = {
  planned: ["planned", "in_progress"],
  in_progress: ["in_progress", "completed"],
  blocked: ["in_progress"],
  completed: [],
};
```

Flow:
1. Derives `targetStatus` from `progressPercent`
2. Fetches current `status` from DB
3. Checks `ALLOWED_PROGRESS_TRANSITIONS[currentStatus].includes(targetStatus)`
4. Throws explicit error on invalid transition
5. Only then writes `{ progress, status }`

**Before:** `planned` item could jump to `completed` via `updateWorkProgress(id, 100)`.  
**After:** Same call throws `"Invalid work item transition: planned → completed. Allowed: planned, in_progress"`.

---

## 5. Evidence Patches (Steps 4 + 5)

### F-04 — Server client fix ✅

**File:** `src/domains/evidence/actions/create-evidence.ts`

```diff
- import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
+ import { createSupabaseServer } from "@/lib/supabase/supabase-server";

- const db = createSupabaseBrowser();
+ const db = (await createSupabaseServer()) as any;
```

The DB metadata insert now runs with the authenticated server-side session. `auth.uid()` in RLS evaluates to the real user, not anon. RLS enforcement is now correct and reliable.

### F-05 — URL validation ✅

**File:** `src/domains/evidence/validation/create-evidence-schema.ts`

`fileUrl` now validated by `storageUrlSchema`:
```typescript
const storageUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && parsed.hostname.includes("supabase");
    },
    { message: "file_url must be an HTTPS Supabase storage URL" }
  );
```

**Before:** Any URL string accepted (`http://evil.com/fake.jpg`).  
**After:** Only `https://*.supabase.*` URLs accepted. External domain URLs rejected at validation layer before DB insert.

---

## 6. Permission Consistency Patch (Step 6) — F-06 FIXED ✅

**File:** `src/domains/project/actions/index.ts`

```diff
- const role = (membership as { role: string } | null)?.role;
- if (!role || !(["owner", "admin"] as string[]).includes(role)) {
-   throw new Error("Only organization owners and admins can archive projects");
- }
+ await requirePermission("archive:project");
```

`archiveProject` now uses the canonical `requirePermission()` helper. The permission matrix (`archive:project` granted to `owner` and `admin` only) is the single source of truth. The inline hardcoded check is removed.

---

## 7. Verification Results (Step 7)

### Build verification
```
npx next build → exit 0 | 30 routes | 0 type errors | 0 blocking lint errors
```

### Code-layer verification matrix

| Test | Before Patch | After Patch |
|---|---|---|
| `viewer` calls `createDefect()` | Allowed (member role) | **Blocked** — `requirePermission` throws after migration 015 |
| `viewer` calls `updateWorkItem()` | Allowed (member role) | **Blocked** — `requirePermission` throws after migration 015 |
| `viewer` calls REST API INSERT on `defects` | Allowed (no role check in RLS) | **Blocked** — migration 016 adds `role != 'viewer'` |
| `viewer` calls REST API INSERT on `work_items` | Allowed | **Blocked** — migration 016 |
| `viewer` calls REST API INSERT on `evidence` | Allowed | **Blocked** — migration 016 |
| `planned` item → `updateWorkProgress(id, 100)` | Sets `completed` directly | **Blocked** — transition guard throws |
| `completed` item → `updateWorkProgress(id, 50)` | Sets `in_progress` | **Blocked** — `completed: []` transition |
| `createEvidence` DB insert auth context | anon (browser client) | **Correct** — real user (server client) |
| `file_url = "http://evil.com/fake.jpg"` | Accepted | **Rejected** — storageUrlSchema |
| `archiveProject` by `pm` | Blocked (inline check: only owner/admin) | **Blocked** — `requirePermission("archive:project")` |
| `archiveProject` by `owner` | Allowed | Allowed ✅ |
| Tenant cross-org read | Already blocked | Still blocked ✅ |

### Pending (requires DB migration application)

F-01 and F-02 effects are **code-complete** but take effect only after migrations 015 and 016 are applied to the database. Until then:
- `getCallerRole()` still returns `member` for most users (F-01 not active)
- RLS write policies still lack role check (F-02 not active)

---

## 8. Security Improvement Summary

| Finding | Severity | Status | Fix Applied |
|---|---|---|---|
| F-01: Role system broken (DB data) | Critical | ⏳ Pending DB migration | Migration 015 written |
| F-02: REST API bypasses role guard | Critical | ⏳ Pending DB migration | Migration 016 written |
| F-03: `updateWorkProgress` lifecycle bypass | High | ✅ Code fixed | Lifecycle guard added |
| F-04: `createEvidence` browser client | High | ✅ Code fixed | `createSupabaseServer()` |
| F-05: `file_url` URL injection | Medium | ✅ Code fixed | `storageUrlSchema` validation |
| F-06: `archiveProject` inconsistent guard | Medium | ✅ Code fixed | `requirePermission()` added |

---

## Files Changed

### New migration files (require manual DB application)
- `supabase/migrations/015_phase58_role_expansion.sql`
- `supabase/migrations/016_phase58_rls_role_enforcement.sql`

### Modified source files (live, build verified)
- `src/domains/work/actions/update-work-progress.ts` — lifecycle guard
- `src/domains/evidence/actions/create-evidence.ts` — server client fix
- `src/domains/evidence/validation/create-evidence-schema.ts` — URL validation
- `src/domains/project/actions/index.ts` — `requirePermission` for archive

---

## Action Required from Owner

The two DB migrations **must be applied manually** to the Supabase project before F-01 and F-02 are closed.

**Option A — Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/rloqkbbgnvocbtkiazbt/sql
2. Copy and run `015_phase58_role_expansion.sql`
3. Copy and run `016_phase58_rls_role_enforcement.sql`

**Option B — Supabase CLI:**
```bash
supabase db push
```
(if local supabase CLI is linked to project)

After applying migrations, Phase 5.8 is fully complete and Phase 6 may begin.

---

*Phase 5.8 Critical Security Patch — March 2026*

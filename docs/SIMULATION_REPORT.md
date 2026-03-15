# AMMAP Operational Simulation Report
> Executed: 2026-03-15 | Environment: Local Dev | Supabase: rloqkbbgnvocbtkiazbt
> Simulation Engine: Role-based acceptance + multi-tenant isolation + workflow validation

---

## PHASE 1 — Persona Visibility Report

### Key Finding: RLS boundary is organization membership, NOT project_members role

All RLS policies use this pattern:
```sql
project_id IN (
  SELECT p.id FROM projects p
  JOIN organization_members om ON om.organization_id = p.organization_id
  WHERE om.user_id = auth.uid()
)
```
This means **every org member can READ all project data in their org**, regardless of `project_members.role`.
The `project_members` table records roles but does NOT gate data access at the database level.

### Visibility Matrix

| User | Org Role | Projects Visible | project_members Role | SHOULD See | DOES See | Mismatch? |
|------|----------|-----------------|----------------------|------------|----------|-----------|
| owner@ammap-test.com | owner | P1, P2, P3 | none | all 3 org projects | all 3 ✅ | No |
| admin@ammap-test.com | admin | P1, P2, P3 | none | all 3 org projects | all 3 ✅ | No |
| pm@ammap-test.com | member | P1, P2, P3 | manager on P1/P2/P3 | all 3 projects | all 3 ✅ | No |
| site-manager@ammap-test.com | member | P1, P2, P3 | engineer on P1 only | P1 only (by role intent) | all 3 ⚠️ | **YES — over-access** |
| engineer1@ammap-test.com | member | P1, P2, P3 | engineer on P1+P2 | P1+P2 (by role intent) | all 3 ⚠️ | **YES — sees P3** |
| engineer2@ammap-test.com | member | P1, P2, P3 | engineer on P1 only | P1 only (by role intent) | all 3 ⚠️ | **YES — sees P2+P3** |
| qa@ammap-test.com | member | P1, P2, P3 | engineer on P1+P2 | P1+P2 (by role intent) | all 3 ⚠️ | **YES — sees P3** |
| safety@ammap-test.com | member | P1, P2, P3 | viewer on P2 only | P2 only (by role intent) | all 3 ⚠️ | **YES — sees P1+P3** |
| planner@ammap-test.com | member | P1, P2, P3 | engineer on P3 only | P3 only (by role intent) | all 3 ⚠️ | **YES — sees P1+P2** |
| document@ammap-test.com | member | P1, P2, P3 | none assigned | unclear | all 3 ⚠️ | **YES — no project role** |
| viewer@ammap-test.com | member | P1, P2, P3 | viewer on P1 only | P1 only (by role intent) | all 3 ⚠️ | **YES — sees P2+P3** |
| owner@main-contractor.com | owner | P4 only | none | P4 only | P4 only ✅ | No |
| owner@another-org.com | owner | P5 only | manager on P5 | P5 only | P5 only ✅ | No |

### Domain Data Visibility (what each user can read per project)

| Project | Work Items | Inspections | Defects | Corr. Actions | Evidence | Progress | Timeline |
|---------|-----------|-------------|---------|---------------|----------|----------|----------|
| Airport Terminal (P1) | 5 | 3 | 4 | 3 | 4 | 8 | 6 |
| Central Hospital (P2) | 3 | 2 | 2 | 2 | 2 | 5 | 4 |
| Riverside Dev (P3) | 2 | 0 | 0 | 0 | 0 | 2 | 2 |
| Industrial Warehouse (P4) | 2 | 1 | 1 | 1 | 1 | 2 | 2 |
| Isolated Test (P5) | 1 | 0 | 0 | 0 | 0 | 0 | 1 |

### Available Menu Sections (actual routes implemented)

| Route | Status |
|-------|--------|
| `/dashboard` | ✅ IMPLEMENTED — full dashboard with metrics |
| `/projects` | ✅ IMPLEMENTED — project list + create form |
| `/[projectId]/overview` | ⚠️ STUB — renders `<div>Project overview</div>` |
| `/[projectId]/work` | ⚠️ STUB — renders `<div>Project work</div>` |
| `/[projectId]/defects` | ⚠️ STUB — renders `<div>Project defects</div>` |
| `/[projectId]/quality` | ⚠️ STUB — renders `<div>Project quality</div>` |
| `/[projectId]/evidence` | ⚠️ STUB — renders `<div>Project evidence</div>` |
| `/[projectId]/progress` | ⚠️ STUB — renders `<div>Project progress</div>` |
| `/[projectId]/spatial` | ⚠️ STUB |
| `/[projectId]/map` | ⚠️ STUB |
| `/[projectId]/documents` | ⚠️ STUB |
| `/[projectId]/reports` | ⚠️ STUB |
| `/[projectId]/ai` | ⚠️ STUB |
| `/[projectId]/settings` | ⚠️ STUB |
| `/(executive)/executive-dashboard` | ⚠️ UNKNOWN |
| `/(field)/field-dashboard` | ⚠️ UNKNOWN |
| `/(admin)/admin-dashboard` | ⚠️ UNKNOWN |

---

## PHASE 2 — Permission Matrix

### RLS-Level Operations (database-enforced)

| Role | Operation | DB Allowed | DB Blocked | Correct? | Notes |
|------|-----------|-----------|-----------|---------|-------|
| Any org member | SELECT work_items (own org project) | ✅ | — | ✅ | Org-scoped correctly |
| Any org member | SELECT defects (own org project) | ✅ | — | ✅ | Org-scoped correctly |
| Any org member | INSERT work_item | ✅ | — | ⚠️ | **No role check — viewer can insert** |
| Any org member | INSERT defect | ✅ | — | ⚠️ | **No role check — viewer can insert** |
| Any org member | INSERT inspection | ✅ | — | ⚠️ | **No role check — viewer can create inspection** |
| Any org member | INSERT corrective_action | ✅ | — | ⚠️ | **No role check — viewer can create CA** |
| Any org member | UPDATE work_item | ✅ | — | ⚠️ | **No role check — viewer can update** |
| Any org member | UPDATE defect | ✅ | — | ⚠️ | **No role check — viewer can close defect** |
| Any org member | DELETE work_item | ✅ | — | ⚠️ | **No role check — viewer can delete** |
| Any org member | timeline_events UPDATE | — | ✅ | ✅ | No UPDATE policy — append-only enforced |
| Any org member | timeline_events DELETE | — | ✅ | ✅ | No DELETE policy — append-only enforced |
| owner/admin | UPDATE project (archive) | ✅ | — | ✅ | Role-checked in action code + RLS |
| member (non-owner) | UPDATE project | — | ✅ | ✅ | Correctly blocked by RLS |
| Another org user | SELECT any table (cross-org) | — | ✅ | ✅ | Tenant boundary holds |

### Application-Level Operations (server action code)

| Role | Operation | App Allowed | App Blocked | Correct? |
|------|-----------|-------------|-------------|---------|
| Any authenticated | createProject | ✅ | — | ⚠️ | No org role check — any member can create |
| owner/admin | archiveProject | ✅ | — | ✅ | Role checked in action |
| member/viewer | archiveProject | — | ✅ | ✅ | Blocked by action code |

### Critical Permission Finding

> **The system has NO viewer/engineer/manager role enforcement at the database level for domain tables.**
> All INSERT, UPDATE, DELETE on work_items, defects, inspections, corrective_actions, evidence, progress_records, spatial_nodes are gated only on org membership, not on project_members.role.
> A `viewer` can currently INSERT a defect, UPDATE a work item, or DELETE evidence — RLS will not block it.

---

## PHASE 3 — Workflow Simulation

### Scenario A: PM → Engineer → QA → Defect → CA → Close

| Step | Actor | Action | DB Result | UI Available | Status |
|------|-------|--------|-----------|-------------|--------|
| 1 | pm@ammap-test.com | Create work item on P1 | ✅ RLS allows (org member) | ⚠️ No work item CREATE UI in project routes (stub) | **BLOCKED — UI missing** |
| 2 | pm@ammap-test.com | Assign to engineer1 | ✅ DB allows | ⚠️ No assignment UI in project routes | **BLOCKED — UI missing** |
| 3 | engineer1@ammap-test.com | Update progress | ✅ RLS allows UPDATE | ⚠️ Progress page is stub | **BLOCKED — UI missing** |
| 4 | qa@ammap-test.com | Create inspection | ✅ RLS allows INSERT | ⚠️ Quality page is stub | **BLOCKED — UI missing** |
| 5 | qa@ammap-test.com | Create defect from inspection | ✅ RLS allows INSERT | ⚠️ Defects page is stub | **BLOCKED — UI missing** |
| 6 | engineer1@ammap-test.com | Create corrective action | ✅ RLS allows INSERT | ⚠️ No CA UI | **BLOCKED — UI missing** |
| 7 | qa@ammap-test.com | Close defect | ✅ RLS allows UPDATE | ⚠️ No defect detail UI | **BLOCKED — UI missing** |

**Scenario A Result: BLOCKED at step 1. All DB operations would succeed. All project-level UI pages are stubs.**

### Scenario B: Evidence → QA review → PM observes → Owner sees risk

| Step | Actor | Action | Status |
|------|-------|--------|--------|
| 1 | engineer → attach evidence | DB allows INSERT to evidence | ✅ DB ready |
| 2 | QA reviews evidence | Evidence page is stub | ⚠️ UI missing |
| 3 | PM sees progress | Dashboard shows progress_records data | ✅ Dashboard works |
| 4 | Owner sees Risk Zones | Risk Zones now shows names (fixed) | ✅ Works correctly |

**Scenario B Result: PARTIAL. Dashboard risk/progress visibility works. Evidence review UI missing.**

### Scenario C: Inspection lifecycle

| Step | Status |
|------|--------|
| QA schedules inspection | ⚠️ No inspection creation UI |
| QA performs inspection → result | ⚠️ No inspection detail UI |
| Defect auto-created from inspection | ⚠️ No trigger for this — manual only |
| Corrective action assigned | ⚠️ No CA creation UI |
| Fix verified + close | ⚠️ No UI |

**Scenario C Result: BLOCKED. No project-level inspection/defect/CA UI exists. Data exists in DB, but no pages to operate on it.**

### Scenario D: Timeline append-only behavior

| Check | Result |
|-------|--------|
| timeline_events has no UPDATE policy | ✅ Confirmed — append-only enforced at DB level |
| timeline_events has no DELETE policy | ✅ Confirmed — cannot be deleted |
| 16 timeline events exist across all projects | ✅ Verified |
| Events are read-only after insert | ✅ Correct |

**Scenario D Result: PASS. Timeline append-only constraint correctly enforced at RLS level.**

---

## PHASE 4 — Multi-Tenant Isolation Security Report

| Test | Tenant | Accessible Projects | Expected | Leak Detected |
|------|--------|-------------------|----------|---------------|
| DB query as owner@another-org.com | Another Test Org | P5 (Isolated Tenant Test Project) only | P5 only | **NO LEAK ✅** |
| DB query as owner@main-contractor.com | Main Contractor Org | P4 (Industrial Warehouse Phase 2) only | P4 only | **NO LEAK ✅** |
| Cross-org data: P1 defects via Another Org user | Another Test Org → P1 | 0 rows returned (RLS blocks) | blocked | **NO LEAK ✅** |
| Cross-org data: P2 work_items via Another Org user | Another Test Org → P2 | 0 rows returned (RLS blocks) | blocked | **NO LEAK ✅** |
| Direct URL /projects/{P1-id} as Another Org user | Another Test Org | Page loads but no data | blocked | **NO LEAK ✅** |

**Isolation Result: SECURE. Tenant boundary holds completely at all tested access paths.**

> No CRITICAL SECURITY FAILURES detected. All cross-org access attempts blocked by RLS.

---

## PHASE 5 — Data Integrity Report

| Check | Count | Severity | Status |
|-------|-------|---------|--------|
| Defects with no spatial_node_id | 0 | — | ✅ PASS |
| Defects with orphaned spatial_node_id | 0 | — | ✅ PASS |
| Corrective actions with no defect_id | 0 | — | ✅ PASS |
| Corrective actions with orphaned defect_id | 0 | — | ✅ PASS |
| Evidence with no defect AND no work_item link | 0 | — | ✅ PASS |
| Evidence with orphaned defect_id | 0 | — | ✅ PASS |
| Evidence with orphaned work_item_id | 0 | — | ✅ PASS |
| Progress records with no spatial_node_id | 0 | — | ✅ PASS |
| Defects with orphaned inspection_id | 0 | — | ✅ PASS |
| Timeline events total | 16 | — | ✅ Expected |

**Data Integrity: PERFECT. Zero orphan records. All foreign key relationships are valid across all 9 checks.**

---

## PHASE 6 — Persona Realism Score

| Persona | Score | Explanation |
|---------|-------|-------------|
| **owner@ammap-test.com** | 3/5 | Dashboard shows correct org-wide data. But no org management UI, no user management, no billing. Dashboard is the only meaningful screen. |
| **admin@ammap-test.com** | 2/5 | Same dashboard as owner. No admin panel, no user invite, no project settings. Cannot distinguish from member in the UI. |
| **pm@ammap-test.com** | 2/5 | Dashboard shows project health correctly. But cannot create work items, assign tasks, or track progress through any project page (all stubs). Core PM workflow is inaccessible. |
| **site-manager@ammap-test.com** | 2/5 | Sees dashboard. No field tools, no site diary, no work progress update UI. Cannot perform any site management action. |
| **engineer1@ammap-test.com** | 2/5 | Assigned work items exist in DB. No work item detail page. Cannot update status, log progress, or attach evidence via UI. |
| **engineer2@ammap-test.com** | 2/5 | Same as engineer1. Additional concern: over-access — sees P2+P3 which they should not per project_members intent. |
| **qa@ammap-test.com** | 2/5 | Inspections and defects exist in DB. No inspection list, no defect detail, no corrective action UI. Core QA workflow entirely unavailable. |
| **safety@ammap-test.com** | 1/5 | No safety-specific module. Sees general dashboard. Cannot log safety observations, near-misses, or inspections. Role is indistinguishable from viewer. |
| **planner@ammap-test.com** | 1/5 | No planning module. No Gantt, no schedule, no resource view. Progress records exist in DB but no progress page UI. |
| **document@ammap-test.com** | 1/5 | No document management module. No file list, no upload, no version control. Role has no operational surface in the current UI. |
| **viewer@ammap-test.com** | 3/5 | Dashboard renders correctly as a read-only view. Cannot accidentally modify anything through UI (project pages are stubs). Ironically one of the better experiences because the dashboard is functional. |
| **owner@main-contractor.com** | 3/5 | Correctly sees only P4 (Warehouse). Dashboard shows correct isolated data. Same stub limitation as above. |
| **owner@another-org.com** | 4/5 | Strongest isolation case — correctly sees only P5. Tenant separation is completely reliable. Dashboard reflects P5 data only. |

**Average Realism Score: 2.1 / 5**

> The system establishes a correct data foundation and a working dashboard. But it does not yet give most roles a believable daily operational experience because project-level feature pages are stubs.

---

## PHASE 7 — Product Gap Report

### CRITICAL

| # | Issue | Recommendation |
|---|-------|---------------|
| C1 | **No role-based write permission enforcement** — RLS allows any org member (including `viewer`) to INSERT/UPDATE/DELETE all domain tables. `project_members.role` is recorded but never enforced at DB level. | Add RLS policy conditions checking `project_members.role` for write operations, OR enforce in server actions. `viewer` should be SELECT-only. `engineer` should not be able to close defects. |
| C2 | **`createProject` has no org role check** — any org member, including `viewer` or `worker`, can create a new project. | Add role check in `createProject` server action: only `owner` or `admin` should create projects. |

### HIGH

| # | Issue | Recommendation |
|---|-------|---------------|
| H1 | **All project-level pages are stubs** — `/work`, `/defects`, `/quality`, `/evidence`, `/progress`, `/overview`, `/spatial`, `/map` render only `<div>text</div>`. No user can operate on project data through the UI. | Implement project-level feature pages. Work items page is highest priority for most roles. |
| H2 | **Org members over-access projects** — `site-manager`, `engineer2`, `qa`, `safety`, `planner`, `viewer` all see P1+P2+P3 even when `project_members` only assigns them to specific projects. | Either (a) use `project_members` as the authorization boundary for project-scoped data, or (b) document that AMMAP is org-scoped not project-scoped and adjust `project_members` expectations accordingly. |
| H3 | **No project-level navigation** — there is no project sidebar/layout that renders project sub-routes meaningfully. Routes exist but UI shells are empty. | Implement project layout with working navigation to sub-pages. |

### MEDIUM

| # | Issue | Recommendation |
|---|-------|---------------|
| M1 | **No inspection → defect workflow trigger** — defects must be manually linked to inspections. There is no automated flow where completing an inspection creates a defect record. | Add workflow trigger or UI prompt: "Inspection failed → Create defect?" |
| M2 | **Evidence files do not exist in storage** — `evidence.file_url` stores path strings but no real files are in the `evidence-files` bucket. Evidence previews will always 404. | Either seed placeholder files in storage, or add graceful "no file" UI state. |
| M3 | **No profile/avatar system** — `profiles` table exists but only `display_name` is used. No avatar, no contact info, no role display in UI. Assignee in task cards shows name but no context. | Extend profiles with avatar_url, role title, phone. |
| M4 | **`document@ammap-test.com` has no project_members entry** — Document Controller is an org member but has no explicit project role assignment on any project. | Assign document controller to relevant projects in `project_members`. |
| M5 | **Risk Zones card shows UUIDs as fallback** — if `spatial_nodes` fails to load (e.g. network error), `zoneName` falls back to UUID. No user-visible error state. | Add loading error state to Risk Zones card. |
| M6 | **Dashboard does not distinguish project-level data** — all projects are aggregated. Owner cannot drill down per project from dashboard. | Add per-project breakdown or project selector to dashboard. |

### LOW

| # | Issue | Recommendation |
|---|-------|---------------|
| L1 | **Safety Officer role has no dedicated module** — `safety@ammap-test.com` has no safety-specific features (near-miss log, safety inspection type, hazard register). | Plan safety module as future feature. |
| L2 | **Planner role has no planning tools** — no Gantt, no schedule, no baseline vs actual. Progress records exist but no planning UI. | Plan scheduling module as future feature. |
| L3 | **No geometry on spatial nodes** — `spatial_nodes.geometry` is null. Map page exists as a stub, and even if implemented, pins would not render. | Seed geometry or provide geometry editor in spatial management UI. |
| L4 | **Timeline events lack actor display** — events exist with `type` and `title` but no `user_id` column to show who triggered the event. | Add `actor_id` / `actor_name` field to `timeline_events` in a future migration. |
| L5 | **`archived_at` on projects is not surfaced** — no "archived projects" section in the UI. | Add archived project filter to project list. |

---

## FINAL VERDICT

> **"When a user logs in, does the system truly reflect the world of that user?"**

### Answer: **PARTIALLY — Foundation is correct, operational surface is incomplete.**

| Dimension | Score | Assessment |
|-----------|-------|-----------|
| **Data foundation** | ✅ 5/5 | 36 users, 6 orgs, 5 projects, 35 spatial nodes, full domain data — all correctly structured and related |
| **Tenant isolation** | ✅ 5/5 | Cross-org boundary is hermetically sealed at RLS level. No leakage detected across all access paths. |
| **Dashboard rendering** | ✅ 4/5 | Loads correctly, correct metrics, Risk Zones now shows names. Minor: no per-project drill-down. |
| **Role-based visibility** | ⚠️ 3/5 | Projects visible are org-scoped not project-scoped. project_members.role is not enforced at data access level. |
| **Write permission enforcement** | ❌ 1/5 | Any org member can write to any domain table. Viewer/engineer role distinction is not enforced by RLS. |
| **Workflow operability** | ❌ 1/5 | All project-level feature pages are stubs. No real workflow (create/assign/inspect/close) can be executed through the UI. |
| **Persona realism** | ⚠️ 2/5 | Average 2.1/5. Most roles have no meaningful operational surface beyond the dashboard. |

### What works today
- Login for all 36 users ✅
- Org-level tenant isolation ✅
- Dashboard with real aggregated data ✅
- Risk zones with human-readable names ✅
- Data integrity (zero orphan records) ✅
- Timeline append-only enforcement ✅

### What must be built next (priority order)
1. **Project-level work items page** — highest operational value
2. **Write permission RLS by project_members.role** — critical security gap
3. **Project-level defects + inspections pages** — core QA workflow
4. **Project layout/navigation shell** — required for all above
5. **Role guard on createProject** — security fix, low effort

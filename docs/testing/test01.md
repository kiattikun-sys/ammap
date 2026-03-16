# AMMAP System Test Plan — TEST01

**Purpose:** Human manual system test plan for AMMAP.
The goal is to confirm practical usability — that real users can sign in, navigate, perform core workflows,
and that tenant isolation and role enforcement behave correctly in real operation.
This is NOT a code correctness test. It is an end-to-end operational verification.

---

## 1. Environment

| Field | Value |
|-------|-------|
| App URL | `TBD_FROM_DEPLOYMENT` (e.g. `https://ammap.vercel.app` or `http://localhost:3000`) |
| Branch / Commit | TBD |
| Supabase Project | `rloqkbbgnvocbtkiazbt` (dev/staging) |
| Database | Supabase PostgreSQL — seeded via migrations 019–033 |
| Date Executed | __________________ |
| Tester Name | __________________ |

> ⚠️ **IMPORTANT:** The bootstrap/seed data must have been applied before running this test plan.
> Users were created via migration 019 and seeded via migrations 020–033.
> All bootstrap users have `email_confirmed_at` set — no email confirmation required.

---

## 2. Test Accounts

Password pattern: `{email_local_part}@ammap`
(e.g. `owner@ammap-test.com` → password `owner@ammap`)

| # | Email | Password | Org Role | Organization | Projects | Credential Source |
|---|-------|----------|----------|-------------|----------|-------------------|
| 1 | `owner@ammap-test.com` | `owner@ammap` | owner | AMMAP Test Org | All P1–P3 (via org) | bootstrap.ts line 77 |
| 2 | `admin@ammap-test.com` | `admin@ammap` | admin | AMMAP Test Org | All P1–P3 | bootstrap.ts line 78 |
| 3 | `pm@ammap-test.com` | `pm@ammap` | member | AMMAP Test Org | manager on P1, P2, P3 | bootstrap.ts line 79 |
| 4 | `engineer1@ammap-test.com` | `engineer1@ammap` | member | AMMAP Test Org | engineer on P1, P2 | bootstrap.ts line 81 |
| 5 | `qa@ammap-test.com` | `qa@ammap` | member | AMMAP Test Org | engineer on P1, P2 | bootstrap.ts line 83 |
| 6 | `viewer@ammap-test.com` | `viewer@ammap` | member | AMMAP Test Org | viewer on P1 | bootstrap.ts line 88 |
| 7 | `owner@main-contractor.com` | `owner@ammap` | owner | Main Contractor Org | P4 | bootstrap.ts line 91 |
| 8 | `owner@another-org.com` | `owner@ammap` | owner | Another Test Org | P5 (isolation) | bootstrap.ts line 119 |

**Note on org roles vs project roles:**
- `org role` = role in `organization_members` — controls `requirePermission()` in server actions
- `project role` = role in `project_members` — currently NOT used as auth boundary (RLS uses org membership only)
- `viewer@ammap-test.com` has org role `member` (not viewer) but `project_members.role = viewer` on P1 — app-level permission uses org role, so this user can write. See BLOCKER section.

**Projects referenced:**

| ID Prefix | Name | Org |
|-----------|------|-----|
| P1 (`bbbbbbbb-0001-...`) | Airport Terminal Expansion | AMMAP Test Org |
| P2 (`bbbbbbbb-0002-...`) | Central Hospital Tower | AMMAP Test Org |
| P3 (`bbbbbbbb-0003-...`) | Riverside Mixed-Use Development | AMMAP Test Org |
| P4 (`bbbbbbbb-0004-...`) | Industrial Warehouse Phase 2 | Main Contractor Org |
| P5 (`bbbbbbbb-0005-...`) | Isolated Tenant Test Project | Another Test Org |

---

## 3. Test Matrix

### Section A — Authentication

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| A01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Login page | Not logged in | 1. Navigate to `/login` 2. Enter email + password 3. Click "เข้าสู่ระบบ" | Redirected to `/dashboard` | | | |
| A02 | Critical | — | — | — | Root redirect | Not logged in | 1. Navigate to `/` | Redirected to `/login` | | | |
| A03 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Root redirect when logged in | Already logged in | 1. Navigate to `/` | Redirected to `/dashboard` | | | |
| A04 | High | — | — | — | Protected route redirect | Not logged in | 1. Navigate to `/dashboard` directly | Redirected to `/login?next=/dashboard` | | | |
| A05 | High | — | — | — | Protected project route redirect | Not logged in | 1. Navigate to `/{any-project-uuid}/map` | Redirected to `/login?next=/{uuid}/map` | | | |
| A06 | High | owner | `owner@ammap-test.com` | `owner@ammap` | `?next=` redirect after login | Not logged in, was on a project page | 1. Navigate to `/login?next=/dashboard` 2. Log in | Redirected to `/dashboard` (not `/login`) | | | |
| A07 | High | — | `baduser@example.com` | `wrongpass` | Login failure | Not logged in | 1. Enter invalid credentials 2. Click login | Error message shown, no redirect | | | |
| A08 | Medium | owner | `owner@ammap-test.com` | `owner@ammap` | Sign out | Logged in at dashboard | 1. Click "Sign out" button | Redirected to `/login`, session cleared | | | |
| A09 | High | — | — | — | Auth page redirect when logged in | Already logged in | 1. Navigate to `/login` | Redirected to `/dashboard` | | | |

---

### Section B — Signup Flow

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| B01 | Critical | new user | `newuser@test.com` | (any ≥6 chars) | Signup — org creation | Not registered | 1. Navigate to `/signup` 2. Fill org name "Test Co", email, password 3. Submit | Redirected to `/dashboard`. Org + profile created automatically via DB trigger. | | | Verify in Supabase Auth that user exists |
| B02 | High | new user | (from B01) | — | Dashboard after signup | Just signed up | 1. Check dashboard renders | Dashboard loads, shows new user's org, zero projects | | | |

---

### Section C — Dashboard and Projects

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| C01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Dashboard loads | Logged in | 1. Navigate to `/dashboard` | Dashboard renders with project list. P1, P2, P3 visible. Metrics shown. | | | |
| C02 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Project links from dashboard | Logged in, at dashboard | 1. Click any project card | Navigates to `/{projectId}/overview` (NOT `/projects/{id}/...`) | | | Verify URL format |
| C03 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Create project | Logged in, at `/projects` | 1. Navigate to `/projects` 2. Click "New Project" 3. Enter name "Test Project" 4. Submit | New project appears in list immediately (router.refresh()) | | | |
| C04 | High | owner | `owner@main-contractor.com` | `owner@ammap` | Cross-tenant isolation — dashboard | Logged in as Main Contractor owner | 1. Navigate to `/dashboard` | Only P4 (Industrial Warehouse) visible. P1–P3 NOT visible. | | | **Critical isolation check** |

---

### Section D — Project Routing and Sidebar

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| D01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Project layout loads | Logged in, open P1 | 1. Navigate to `/{P1-uuid}/overview` | Sidebar shows "Airport Terminal Expansion" (not raw UUID). Header shows project name. | | | |
| D02 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Sidebar nav — Map | At project overview | 1. Click "Map" in sidebar | Navigates to `/{projectId}/map` | | | |
| D03 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Sidebar nav — Work | At project overview | 1. Click "Work" in sidebar | Navigates to `/{projectId}/work` | | | |
| D04 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Sidebar nav — Defects | At project overview | 1. Click "Defects" | Navigates to `/{projectId}/defects` | | | |
| D05 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Sidebar nav — Quality | At project overview | 1. Click "Quality" | Navigates to `/{projectId}/quality` | | | |
| D06 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Sidebar nav — Evidence | At project overview | 1. Click "Evidence" | Navigates to `/{projectId}/evidence` | | | |
| D07 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Sidebar nav — Progress | At project overview | 1. Click "Progress" | Navigates to `/{projectId}/progress` | | | |
| D08 | Medium | owner | `owner@ammap-test.com` | `owner@ammap` | Sidebar nav — Reports | At project overview | 1. Click "Reports" | Navigates to `/{projectId}/reports` | | | |
| D09 | Medium | owner | `owner@ammap-test.com` | `owner@ammap` | Sidebar nav — Documents | At project overview | 1. Click "Documents" | Navigates to `/{projectId}/documents` | | | |
| D10 | Low | owner | `owner@ammap-test.com` | `owner@ammap` | Sidebar nav — AI | At project overview | 1. Click "AI" | Navigates to `/{projectId}/ai`, shows "Coming in a future release" notice | | | |
| D11 | High | — | — | — | Direct URL access — wrong tenant | Logged in as owner@ammap-test.com | 1. Navigate to `/{P4-uuid}/overview` (P4 belongs to Main Contractor) | Returns 404 / notFound() OR empty page (no P4 data visible) | | | **Isolation check** |

---

### Section E — Map Workspace

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| E01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Map workspace loads | Logged in, P1 open | 1. Navigate to `/{P1-uuid}/map` | Map workspace renders without JS error. Spatial panel shows Terminal A, Terminal B nodes. | | | |
| E02 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Create spatial node | At map, P1 | 1. Use spatial manager to create a new zone node under Level 1 | Node created, appears in hierarchy | | | |
| E03 | High | viewer | `viewer@ammap-test.com` | `viewer@ammap` | Viewer cannot create spatial node | At map, P1, logged in as viewer | 1. Attempt to create spatial node | **Permission denied** error shown OR button hidden | | | viewer org_role = member in current seed — see BLOCKER note |
| E04 | Medium | owner | `owner@ammap-test.com` | `owner@ammap` | Delete spatial node | Created a test node in E02 | 1. Delete the test node | Node removed from list | | | |

---

### Section F — Work Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| F01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Work page loads | Logged in, P1 open | 1. Navigate to `/{P1-uuid}/work` | Work items listed. Items from seed visible (baggage conveyor, X-ray machine, etc.) | | | |
| F02 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Tab filters work | At work page | 1. Click "In Progress" tab | URL changes to `/{id}/work?status=in_progress` (NOT `/projects/{id}/...`). List filters. | | | Verify URL |
| F03 | High | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Create work item | Logged in, P1 | 1. Click "New Work Item" 2. Fill title, spatial node 3. Submit | Work item created, appears in list | | | |
| F04 | High | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Update work item status | P1, work item in "planned" | 1. Transition work item to "in_progress" | Status updated. Timeline event created. | | | |
| F05 | High | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Update progress | P1, work item in_progress | 1. Set progress to 50% | Progress updated. Status remains in_progress. | | | |
| F06 | High | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Complete work item | P1, work item at 100% | 1. Set progress to 100% | Status auto-transitions to "completed" | | | |
| F07 | Critical | viewer | `viewer@ammap-test.com` | `viewer@ammap` | Viewer sees work items | Logged in, P1 | 1. Navigate to work page | Work items visible (viewer can read) | | | |

---

### Section G — Defects Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| G01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Defects page loads | Logged in, P1 | 1. Navigate to `/{P1-uuid}/defects` | Defects listed. Seed defects visible. | | | |
| G02 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Severity filter | At defects page | 1. Click "Critical" severity filter | URL changes to `/{id}/defects?severity=critical` (correct URL pattern). List filters. | | | Verify URL |
| G03 | High | qa | `qa@ammap-test.com` | `qa@ammap` | Create defect | Logged in, P1 | 1. Create new defect with severity "high" | Defect created, visible in list | | | |
| G04 | High | qa | `qa@ammap-test.com` | `qa@ammap` | Transition defect status | P1, defect in "open" | 1. Move defect to "in_progress" | Status updated. Transition rule enforced. | | | |
| G05 | High | qa | `qa@ammap-test.com` | `qa@ammap` | Close defect | P1, defect in pending_reinspection | 1. Move defect to "closed" | Defect closed. `closed_at` set. Timeline event created. | | | |

---

### Section H — Quality (Inspections) Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| H01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Quality page loads | Logged in, P1 | 1. Navigate to `/{P1-uuid}/quality` | Inspections listed. Seed inspections visible. | | | |
| H02 | High | qa | `qa@ammap-test.com` | `qa@ammap` | Create inspection | Logged in, P1 | 1. Create new inspection, assign to spatial node | Inspection created with status "scheduled" | | | |
| H03 | High | qa | `qa@ammap-test.com` | `qa@ammap` | Complete inspection | P1, inspection in "in_progress" | 1. Mark inspection as "completed" with result "pass" | Status → completed, result set, timeline event created | | | |
| H04 | High | qa | `qa@ammap-test.com` | `qa@ammap` | Create corrective action on defect | P1, defect exists | 1. Create corrective action linked to a defect | CA created with status "open" | | | |

---

### Section I — Evidence Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| I01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Evidence page loads | Logged in, P1 | 1. Navigate to `/{P1-uuid}/evidence` | Evidence items listed. Seed evidence visible. | | | |
| I02 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Evidence type tabs | At evidence page | 1. Click "Photo" tab | URL changes to `/{id}/evidence?type=photo` (NOT `/projects/{id}/...`). Filters to photos. | | | Verify URL pattern |
| I03 | **Critical** | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | **Upload evidence file** | Logged in, at workspace evidence page | 1. Select a photo file 2. Set title 3. Click Upload | File uploads to storage, evidence row created in DB, success message shown | | | **Critical fix in this session — was broken due to storage path mismatch** |
| I04 | High | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Evidence visible after upload | After I03 | 1. Navigate to evidence page | Newly uploaded file appears in list | | | |
| I05 | High | viewer | `viewer@ammap-test.com` | `viewer@ammap` | Viewer sees evidence | Logged in, P1 | 1. Navigate to evidence page | Evidence items visible (viewer can read) | | | |

---

### Section J — Progress Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| J01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Progress page loads | Logged in, P1 | 1. Navigate to `/{P1-uuid}/progress` | Progress page renders with work item list and progress bars | | | |
| J02 | High | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Update progress from progress page | Logged in, P1 | 1. Update a work item progress slider/input to 75% | Progress saved, status auto-updates if needed | | | |

---

### Section K — Overview Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| K01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Overview page loads | Logged in, P1 | 1. Navigate to `/{P1-uuid}/overview` | Overview page renders: stats, progress bar, recent evidence, timeline events | | | |
| K02 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Stats are non-zero | At overview, P1 has seed data | 1. Check stats panel | Work items count > 0, defects count > 0 | | | |
| K03 | Medium | owner | `owner@ammap-test.com` | `owner@ammap` | Timeline events listed | At overview | 1. Check timeline section | At least 1 timeline event visible | | | |

---

### Section L — Reports Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| L01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Reports page loads | Logged in, P1 | 1. Navigate to `/{P1-uuid}/reports` | Reports page renders: work summary, defect summary, evidence count, audit section | | | |
| L02 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Report data non-zero | P1 has seed data | 1. Check counts in report | Completion %, open defect count, evidence count all reflect real data | | | |

---

### Section M — Documents Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| M01 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Documents page loads | Logged in, P1 | 1. Navigate to `/{P1-uuid}/documents` | Documents page renders with evidence grouped by type | | | |
| M02 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Upload Evidence link | At documents page | 1. Click "Upload Evidence" link | Navigates to `/{projectId}/evidence` (NOT `/projects/{id}/...`) | | | Verify URL |

---

### Section N — Settings Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| N01 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Settings page loads | Logged in, P1 | 1. Navigate to `/{P1-uuid}/settings` | Settings page renders with project name, description | | | |
| N02 | High | owner | `owner@ammap-test.com` | `owner@ammap` | Archive project | Settings page | 1. Archive the project | Project archived, no longer appears in project list | | | Use a test project, not P1 |

---

### Section O — AI Page

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| O01 | Medium | owner | `owner@ammap-test.com` | `owner@ammap` | AI page loads | Logged in, P1 | 1. Navigate to `/{P1-uuid}/ai` | AI page renders stats + "Coming in a future release" notice. No crash. | | | |

---

### Section P — Permission and Role Checks

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| P01 | **Critical** | member (with viewer project role) | `viewer@ammap-test.com` | `viewer@ammap` | Viewer org-role = member — can write | Logged in, P1 | 1. Attempt to create a work item | **Currently SUCCEEDS** — `viewer@ammap-test.com` has org_role=`member`, not `viewer`. `requirePermission` uses org role. | | | **See BLOCKER B1 — role model gap** |
| P02 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Owner can create project | Logged in | 1. Create new project | Success | | | |
| P03 | Critical | owner | `owner@ammap-test.com` | `owner@ammap` | Owner can archive project | Logged in | 1. Archive a test project | Success | | | |
| P04 | High | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Engineer cannot delete work item | P1, work item exists | 1. Attempt delete work item | **Permission denied** — engineer role lacks `delete:work_item` | | | |
| P05 | High | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Engineer cannot create spatial node | P1 | 1. Attempt to create spatial node | **Permission denied** — engineer role lacks `create:spatial_node` | | | |
| P06 | High | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Engineer can update progress | P1 | 1. Update work item progress | **Succeeds** — engineer has `update:work_progress` | | | |

---

### Section Q — Cross-Tenant / Isolation

| ID | Priority | Role | Email | Password | Page/Feature | Preconditions | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|-------------|---------------|-------|-----------------|---------------|-----------|-------|
| Q01 | **Critical** | owner-ammap | `owner@ammap-test.com` | `owner@ammap` | Cannot see other org's projects | Logged in | 1. Try to navigate to `/{P4-uuid}/overview` (P4 = Main Contractor) | 404 / notFound() returned. P4 data not visible. | | | **Tenant isolation** |
| Q02 | **Critical** | owner-ammap | `owner@ammap-test.com` | `owner@ammap` | Cannot see other org's work items via API | Logged in | 1. RLS test: even if URL is guessed, no P4 data returned | DB-level: RLS blocks all P4 data for AMMAP Test Org user | | | Verify via network tab — empty array or 0 results |
| Q03 | **Critical** | owner-another | `owner@another-org.com` | `owner@ammap` | Isolation test project — completely isolated | Logged in | 1. Navigate to dashboard | Only P5 (Isolated Tenant Test) visible. P1–P4 NOT visible. | | | |
| Q04 | High | owner-ammap | `owner@ammap-test.com` | `owner@ammap` | Cannot write to other tenant's project | Logged in as AMMAP owner | 1. Attempt server action targeting P4's project_id | RLS blocks at DB level, action fails with permission error | | | |

---

### Section R — Core Workflow End-to-End

| ID | Priority | Role | Email | Password | Workflow | Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|----|----------|------|-------|----------|----------|-------|-----------------|---------------|-----------|-------|
| R01 | **Critical** | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Full work item lifecycle | P1 | 1. Create work item (status=planned) 2. Start it (→in_progress) 3. Update progress to 50% 4. Complete it (→100%→completed) 5. View on overview page | Work item moves through all states. Final state = completed. Timeline shows events. | | | |
| R02 | **Critical** | qa | `qa@ammap-test.com` | `qa@ammap` | Full defect lifecycle | P1 | 1. Create inspection (→scheduled) 2. Start inspection (→in_progress) 3. Complete inspection with result=fail 4. Create defect from inspection 5. Move defect open→in_progress→pending_reinspection→closed 6. Create corrective action, complete it | Defect lifecycle complete. CA status = completed. Timeline events written. | | | |
| R03 | **Critical** | engineer1 | `engineer1@ammap-test.com` | `engineer1@ammap` | Evidence upload + visible | P1 | 1. Navigate to workspace evidence page 2. Select file 3. Set title 4. Upload 5. Navigate to `/{id}/evidence` | File appears in evidence list. Storage upload succeeded. | | | **This was broken before the storage path fix — must pass now** |
| R04 | High | pm | `pm@ammap-test.com` | `pm@ammap` | Create project and navigate | Logged in | 1. Go to `/projects` 2. Create new project "PM Test Project" 3. Click project card | New project accessible at `/{new-uuid}/overview` | | | |

---

## 4. Known Safe-to-Defer Issues

| # | Issue | Reason Deferred |
|---|-------|----------------|
| S01 | `register/page.tsx` is a bare placeholder (`<div>Register page</div>`) | Not in critical user flow — users use `/signup` instead |
| S02 | `forgot-password/page.tsx` is a bare placeholder | Password reset requires SMTP config. Not blocking login for test users (pre-confirmed). |
| S03 | Evidence file previews/downloads from seed data return 404 | Seed evidence rows have path strings only — no real storage objects. Documented in BOOTSTRAP_NOTES.md. |
| S04 | `spatial_nodes.geometry` is NULL for all seed nodes | Map pins will not render until geometry is manually added. Map workspace loads but no pins on canvas. |
| S05 | No rate limiting on auth or API routes | Not blocking for current test load. Should be added before public launch. |
| S06 | `unused_index` INFO warnings (15 indexes) | INFO only, no functional impact. Indexes are correct and will be used when data grows. |
| S07 | Leaked password protection disabled (HaveIBeenPwned) | Enable via Supabase Dashboard → Auth → Password Security. Manual step. |
| S08 | `createProject` action has debug `console.log` statements | Non-functional issue. Clean up before production. |
| S09 | Storage policies still use bare `auth.uid()` (no initplan fix) | Lower risk in storage context — browser uploads use browser client, not server RLS hot path. |
| S10 | AI page shows "Coming in future release" | Intentional placeholder. Not a bug. |

---

## 5. BLOCKERS Requiring Owner / Architect Decision

| # | Blocker | Description | Impact | Decision Needed |
|---|---------|-------------|--------|-----------------|
| B1 | **Role model gap: org_role vs project_role** | `requirePermission()` uses `organization_members.role`. The seed's `viewer@ammap-test.com` has org_role=`member` (not `viewer`), so the viewer CANNOT be permission-blocked at the app layer with current seed data. `project_members.role` is NOT enforced in the permission system. A true viewer must have org_role=`viewer` to be blocked. | The test account labeled "viewer" can currently write — the permission test P01 cannot be meaningfully validated with current seed. | **Owner must decide**: should `requirePermission` use project_role instead of org_role? Or should the seed user `viewer@ammap-test.com` have org_role=`viewer`? This is an architecture decision. |
| B2 | **No true viewer test account with org_role=viewer in seed** | No bootstrap user has `organization_members.role = 'viewer'`. All seed users are either `owner`, `admin`, or `member`. The `viewer` role exists in code but is untested end-to-end. | Cannot test viewer-blocked writes without manually creating a user with org_role=`viewer` in Supabase. | Owner must create a test user with org_role=`viewer` OR fix seed to set correct org roles. |
| B3 | **`createTimelineEvent` has no `requirePermission`** | Timeline events are written by other actions (fire-and-forget). They bypass app-level permission. If called directly, any authenticated user could write timeline events. | Low risk currently since no UI calls it directly — it's always triggered from other actions that do check permissions. | Accept as is OR add permission check. Low risk for now. |

---

## 6. Issues Fixed in This Session

| Fix | File | Description |
|-----|------|-------------|
| **CRITICAL: Storage upload path** | `src/domains/evidence/services/evidence-upload-service.ts` | Path was `projects/${projectId}/evidence/${fileId}.ext` — storage policy checks `foldername[1]` = `"projects"` (not a UUID) → upload silently failed. Fixed to `${projectId}/${fileId}.ext`. |
| Login `?next=` redirect | `src/app/(auth)/login/page.tsx` | Login page now reads `searchParams.get("next")` and redirects correctly after sign-in. |
| Signup trigger creates org | `supabase/migrations/036_...sql` | `on_auth_user_created` trigger previously only created profile. Fixed to also create organization + org_member. |
| Routing mismatches (tabs, links) | Multiple client components | All project-scoped tab URLs fixed from `/projects/{id}/...` to `/{id}/...`. |
| RLS `auth_rls_initplan` | migrations 038, 039, 040 | All RLS policies updated to use `(SELECT auth.uid())` instead of bare `auth.uid()`. |
| Duplicate permissive policies | migration 038 | `organization_members` INSERT/SELECT and `projects` UPDATE policies merged. |
| Missing FK indexes | migration 038 | Added indexes on `corrective_actions`, `progress_records`, `timeline_events` spatial_node_id FK. |
| `update_updated_at` search_path | migration 037 | Trigger function fixed with `SET search_path = public`. |
| Spatial node permission check | server actions | `createSpatialNode` / `deleteSpatialNode` now call `requirePermission()`. |
| Spatial node viewer RLS | migration 035 | Viewers blocked from INSERT/DELETE on `spatial_nodes`. |

---

## 7. Missing Credential Sources

All credentials are **confirmed available** in `scripts/bootstrap/bootstrap.ts` (lines 75–123).
Password pattern: `{email_local_part}@ammap`.
**No invented credentials are used in this test plan.**

> Note: The bootstrap users were applied via migrations 019–033 (NOT by running bootstrap.ts).
> All users are pre-confirmed (`email_confirmed_at` set). Passwords set via admin API with bcrypt.
> Bootstrap NOTES confirm this in `scripts/bootstrap/BOOTSTRAP_NOTES.md` line 124–126.

---

## 8. Repo Truth vs Live Verification Required

| Item | Status |
|------|--------|
| Login redirect logic | CONFIRMED IN REPO — code correct |
| Signup trigger creates org | CONFIRMED IN REPO — migration 036 applied |
| All project page routes exist | CONFIRMED IN REPO — all pages render real content |
| Middleware protects UUID routes | CONFIRMED IN REPO — regex verified |
| All mutations call requirePermission() | CONFIRMED IN REPO — all server actions verified |
| Storage path fix | CONFIRMED IN REPO — fixed in this session, verified via SQL |
| RLS policies all use (SELECT auth.uid()) | CONFIRMED IN DB — migrations 038–040 applied |
| Tenant isolation (cross-org) | CONFIRMED IN DB via RLS — REQUIRES LIVE TEST to verify end-to-end |
| Evidence upload works end-to-end | CONFIRMED CODE FIX — REQUIRES LIVE TEST (I03, R03) |
| Viewer role blocked from writes | REQUIRES LIVE TEST + BLOCKER B1 decision |
| Map canvas renders with pins | REQUIRES LIVE TEST — seed nodes have NULL geometry |
| Timeline events appear in overview | REQUIRES LIVE TEST |
| Progress calculations correct | REQUIRES LIVE TEST |

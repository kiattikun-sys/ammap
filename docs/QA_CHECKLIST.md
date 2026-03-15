# AMMAP QA Checklist — Bootstrap Validation
> Environment: Local Dev | Supabase Project: rloqkbbgnvocbtkiazbt

---

## 1. Login by Role

| # | User | Password | Expected Result | Pass |
|---|------|----------|----------------|------|
| 1.1 | owner@ammap-test.com | owner@ammap | Login success → Dashboard shows org-wide data | ☐ |
| 1.2 | admin@ammap-test.com | admin@ammap | Login success → Dashboard shows org-wide data | ☐ |
| 1.3 | pm@ammap-test.com | pm@ammap | Login success → sees 3 projects | ☐ |
| 1.4 | engineer1@ammap-test.com | engineer1@ammap | Login success → sees assigned projects | ☐ |
| 1.5 | qa@ammap-test.com | qa@ammap | Login success → sees inspections and defects | ☐ |
| 1.6 | viewer@ammap-test.com | viewer@ammap | Login success → read-only access | ☐ |
| 1.7 | owner@main-contractor.com | owner@ammap | Login success → sees only P4 (Warehouse) | ☐ |
| 1.8 | owner@another-org.com | owner@ammap | Login success → sees only P5 (Isolated Test) | ☐ |

---

## 2. Cross-Org Isolation

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 2.1 | Login as `owner@another-org.com` → All Projects | Only "Isolated Tenant Test Project" visible | ☐ |
| 2.2 | Login as `owner@another-org.com` → Dashboard | Data reflects P5 only (no Airport/Hospital data) | ☐ |
| 2.3 | Login as `owner@main-contractor.com` → All Projects | Only "Industrial Warehouse Phase 2" visible | ☐ |
| 2.4 | Login as `pm@ammap-test.com` → All Projects | Only P1, P2, P3 visible (not P4 or P5) | ☐ |
| 2.5 | Direct URL access `/projects/{P4-id}` as AMMAP Test user | Blocked or empty (RLS enforced) | ☐ |

---

## 3. Dashboard Rendering

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 3.1 | Login as `owner@ammap-test.com` → Dashboard | Loads without error | ☐ |
| 3.2 | Dashboard — Active Zones count | Shows ≥ 9 zones | ☐ |
| 3.3 | Dashboard — Evidence Items count | Shows 6 | ☐ |
| 3.4 | Dashboard — Timeline Events count | Shows ≥ 12 | ☐ |
| 3.5 | Dashboard — Project Health bar | Shows % progress (non-zero) | ☐ |
| 3.6 | Dashboard — Task Progress donut | Shows Planned/In Progress/Blocked/Completed segments | ☐ |
| 3.7 | Dashboard — Defects by Severity | Shows Critical/High/Medium/Low bars | ☐ |
| 3.8 | **Risk Zones — names visible** | Shows spatial node names (e.g. "Basement B1", "Zone B — Security") NOT UUIDs | ☐ |
| 3.9 | Risk Zones — severity badges | CRITICAL / HIGH / MEDIUM / LOW badges correct | ☐ |
| 3.10 | Dashboard — no console errors | Browser console shows no red errors | ☐ |

---

## 4. Work Items Visibility

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 4.1 | Login as `pm@ammap-test.com` → P1 work items | 5 work items visible (Airport project) | ☐ |
| 4.2 | Work item statuses present | planned / in_progress / blocked / completed all visible across projects | ☐ |
| 4.3 | Work item "Install check-in counter structural steel" | Status: completed, progress: 100% | ☐ |
| 4.4 | Work item "X-ray machine installation — Zone B" | Status: blocked, priority: critical | ☐ |

---

## 5. Defect Visibility

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 5.1 | Login as `qa@ammap-test.com` → P1 defects | 4 defects visible for Airport project | ☐ |
| 5.2 | Defect "Waterproofing membrane holiday — B1 north wall" | Severity: critical, status: open | ☐ |
| 5.3 | Defect "Weld quality non-conformance — Column A3" | Status: resolved (corrective action completed) | ☐ |
| 5.4 | Login as `owner@another-org.com` → P1 defects via direct URL | Returns empty / blocked (no cross-org leakage) | ☐ |

---

## 6. Evidence Visibility

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 6.1 | Login as `qa@ammap-test.com` → P1 evidence | Evidence items visible with title and description | ☐ |
| 6.2 | Evidence linked to defect "Column A3 weld" | 2 evidence items (before + after repair) | ☐ |
| 6.3 | Evidence file download | Expected 404 (no real files in storage — known limitation) | ☐ |

---

## 7. Inspections

| # | Test | Expected Result | Pass |
|---|------|----------------|------|
| 7.1 | Login as `qa@ammap-test.com` → P1 inspections | 3 inspections visible | ☐ |
| 7.2 | "Zone A structural steel inspection" | Status: completed, result: pass | ☐ |
| 7.3 | "Zone B security equipment pre-installation check" | Status: scheduled | ☐ |

---

## Notes

- All tests run against local dev: `http://localhost:3000`
- Supabase project: `rloqkbbgnvocbtkiazbt` (non-production)
- Evidence file downloads will 404 — this is expected (known limitation, no real files in storage bucket)
- Map/geometry views will show no pins — expected (spatial_nodes.geometry is null)
- Sign out between role tests to prevent session bleed

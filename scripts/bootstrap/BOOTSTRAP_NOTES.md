# AMMAP Bootstrap Notes
> Status: Complete | Last updated: 2026-03-15

## What Was Created

### Auth Users (36 total)
Password pattern: `{email_prefix}@ammap` (e.g. `owner@ammap-test.com` → password `owner@ammap`)

#### AMMAP Test Org (`aaaaaaaa-0001-0001-0001-000000000001`)
| Email | Role | Project Access |
|-------|------|---------------|
| owner@ammap-test.com | owner | org-wide |
| admin@ammap-test.com | admin | org-wide |
| pm@ammap-test.com | member | manager on P1, P2, P3 |
| site-manager@ammap-test.com | member | engineer on P1, P2 |
| engineer1@ammap-test.com | member | engineer on P1, P2 |
| engineer2@ammap-test.com | member | engineer on P1 |
| qa@ammap-test.com | member | engineer on P1, P2 |
| safety@ammap-test.com | member | viewer on P1 |
| planner@ammap-test.com | member | engineer on P3 |
| document@ammap-test.com | member | viewer on P1 |
| procurement@ammap-test.com | member | viewer on P2 |
| viewer@ammap-test.com | member | viewer on P1 |

#### Main Contractor Org (`aaaaaaaa-0002-0002-0002-000000000002`)
| Email | Role |
|-------|------|
| owner@main-contractor.com | owner |
| admin@main-contractor.com | admin |
| pm@main-contractor.com | member |
| engineer@main-contractor.com | member |
| foreman@main-contractor.com | member |
| viewer@main-contractor.com | member |

#### QA Consultant Org (`aaaaaaaa-0003-0003-0003-000000000003`)
| Email | Role |
|-------|------|
| owner@qa-consultant.com | owner |
| qa-lead@qa-consultant.com | member |
| inspector1@qa-consultant.com | member |
| inspector2@qa-consultant.com | member |
| viewer@qa-consultant.com | member |

#### Subcontractor Org (`aaaaaaaa-0004-0004-0004-000000000004`)
| Email | Role |
|-------|------|
| owner@subcontractor.com | owner |
| admin@subcontractor.com | admin |
| supervisor@subcontractor.com | member |
| worker1@subcontractor.com | member |
| worker2@subcontractor.com | member |

#### Client Owner Org (`aaaaaaaa-0005-0005-0005-000000000005`)
| Email | Role |
|-------|------|
| owner@client-owner.com | owner |
| executive@client-owner.com | member |
| reviewer@client-owner.com | member |
| viewer@client-owner.com | member |

#### Another Test Org (`aaaaaaaa-0006-0006-0006-000000000006`) — isolation test
| Email | Role |
|-------|------|
| owner@another-org.com | owner |
| admin@another-org.com | admin |
| engineer@another-org.com | member |
| viewer@another-org.com | member |

---

### Projects (5 total)

| ID | Name | Org | Description |
|----|------|-----|-------------|
| `bbbbbbbb-0001-...` | International Airport Terminal Expansion | AMMAP Test Org | Airport terminal A+B, 35 spatial nodes |
| `bbbbbbbb-0002-...` | City Hospital New Wing | AMMAP Test Org | Hospital tower, ED, OPD, basement |
| `bbbbbbbb-0003-...` | Riverside Mixed-Use Tower | AMMAP Test Org | Residential towers A+B, podium |
| `bbbbbbbb-0004-...` | Industrial Warehouse Phase 2 | Main Contractor Org | Warehouse zones, receiving dock |
| `bbbbbbbb-0005-...` | Isolated Tenant Test Project | Another Test Org | Cross-org isolation test only |

---

### Spatial Hierarchy (35 nodes)

**Airport Terminal (P1):** Terminal A Building → Level 1 → Zone A (Check-in) → Area A1 (Domestic) / Zone B (Security) / Zone C (Retail) / Zone D (Boarding Gates) → Area D1 | Terminal B Building → Level 1 → Zone E (International Check-in)

**City Hospital (P2):** Hospital Tower → Basement B1 / Ground Floor → Emergency Department Zone / OPD Lobby Level

**Riverside Tower (P3):** Riverside Site → Tower A Building → Podium Ground Floor / Residential Floor 1 | Tower B Building → Podium Ground Floor

**Industrial Warehouse (P4):** Warehouse Building → Zone 1 (Receiving Dock) → Receiving Area / Zone 2 (Storage)

**Isolated Test (P5):** Test Building → Test Floor → Test Zone

---

### Seed Domain Data

| Table | Count | Notes |
|-------|-------|-------|
| work_items | 13 | Across P1–P5, statuses: planned/in_progress/blocked/completed |
| inspections | 6 | Scheduled, in_progress, completed (with pass results) |
| defects | 7 | Severities: critical/high/medium/low; statuses: open/in_progress/resolved/closed |
| corrective_actions | 6 | Linked to defects, open/in_progress/completed |
| progress_records | 17 | Historical timestamps across P1–P4 zones |
| timeline_events | 15 | construction_start, milestone, inspection, defect_created/resolved |
| evidence | 7 | Photos and documents linked to defects and work items |
| profiles | 36 | Display names for all bootstrap users |

---

## Known Limitations

1. **No storage files** — `evidence.file_url` contains path strings only. No real objects exist in the `evidence-files` Supabase Storage bucket. Evidence previews/downloads will 404.

2. **No geometry** — `spatial_nodes.geometry` is `null` for all bootstrap nodes. Map view / floor plan pins will not render until geometry is manually added.

3. **Passwords set via `crypt()`** — Users can log in normally via the app. Password reset via email will not work unless Supabase email is configured (SMTP).

4. **Email confirmation bypassed** — `email_confirmed_at` was set during bootstrap insert. Users are pre-confirmed and can log in immediately.

5. **Production users untouched** — Existing real users (`kiattikun@tprgs.com`, `kiattikun@tripeera.com`, `test-admin@ammap.dev`, `test-member@ammap.dev`) and their orgs/projects (TPR, Villa Rayong) were NOT modified.

6. **Bootstrap is Supabase-only** — The `scripts/bootstrap/bootstrap.ts` TypeScript runner exists but was not used for this execution. All data was applied directly via Supabase MCP migrations (019–033).

7. **`scripts/bootstrap/seed.sql`** — Reference file only. The actual data was applied via migrations, not this file. Keep in sync if re-running.

---

## Migrations Applied (Bootstrap)

| Migration | Purpose |
|-----------|---------|
| 018 | `exec_sql` RPC helper (service_role only) |
| 019 | Auth users with bcrypt passwords |
| 020 | Canonical orgs, cleanup auto-created trigger orgs |
| 021 | AMMAP Test Org members |
| 022 | Remaining 5 org members |
| 023 | Projects + project_members |
| 024 | Airport + Hospital spatial nodes |
| 025 | Riverside + Warehouse + Isolated spatial nodes |
| 026 | work_items |
| 027 | inspections |
| 028 | defects |
| 029 | corrective_actions |
| 030 | progress_records |
| 031 | timeline_events |
| 032 | evidence |
| 033 | profiles backfill |
| 034 | Fix auth.users token fields (NULL → '') for login |

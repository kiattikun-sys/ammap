# AMMAP Test Environment Bootstrap

> ⚠️ **WARNING: This bootstrap MUST NOT be run in production.**
> It creates test users with predictable passwords and seeds demo data.
> It is intended for local development, staging, and QA environments only.

---

## What This Creates

### Organizations (6)

| ID Prefix | Name | Purpose |
|-----------|------|---------|
| `aaaaaaaa-0001-…` | AMMAP Test Org | Primary test org — full workflow |
| `aaaaaaaa-0002-…` | Main Contractor Org | Contractor role testing |
| `aaaaaaaa-0003-…` | QA Consultant Org | QA/inspection workflow testing |
| `aaaaaaaa-0004-…` | Subcontractor Org | Subcontractor role testing |
| `aaaaaaaa-0005-…` | Client / Owner Org | Client/executive view testing |
| `aaaaaaaa-0006-…` | Another Test Org | Cross-org RLS isolation testing |

### Users (36 total)

#### AMMAP Test Org
| Email | Password | Org Role | Business Title |
|-------|----------|----------|----------------|
| owner@ammap-test.com | owner@ammap | owner | — |
| admin@ammap-test.com | admin@ammap | admin | — |
| pm@ammap-test.com | pm@ammap | member | project_manager |
| site-manager@ammap-test.com | site-manager@ammap | member | site_manager |
| engineer1@ammap-test.com | engineer1@ammap | member | site_engineer |
| engineer2@ammap-test.com | engineer2@ammap | member | field_engineer |
| qa@ammap-test.com | qa@ammap | member | qa_inspector |
| safety@ammap-test.com | safety@ammap | member | safety_officer |
| planner@ammap-test.com | planner@ammap | member | planner |
| document@ammap-test.com | document@ammap | member | document_controller |
| procurement@ammap-test.com | procurement@ammap | member | procurement_officer |
| viewer@ammap-test.com | viewer@ammap | member | viewer |

#### Main Contractor Org
| Email | Password | Org Role |
|-------|----------|----------|
| owner@main-contractor.com | owner@ammap | owner |
| admin@main-contractor.com | admin@ammap | admin |
| pm@main-contractor.com | pm@ammap | member |
| engineer@main-contractor.com | engineer@ammap | member |
| foreman@main-contractor.com | foreman@ammap | member |
| viewer@main-contractor.com | viewer@ammap | member |

#### QA Consultant Org
| Email | Password | Org Role |
|-------|----------|----------|
| owner@qa-consultant.com | owner@ammap | owner |
| qa-lead@qa-consultant.com | qa-lead@ammap | admin |
| inspector1@qa-consultant.com | inspector1@ammap | member |
| inspector2@qa-consultant.com | inspector2@ammap | member |
| viewer@qa-consultant.com | viewer@ammap | member |

#### Subcontractor Org
| Email | Password | Org Role |
|-------|----------|----------|
| owner@subcontractor.com | owner@ammap | owner |
| admin@subcontractor.com | admin@ammap | admin |
| supervisor@subcontractor.com | supervisor@ammap | member |
| worker1@subcontractor.com | worker1@ammap | member |
| worker2@subcontractor.com | worker2@ammap | member |

#### Client / Owner Org
| Email | Password | Org Role |
|-------|----------|----------|
| owner@client-owner.com | owner@ammap | owner |
| executive@client-owner.com | executive@ammap | admin |
| reviewer@client-owner.com | reviewer@ammap | member |
| viewer@client-owner.com | viewer@ammap | member |

#### Another Test Org (cross-org isolation)
| Email | Password | Org Role |
|-------|----------|----------|
| owner@another-org.com | owner@ammap | owner |
| admin@another-org.com | admin@ammap | admin |
| engineer@another-org.com | engineer@ammap | member |
| viewer@another-org.com | viewer@ammap | member |

---

### Projects (5)

| ID Prefix | Name | Org |
|-----------|------|-----|
| `bbbbbbbb-0001-…` | Airport Terminal Expansion | AMMAP Test Org |
| `bbbbbbbb-0002-…` | Central Hospital Tower | AMMAP Test Org |
| `bbbbbbbb-0003-…` | Riverside Mixed-Use Development | AMMAP Test Org |
| `bbbbbbbb-0004-…` | Industrial Warehouse Phase 2 | Main Contractor Org |
| `bbbbbbbb-0005-…` | Isolated Tenant Test Project | Another Test Org |

### Spatial Hierarchy

**Airport Terminal Expansion** — full hierarchy:
```
Terminal A (building)
├── Level 1 (level)
│   ├── Zone A — Check-in (zone)
│   │   ├── Area A1 — Domestic Check-in (area)
│   │   └── Area A2 — International Check-in (area)
│   └── Zone B — Security (zone)
│       ├── Area B1 — X-ray Station 1 (area)
│       └── Area B2 — X-ray Station 2 (area)
└── Level 2 (level)
    ├── Zone C — Retail (zone)
    └── Zone D — Gates (zone)
Terminal B (building)
└── Level 1 (level)
    └── Zone E — Arrivals Hall (zone)
```

**Central Hospital Tower** and **Riverside Mixed-Use Development** also have spatial trees.

### Domain Data

| Table | Count |
|-------|-------|
| work_items | 8 (planned/in_progress/blocked/completed) |
| inspections | 4 (scheduled/in_progress/completed) |
| defects | 6 (open/in_progress/resolved/closed) |
| corrective_actions | 4 (open/in_progress/completed) |
| progress_records | 7 (historical — multiple per zone) |
| timeline_events | 9 (construction_start/inspection/defect_created/defect_resolved/milestone) |
| evidence | 5 (photo/document — metadata only, paths use project_id prefix) |

---

## Prerequisites

1. **`tsx`** must be available:
   ```bash
   npm install -g tsx
   # or use npx tsx
   ```

2. **Environment variables** required:

   Add to `.env.local` or pass inline:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   > ⚠️ The `SUPABASE_SERVICE_ROLE_KEY` is the **service role key** from Supabase Dashboard → Settings → API.
   > Never commit this key. Never expose it to the browser.

---

## How to Run

### Step 1 — Ensure variables are set

```bash
# In your shell (or add to .env.local):
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 2 — Run bootstrap

```bash
ALLOW_TEST_BOOTSTRAP=true npx tsx scripts/bootstrap/bootstrap.ts
```

Or using the npm script (after adding to package.json):

```bash
npm run bootstrap
```

### Step 3 — Verify

Check the output log. It will show:
- ✓ Created: user@email.com (new user)
- Skipped: already existed
- ✓ Deleted auto-org: "..."
- ✓ seed.sql executed

Then verify in **Supabase Dashboard → Authentication → Users**.

---

## Re-running Safely

The bootstrap is **idempotent**:

- Auth users: skipped if email already exists
- Organizations: `ON CONFLICT (id) DO NOTHING`
- All domain data: `ON CONFLICT (id) DO NOTHING`

Re-running will not duplicate data or break existing state.

---

## Reset / Cleanup

To fully reset the test environment:

1. Delete test auth users from **Supabase Dashboard → Authentication → Users**
   (filter by `@ammap-test.com`, `@main-contractor.com`, etc.)

2. Run in SQL Editor:
   ```sql
   -- Delete canonical test orgs (cascades to all domain data via FK)
   DELETE FROM organizations WHERE id IN (
     'aaaaaaaa-0001-0001-0001-000000000001',
     'aaaaaaaa-0002-0002-0002-000000000002',
     'aaaaaaaa-0003-0003-0003-000000000003',
     'aaaaaaaa-0004-0004-0004-000000000004',
     'aaaaaaaa-0005-0005-0005-000000000005',
     'aaaaaaaa-0006-0006-0006-000000000006'
   );
   ```

3. Re-run bootstrap:
   ```bash
   ALLOW_TEST_BOOTSTRAP=true npx tsx scripts/bootstrap/bootstrap.ts
   ```

---

## Test Scenarios Enabled

| # | Scenario | Test User |
|---|----------|-----------|
| 1 | Owner accesses all org projects | owner@ammap-test.com |
| 2 | Admin manages project data | admin@ammap-test.com |
| 3 | PM creates/updates work items | pm@ammap-test.com |
| 4 | Engineer updates assigned tasks | engineer1@ammap-test.com |
| 5 | QA creates inspections and defects | qa@ammap-test.com |
| 6 | Viewer reads but cannot modify | viewer@ammap-test.com |
| 7 | Cross-org isolation | owner@another-org.com (cannot see AMMAP Test Org data) |
| 8 | Evidence is project-scoped | qa@ammap-test.com (check file_url prefix) |
| 9 | Timeline populated realistically | any AMMAP Test Org user |
| 10 | Progress history chart | any AMMAP Test Org user (4 records on Zone A) |
| 11 | Spatial tree renders correctly | any AMMAP Test Org user → Airport Terminal |
| 12 | Map workspace looks realistic | any AMMAP Test Org user → Airport Terminal Expansion |
| 13 | Archive project (admin only) | admin@ammap-test.com vs viewer@ammap-test.com |

---

## Security Notes

- Service role key is **only used in this script** — never in app code
- `exec_sql` RPC function is restricted to `service_role` only (migration 018)
- No RLS policies are weakened by this bootstrap
- Tenant boundary is fully respected — no cross-org data overlap
- `ALLOW_TEST_BOOTSTRAP=true` guard prevents accidental production runs
- `NODE_ENV=production` is also blocked as a secondary guard

---

## Known Limitations

1. **No actual file uploads** — evidence `file_url` values are path strings only, not real storage objects
2. **Geometry data** — spatial_nodes have no `geometry` field populated (map pins won't appear until manually placed)
3. **Single org membership** — each user belongs to only one org (no cross-org collaboration test — by design)
4. **`exec_sql` RPC** — seed.sql runs via the `exec_sql` helper function (migration 018). If this fails, run `seed.sql` manually via Supabase SQL Editor

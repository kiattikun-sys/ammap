-- =============================================================
-- AMMAP TEST ENVIRONMENT SEED — DOMAIN DATA
-- =============================================================
-- WARNING: THIS MUST ONLY RUN IN DEV / STAGING ENVIRONMENTS
-- DO NOT RUN IN PRODUCTION
--
-- This file seeds:
--   - organizations (with correct owner_id references)
--   - organization_members
--   - projects
--   - project_members
--   - spatial_nodes (respects building > level > zone > area hierarchy)
--   - work_items
--   - inspections
--   - defects
--   - corrective_actions
--   - progress_records
--   - timeline_events
--   - evidence (metadata rows, no actual file upload)
--
-- Idempotent: uses INSERT ... ON CONFLICT DO NOTHING throughout
-- Auth users must be created BEFORE running this file (via bootstrap.ts)
-- =============================================================

-- =============================================================
-- SECTION 0: HELPER — resolve user id by email
-- =============================================================
-- We use a helper view for readability. Dropped after use.
CREATE TEMP VIEW bootstrap_users AS
SELECT id, email FROM auth.users
WHERE email IN (
  'owner@ammap-test.com','admin@ammap-test.com','pm@ammap-test.com',
  'site-manager@ammap-test.com','engineer1@ammap-test.com','engineer2@ammap-test.com',
  'qa@ammap-test.com','safety@ammap-test.com','planner@ammap-test.com',
  'document@ammap-test.com','procurement@ammap-test.com','viewer@ammap-test.com',
  'owner@main-contractor.com','admin@main-contractor.com','pm@main-contractor.com',
  'engineer@main-contractor.com','foreman@main-contractor.com','viewer@main-contractor.com',
  'owner@qa-consultant.com','qa-lead@qa-consultant.com','inspector1@qa-consultant.com',
  'inspector2@qa-consultant.com','viewer@qa-consultant.com',
  'owner@subcontractor.com','admin@subcontractor.com','supervisor@subcontractor.com',
  'worker1@subcontractor.com','worker2@subcontractor.com',
  'owner@client-owner.com','executive@client-owner.com','reviewer@client-owner.com',
  'viewer@client-owner.com',
  'owner@another-org.com','admin@another-org.com','engineer@another-org.com',
  'viewer@another-org.com'
);

-- =============================================================
-- SECTION 1: ORGANIZATIONS
-- =============================================================
-- NOTE: handle_new_user_org trigger auto-creates an org for each new user.
-- bootstrap.ts deletes those auto-created orgs BEFORE running this file.
-- We create the canonical orgs here with fixed IDs for cross-reference stability.

INSERT INTO organizations (id, name, owner_id)
SELECT
  'aaaaaaaa-0001-0001-0001-000000000001'::uuid,
  'AMMAP Test Org',
  (SELECT id FROM bootstrap_users WHERE email = 'owner@ammap-test.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'owner@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, name, owner_id)
SELECT
  'aaaaaaaa-0002-0002-0002-000000000002'::uuid,
  'Main Contractor Org',
  (SELECT id FROM bootstrap_users WHERE email = 'owner@main-contractor.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'owner@main-contractor.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, name, owner_id)
SELECT
  'aaaaaaaa-0003-0003-0003-000000000003'::uuid,
  'QA Consultant Org',
  (SELECT id FROM bootstrap_users WHERE email = 'owner@qa-consultant.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'owner@qa-consultant.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, name, owner_id)
SELECT
  'aaaaaaaa-0004-0004-0004-000000000004'::uuid,
  'Subcontractor Org',
  (SELECT id FROM bootstrap_users WHERE email = 'owner@subcontractor.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'owner@subcontractor.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, name, owner_id)
SELECT
  'aaaaaaaa-0005-0005-0005-000000000005'::uuid,
  'Client / Owner Org',
  (SELECT id FROM bootstrap_users WHERE email = 'owner@client-owner.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'owner@client-owner.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, name, owner_id)
SELECT
  'aaaaaaaa-0006-0006-0006-000000000006'::uuid,
  'Another Test Org',
  (SELECT id FROM bootstrap_users WHERE email = 'owner@another-org.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'owner@another-org.com')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 2: ORGANIZATION MEMBERS
-- =============================================================

-- AMMAP Test Org
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'owner'  FROM bootstrap_users WHERE email = 'owner@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'admin'  FROM bootstrap_users WHERE email = 'admin@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'pm@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'site-manager@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'qa@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'safety@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'planner@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'document@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'procurement@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'viewer@ammap-test.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Main Contractor Org
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0002-0002-0002-000000000002'::uuid, id, 'owner'  FROM bootstrap_users WHERE email = 'owner@main-contractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0002-0002-0002-000000000002'::uuid, id, 'admin'  FROM bootstrap_users WHERE email = 'admin@main-contractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0002-0002-0002-000000000002'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'pm@main-contractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0002-0002-0002-000000000002'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'engineer@main-contractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0002-0002-0002-000000000002'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'foreman@main-contractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0002-0002-0002-000000000002'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'viewer@main-contractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- QA Consultant Org
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0003-0003-0003-000000000003'::uuid, id, 'owner'  FROM bootstrap_users WHERE email = 'owner@qa-consultant.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0003-0003-0003-000000000003'::uuid, id, 'admin'  FROM bootstrap_users WHERE email = 'qa-lead@qa-consultant.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0003-0003-0003-000000000003'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'inspector1@qa-consultant.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0003-0003-0003-000000000003'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'inspector2@qa-consultant.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0003-0003-0003-000000000003'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'viewer@qa-consultant.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Subcontractor Org
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0004-0004-0004-000000000004'::uuid, id, 'owner'  FROM bootstrap_users WHERE email = 'owner@subcontractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0004-0004-0004-000000000004'::uuid, id, 'admin'  FROM bootstrap_users WHERE email = 'admin@subcontractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0004-0004-0004-000000000004'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'supervisor@subcontractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0004-0004-0004-000000000004'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'worker1@subcontractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0004-0004-0004-000000000004'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'worker2@subcontractor.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Client / Owner Org
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0005-0005-0005-000000000005'::uuid, id, 'owner'  FROM bootstrap_users WHERE email = 'owner@client-owner.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0005-0005-0005-000000000005'::uuid, id, 'admin'  FROM bootstrap_users WHERE email = 'executive@client-owner.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0005-0005-0005-000000000005'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'reviewer@client-owner.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0005-0005-0005-000000000005'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'viewer@client-owner.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Another Test Org
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0006-0006-0006-000000000006'::uuid, id, 'owner'  FROM bootstrap_users WHERE email = 'owner@another-org.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0006-0006-0006-000000000006'::uuid, id, 'admin'  FROM bootstrap_users WHERE email = 'admin@another-org.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0006-0006-0006-000000000006'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'engineer@another-org.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 'aaaaaaaa-0006-0006-0006-000000000006'::uuid, id, 'member' FROM bootstrap_users WHERE email = 'viewer@another-org.com'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- =============================================================
-- SECTION 3: PROJECTS
-- =============================================================

INSERT INTO projects (id, name, description, organization_id, metadata)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'Airport Terminal Expansion',
  'Expansion of Terminal A and B at Suvarnabhumi International Airport — Phases 1-3',
  'aaaaaaaa-0001-0001-0001-000000000001'::uuid,
  '{"demo": true, "phase": "Phase 1"}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, organization_id, metadata)
VALUES (
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'Central Hospital Tower',
  'New 25-floor hospital tower construction — medical-grade MEP systems and clean rooms',
  'aaaaaaaa-0001-0001-0001-000000000001'::uuid,
  '{"demo": true, "phase": "Phase 2"}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, organization_id, metadata)
VALUES (
  'bbbbbbbb-0003-0003-0003-000000000003'::uuid,
  'Riverside Mixed-Use Development',
  'Mixed-use riverside development — 3 towers, retail podium, underground parking',
  'aaaaaaaa-0001-0001-0001-000000000001'::uuid,
  '{"demo": true, "phase": "Phase 1"}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, organization_id, metadata)
VALUES (
  'bbbbbbbb-0004-0004-0004-000000000004'::uuid,
  'Industrial Warehouse Phase 2',
  'Phase 2 expansion of logistics warehouse complex — 80,000 sqm',
  'aaaaaaaa-0002-0002-0002-000000000002'::uuid,
  '{"demo": true, "phase": "Phase 2"}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, organization_id, metadata)
VALUES (
  'bbbbbbbb-0005-0005-0005-000000000005'::uuid,
  'Isolated Tenant Test Project',
  'Used exclusively to test cross-org isolation — Another Test Org only',
  'aaaaaaaa-0006-0006-0006-000000000006'::uuid,
  '{"demo": true, "isolation_test": true}'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 4: PROJECT MEMBERS
-- =============================================================

-- Airport Terminal Expansion
INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, id, 'manager'  FROM bootstrap_users WHERE email = 'pm@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, id, 'engineer' FROM bootstrap_users WHERE email = 'site-manager@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, id, 'engineer' FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, id, 'engineer' FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, id, 'engineer' FROM bootstrap_users WHERE email = 'qa@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, id, 'viewer'   FROM bootstrap_users WHERE email = 'viewer@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Central Hospital Tower
INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, id, 'manager'  FROM bootstrap_users WHERE email = 'pm@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, id, 'engineer' FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, id, 'engineer' FROM bootstrap_users WHERE email = 'qa@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, id, 'viewer'   FROM bootstrap_users WHERE email = 'safety@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Riverside Mixed-Use Development
INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0003-0003-0003-000000000003'::uuid, id, 'manager'  FROM bootstrap_users WHERE email = 'pm@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0003-0003-0003-000000000003'::uuid, id, 'engineer' FROM bootstrap_users WHERE email = 'planner@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0003-0003-0003-000000000003'::uuid, id, 'viewer'   FROM bootstrap_users WHERE email = 'procurement@ammap-test.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Industrial Warehouse Phase 2 (Main Contractor Org)
INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0004-0004-0004-000000000004'::uuid, id, 'manager'  FROM bootstrap_users WHERE email = 'pm@main-contractor.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0004-0004-0004-000000000004'::uuid, id, 'engineer' FROM bootstrap_users WHERE email = 'engineer@main-contractor.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0004-0004-0004-000000000004'::uuid, id, 'viewer'   FROM bootstrap_users WHERE email = 'foreman@main-contractor.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Isolated Tenant Test Project (Another Test Org only)
INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0005-0005-0005-000000000005'::uuid, id, 'manager'  FROM bootstrap_users WHERE email = 'owner@another-org.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT 'bbbbbbbb-0005-0005-0005-000000000005'::uuid, id, 'engineer' FROM bootstrap_users WHERE email = 'engineer@another-org.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

-- =============================================================
-- SECTION 5: SPATIAL HIERARCHY — Airport Terminal Expansion
-- NOTE: spatial_nodes type check: building | level | zone | area
-- =============================================================

-- Terminal A (building)
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0101-0101-0101-000000000001'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, NULL, 'building', 'Terminal A', 1)
ON CONFLICT (id) DO NOTHING;

-- Terminal B (building — second root for hierarchy validation)
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0102-0102-0102-000000000002'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, NULL, 'building', 'Terminal B', 2)
ON CONFLICT (id) DO NOTHING;

-- Terminal A > Level 1
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0103-0103-0103-000000000003'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0101-0101-0101-000000000001'::uuid, 'level', 'Level 1', 1)
ON CONFLICT (id) DO NOTHING;

-- Terminal A > Level 2
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0104-0104-0104-000000000004'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0101-0101-0101-000000000001'::uuid, 'level', 'Level 2', 2)
ON CONFLICT (id) DO NOTHING;

-- Level 1 > Zone A
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0105-0105-0105-000000000005'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0103-0103-0103-000000000003'::uuid, 'zone', 'Zone A — Check-in', 1)
ON CONFLICT (id) DO NOTHING;

-- Level 1 > Zone B
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0106-0106-0106-000000000006'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0103-0103-0103-000000000003'::uuid, 'zone', 'Zone B — Security', 2)
ON CONFLICT (id) DO NOTHING;

-- Level 2 > Zone C
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0107-0107-0107-000000000007'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0104-0104-0104-000000000004'::uuid, 'zone', 'Zone C — Retail', 1)
ON CONFLICT (id) DO NOTHING;

-- Level 2 > Zone D
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0108-0108-0108-000000000008'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0104-0104-0104-000000000004'::uuid, 'zone', 'Zone D — Gates', 2)
ON CONFLICT (id) DO NOTHING;

-- Zone A > Area A1
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0109-0109-0109-000000000009'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0105-0105-0105-000000000005'::uuid, 'area', 'Area A1 — Domestic Check-in', 1)
ON CONFLICT (id) DO NOTHING;

-- Zone A > Area A2
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0110-0110-0110-000000000010'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0105-0105-0105-000000000005'::uuid, 'area', 'Area A2 — International Check-in', 2)
ON CONFLICT (id) DO NOTHING;

-- Zone B > Area B1
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0111-0111-0111-000000000011'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0106-0106-0106-000000000006'::uuid, 'area', 'Area B1 — X-ray Station 1', 1)
ON CONFLICT (id) DO NOTHING;

-- Zone B > Area B2
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0112-0112-0112-000000000012'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0106-0106-0106-000000000006'::uuid, 'area', 'Area B2 — X-ray Station 2', 2)
ON CONFLICT (id) DO NOTHING;

-- Terminal B > Level 1
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0113-0113-0113-000000000013'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0102-0102-0102-000000000002'::uuid, 'level', 'Level 1', 1)
ON CONFLICT (id) DO NOTHING;

-- Terminal B > Level 1 > Zone E
INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0114-0114-0114-000000000014'::uuid, 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0113-0113-0113-000000000013'::uuid, 'zone', 'Zone E — Arrivals Hall', 1)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 6: SPATIAL — Central Hospital Tower
-- =============================================================

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0201-0201-0201-000000000001'::uuid, 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, NULL, 'building', 'Hospital Tower Main', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0202-0202-0202-000000000002'::uuid, 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, 'cccccccc-0201-0201-0201-000000000001'::uuid, 'level', 'Basement B1', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0203-0203-0203-000000000003'::uuid, 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, 'cccccccc-0201-0201-0201-000000000001'::uuid, 'level', 'Ground Floor', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0204-0204-0204-000000000004'::uuid, 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, 'cccccccc-0203-0203-0203-000000000003'::uuid, 'zone', 'Emergency Department', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0205-0205-0205-000000000005'::uuid, 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, 'cccccccc-0203-0203-0203-000000000003'::uuid, 'zone', 'OPD Lobby', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0206-0206-0206-000000000006'::uuid, 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, 'cccccccc-0204-0204-0204-000000000004'::uuid, 'area', 'Triage Area', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0207-0207-0207-000000000007'::uuid, 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, 'cccccccc-0204-0204-0204-000000000004'::uuid, 'area', 'Treatment Bays', 2)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 7: SPATIAL — Riverside Mixed-Use Development
-- =============================================================

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0301-0301-0301-000000000001'::uuid, 'bbbbbbbb-0003-0003-0003-000000000003'::uuid, NULL, 'building', 'Tower A — Residential', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0302-0302-0302-000000000002'::uuid, 'bbbbbbbb-0003-0003-0003-000000000003'::uuid, NULL, 'building', 'Retail Podium', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0303-0303-0303-000000000003'::uuid, 'bbbbbbbb-0003-0003-0003-000000000003'::uuid, 'cccccccc-0301-0301-0301-000000000001'::uuid, 'level', 'Podium Level', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO spatial_nodes (id, project_id, parent_id, type, name, "order")
VALUES ('cccccccc-0304-0304-0304-000000000004'::uuid, 'bbbbbbbb-0003-0003-0003-000000000003'::uuid, 'cccccccc-0303-0303-0303-000000000003'::uuid, 'zone', 'Lobby Zone', 1)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 8: WORK ITEMS — Airport Terminal Expansion
-- =============================================================

INSERT INTO work_items (id, project_id, spatial_node_id, title, description, status, priority, assigned_to, due_date, progress)
SELECT
  'dddddddd-0101-0101-0101-000000000001'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'Install check-in counter structural steel',
  'Fabricate and install structural steel framework for all 24 check-in counters in Zone A',
  'completed', 'high',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-02-28', 100
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_items (id, project_id, spatial_node_id, title, description, status, priority, assigned_to, due_date, progress)
SELECT
  'dddddddd-0102-0102-0102-000000000002'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'Install baggage conveyor system — Zone A',
  'Full installation of baggage conveyor belt systems, motor units, and control panels',
  'in_progress', 'critical',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-03-20', 60
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_items (id, project_id, spatial_node_id, title, description, status, priority, assigned_to, due_date, progress)
SELECT
  'dddddddd-0103-0103-0103-000000000003'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0106-0106-0106-000000000006'::uuid,
  'X-ray machine installation — Zone B',
  'Install and calibrate 4 x X-ray security screening machines per airport authority spec',
  'blocked', 'critical',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com'),
  '2026-03-15', 25
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_items (id, project_id, spatial_node_id, title, description, status, priority, assigned_to, due_date, progress)
SELECT
  'dddddddd-0104-0104-0104-000000000004'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0107-0107-0107-000000000007'::uuid,
  'Retail unit fit-out — Zone C',
  'Structural partitioning, MEP rough-in, and finishing for retail units C-01 to C-15',
  'planned', 'medium',
  (SELECT id::text FROM bootstrap_users WHERE email = 'site-manager@ammap-test.com'),
  '2026-04-30', 0
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'site-manager@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_items (id, project_id, spatial_node_id, title, description, status, priority, assigned_to, due_date, progress)
SELECT
  'dddddddd-0105-0105-0105-000000000005'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0108-0108-0108-000000000008'::uuid,
  'Boarding gate bridge installation — Zone D',
  'Install jet bridges for gates D1–D12 including hydraulic, electrical, and HVAC connections',
  'in_progress', 'high',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com'),
  '2026-04-15', 40
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 9: WORK ITEMS — Central Hospital Tower
-- =============================================================

INSERT INTO work_items (id, project_id, spatial_node_id, title, description, status, priority, assigned_to, due_date, progress)
SELECT
  'dddddddd-0201-0201-0201-000000000001'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0204-0204-0204-000000000004'::uuid,
  'Emergency department flooring — medical epoxy',
  'Install medical-grade epoxy resin flooring throughout emergency department',
  'completed', 'high',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-02-15', 100
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_items (id, project_id, spatial_node_id, title, description, status, priority, assigned_to, due_date, progress)
SELECT
  'dddddddd-0202-0202-0202-000000000002'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0205-0205-0205-000000000005'::uuid,
  'OPD lobby MEP installation',
  'Mechanical, electrical, and plumbing rough-in for OPD lobby level',
  'in_progress', 'medium',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-03-28', 55
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_items (id, project_id, spatial_node_id, title, description, status, priority, assigned_to, due_date, progress)
SELECT
  'dddddddd-0203-0203-0203-000000000003'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0202-0202-0202-000000000002'::uuid,
  'Basement B1 waterproofing',
  'Full waterproofing membrane application for basement level B1 walls and floor',
  'planned', 'critical',
  (SELECT id::text FROM bootstrap_users WHERE email = 'site-manager@ammap-test.com'),
  '2026-04-10', 0
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'site-manager@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 10: INSPECTIONS
-- =============================================================

INSERT INTO inspections (id, project_id, spatial_node_id, title, status, assigned_to, scheduled_date, completed_date)
SELECT
  'eeeeeeee-0101-0101-0101-000000000001'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'Zone A structural steel inspection',
  'completed',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  now() - interval '14 days',
  now() - interval '13 days'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO inspections (id, project_id, spatial_node_id, title, status, assigned_to, scheduled_date, completed_date)
SELECT
  'eeeeeeee-0102-0102-0102-000000000002'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0106-0106-0106-000000000006'::uuid,
  'Zone B security equipment pre-installation check',
  'scheduled',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  now() + interval '3 days',
  NULL
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO inspections (id, project_id, spatial_node_id, title, status, assigned_to, scheduled_date, completed_date)
SELECT
  'eeeeeeee-0201-0201-0201-000000000001'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0204-0204-0204-000000000004'::uuid,
  'Emergency department flooring QA',
  'completed',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  now() - interval '10 days',
  now() - interval '9 days'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO inspections (id, project_id, spatial_node_id, title, status, assigned_to, scheduled_date, completed_date)
SELECT
  'eeeeeeee-0202-0202-0202-000000000002'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0202-0202-0202-000000000002'::uuid,
  'Basement waterproofing pre-inspection',
  'in_progress',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  now() - interval '2 days',
  NULL
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 11: DEFECTS
-- =============================================================

INSERT INTO defects (id, project_id, spatial_node_id, inspection_id, title, description, severity, status, assigned_to, due_date)
SELECT
  'ffffffff-0101-0101-0101-000000000001'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'eeeeeeee-0101-0101-0101-000000000001'::uuid,
  'Weld quality non-conformance — Column A3',
  'Visual inspection found incomplete weld penetration on column A3 base plate connection',
  'high', 'resolved',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-03-01'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO defects (id, project_id, spatial_node_id, inspection_id, title, description, severity, status, assigned_to, due_date)
SELECT
  'ffffffff-0102-0102-0102-000000000002'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0106-0106-0106-000000000006'::uuid,
  NULL,
  'Conduit routing conflict — Zone B ceiling',
  'Electrical conduit routing conflicts with structural beam at grid B-7, requires rerouting',
  'medium', 'open',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com'),
  '2026-03-25'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO defects (id, project_id, spatial_node_id, inspection_id, title, description, severity, status, assigned_to, due_date)
SELECT
  'ffffffff-0103-0103-0103-000000000003'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0107-0107-0107-000000000007'::uuid,
  NULL,
  'Tile alignment deviation — Zone C floor',
  'Floor tile installation shows >3mm alignment deviation in grid C-retail-02, exceeds tolerance',
  'low', 'in_progress',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-04-01'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO defects (id, project_id, spatial_node_id, inspection_id, title, description, severity, status, assigned_to, due_date)
SELECT
  'ffffffff-0201-0201-0201-000000000001'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0204-0204-0204-000000000004'::uuid,
  'eeeeeeee-0201-0201-0201-000000000001'::uuid,
  'Epoxy flooring delamination — ED bay 4',
  'Flooring shows delamination at emergency department bay 4, 0.5m² area',
  'high', 'in_progress',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-03-18'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO defects (id, project_id, spatial_node_id, inspection_id, title, description, severity, status, assigned_to, due_date)
SELECT
  'ffffffff-0202-0202-0202-000000000002'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0202-0202-0202-000000000002'::uuid,
  'eeeeeeee-0202-0202-0202-000000000002'::uuid,
  'Waterproofing membrane holiday — B1 north wall',
  'Pinhole detected in waterproofing membrane at B1 north wall grid N-12',
  'critical', 'open',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  '2026-03-22'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

-- Closed defect for regression testing
INSERT INTO defects (id, project_id, spatial_node_id, inspection_id, title, description, severity, status, assigned_to, due_date)
SELECT
  'ffffffff-0103-0103-0103-000000000099'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0109-0109-0109-000000000009'::uuid,
  NULL,
  'Paint finish inconsistency — Area A1 (CLOSED)',
  'Minor paint sheen inconsistency on partition wall — resolved and closed',
  'low', 'closed',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-02-20'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 12: CORRECTIVE ACTIONS
-- =============================================================

INSERT INTO corrective_actions (id, project_id, defect_id, title, description, status, assigned_to, due_date)
SELECT
  'aaaabbbb-0101-0101-0101-000000000001'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'ffffffff-0101-0101-0101-000000000001'::uuid,
  'Re-weld column A3 base plate',
  'Grind back and re-weld with full penetration per WPS-47, third-party NDT test required after',
  'completed',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-02-28'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corrective_actions (id, project_id, defect_id, title, description, status, assigned_to, due_date)
SELECT
  'aaaabbbb-0102-0102-0102-000000000002'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'ffffffff-0102-0102-0102-000000000002'::uuid,
  'Reroute conduit via alternative path B-7A',
  'Coordinate with structural engineer for alternative conduit path avoiding beam zone B-7',
  'in_progress',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com'),
  '2026-03-22'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer2@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corrective_actions (id, project_id, defect_id, title, description, status, assigned_to, due_date)
SELECT
  'aaaabbbb-0201-0201-0201-000000000001'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'ffffffff-0201-0201-0201-000000000001'::uuid,
  'Remove and reinstate epoxy flooring — ED bay 4',
  'Full scarification of delaminated section, substrate preparation, and re-application of 3mm epoxy system',
  'in_progress',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  '2026-03-17'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO corrective_actions (id, project_id, defect_id, title, description, status, assigned_to, due_date)
SELECT
  'aaaabbbb-0202-0202-0202-000000000002'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'ffffffff-0202-0202-0202-000000000002'::uuid,
  'Repair waterproofing membrane holiday — B1 north wall',
  'Apply patch repair with compatible membrane material, overlap min 150mm, holiday test after cure',
  'open',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  '2026-03-21'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- SECTION 13: PROGRESS RECORDS (historical — multiple per project)
-- =============================================================

INSERT INTO progress_records (project_id, spatial_node_id, progress_percent, status, recorded_at, recorded_by)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0105-0105-0105-000000000005'::uuid, 20, 'in_progress', now() - interval '30 days',
  (SELECT id::text FROM bootstrap_users WHERE email = 'pm@ammap-test.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'pm@ammap-test.com');

INSERT INTO progress_records (project_id, spatial_node_id, progress_percent, status, recorded_at, recorded_by)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0105-0105-0105-000000000005'::uuid, 45, 'in_progress', now() - interval '20 days',
  (SELECT id::text FROM bootstrap_users WHERE email = 'pm@ammap-test.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'pm@ammap-test.com');

INSERT INTO progress_records (project_id, spatial_node_id, progress_percent, status, recorded_at, recorded_by)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0105-0105-0105-000000000005'::uuid, 70, 'in_progress', now() - interval '10 days',
  (SELECT id::text FROM bootstrap_users WHERE email = 'pm@ammap-test.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'pm@ammap-test.com');

INSERT INTO progress_records (project_id, spatial_node_id, progress_percent, status, recorded_at, recorded_by)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'cccccccc-0105-0105-0105-000000000005'::uuid, 85, 'in_progress', now() - interval '3 days',
  (SELECT id::text FROM bootstrap_users WHERE email = 'pm@ammap-test.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'pm@ammap-test.com');

INSERT INTO progress_records (project_id, spatial_node_id, progress_percent, status, recorded_at, recorded_by)
SELECT 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, 'cccccccc-0204-0204-0204-000000000004'::uuid, 30, 'in_progress', now() - interval '25 days',
  (SELECT id::text FROM bootstrap_users WHERE email = 'pm@ammap-test.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'pm@ammap-test.com');

INSERT INTO progress_records (project_id, spatial_node_id, progress_percent, status, recorded_at, recorded_by)
SELECT 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, 'cccccccc-0204-0204-0204-000000000004'::uuid, 65, 'in_progress', now() - interval '12 days',
  (SELECT id::text FROM bootstrap_users WHERE email = 'pm@ammap-test.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'pm@ammap-test.com');

INSERT INTO progress_records (project_id, spatial_node_id, progress_percent, status, recorded_at, recorded_by)
SELECT 'bbbbbbbb-0002-0002-0002-000000000002'::uuid, 'cccccccc-0204-0204-0204-000000000004'::uuid, 100, 'completed', now() - interval '5 days',
  (SELECT id::text FROM bootstrap_users WHERE email = 'pm@ammap-test.com')
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'pm@ammap-test.com');

-- =============================================================
-- SECTION 14: TIMELINE EVENTS (append-only)
-- =============================================================

INSERT INTO timeline_events (project_id, spatial_node_id, type, title, description, timestamp)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0101-0101-0101-000000000001'::uuid,
  'construction_start',
  'Terminal A construction commenced',
  'Official groundbreaking and mobilization of construction team on site',
  now() - interval '60 days'
);

INSERT INTO timeline_events (project_id, spatial_node_id, type, title, description, timestamp)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'inspection',
  'Zone A structural steel inspection passed',
  'Third-party structural inspection completed with pass result',
  now() - interval '13 days'
);

INSERT INTO timeline_events (project_id, spatial_node_id, type, title, description, timestamp)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'defect_created',
  'Defect raised — weld non-conformance column A3',
  'Weld quality defect identified during inspection and logged',
  now() - interval '13 days'
);

INSERT INTO timeline_events (project_id, spatial_node_id, type, title, description, timestamp)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'defect_resolved',
  'Defect resolved — weld re-done and NDT passed',
  'Column A3 re-weld completed and third-party NDT test passed',
  now() - interval '8 days'
);

INSERT INTO timeline_events (project_id, spatial_node_id, type, title, description, timestamp)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0108-0108-0108-000000000008'::uuid,
  'milestone',
  'Zone D — First jet bridge structural connection complete',
  'Milestone: first jet bridge for gate D1 successfully connected to terminal structure',
  now() - interval '5 days'
);

INSERT INTO timeline_events (project_id, spatial_node_id, type, title, description, timestamp)
VALUES (
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0201-0201-0201-000000000001'::uuid,
  'construction_start',
  'Hospital tower construction commenced',
  'Site cleared and foundation work commenced for main hospital tower',
  now() - interval '45 days'
);

INSERT INTO timeline_events (project_id, spatial_node_id, type, title, description, timestamp)
VALUES (
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0204-0204-0204-000000000004'::uuid,
  'inspection',
  'Emergency department flooring inspection completed',
  'QA inspection of medical epoxy flooring — PASS',
  now() - interval '9 days'
);

INSERT INTO timeline_events (project_id, spatial_node_id, type, title, description, timestamp)
VALUES (
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0204-0204-0204-000000000004'::uuid,
  'defect_created',
  'Defect raised — epoxy delamination ED bay 4',
  'Post-inspection defect: flooring delamination found at emergency bay 4',
  now() - interval '9 days'
);

INSERT INTO timeline_events (project_id, spatial_node_id, type, title, description, timestamp)
VALUES (
  'bbbbbbbb-0003-0003-0003-000000000003'::uuid,
  'cccccccc-0301-0301-0301-000000000001'::uuid,
  'construction_start',
  'Riverside Tower A construction commenced',
  'Foundation piling works commenced for residential Tower A',
  now() - interval '30 days'
);

-- =============================================================
-- SECTION 15: EVIDENCE (metadata rows — no actual file upload)
-- path convention: {project_id}/evidence/{id}.jpg
-- =============================================================

INSERT INTO evidence (id, project_id, spatial_node_id, defect_id, type, title, description, file_url, captured_by, captured_at)
SELECT
  'eeeeffff-0101-0101-0101-000000000001'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'ffffffff-0101-0101-0101-000000000001'::uuid,
  'photo',
  'Column A3 weld defect — before repair',
  'Photo evidence of incomplete weld penetration on column A3 base plate prior to repair',
  'bbbbbbbb-0001-0001-0001-000000000001/evidence/eeeeffff-0101-0101-0101-000000000001.jpg',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  now() - interval '13 days'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO evidence (id, project_id, spatial_node_id, defect_id, type, title, description, file_url, captured_by, captured_at)
SELECT
  'eeeeffff-0102-0102-0102-000000000002'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'ffffffff-0101-0101-0101-000000000001'::uuid,
  'photo',
  'Column A3 weld — after repair NDT passed',
  'Photo and NDT certificate after successful re-weld',
  'bbbbbbbb-0001-0001-0001-000000000001/evidence/eeeeffff-0102-0102-0102-000000000002.jpg',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  now() - interval '8 days'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO evidence (id, project_id, spatial_node_id, work_item_id, type, title, description, file_url, captured_by, captured_at)
SELECT
  'eeeeffff-0103-0103-0103-000000000003'::uuid,
  'bbbbbbbb-0001-0001-0001-000000000001'::uuid,
  'cccccccc-0105-0105-0105-000000000005'::uuid,
  'dddddddd-0101-0101-0101-000000000001'::uuid,
  'photo',
  'Check-in counter steel — completion photo',
  'Photo documenting completed steel framework for all 24 check-in counters',
  'bbbbbbbb-0001-0001-0001-000000000001/evidence/eeeeffff-0103-0103-0103-000000000003.jpg',
  (SELECT id::text FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com'),
  now() - interval '5 days'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'engineer1@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO evidence (id, project_id, spatial_node_id, defect_id, type, title, description, file_url, captured_by, captured_at)
SELECT
  'eeeeffff-0201-0201-0201-000000000001'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0204-0204-0204-000000000004'::uuid,
  'ffffffff-0201-0201-0201-000000000001'::uuid,
  'photo',
  'Epoxy delamination — ED bay 4 close-up',
  'Close-up photo showing extent of flooring delamination at emergency bay 4',
  'bbbbbbbb-0002-0002-0002-000000000002/evidence/eeeeffff-0201-0201-0201-000000000001.jpg',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  now() - interval '9 days'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO evidence (id, project_id, spatial_node_id, defect_id, type, title, description, file_url, captured_by, captured_at)
SELECT
  'eeeeffff-0202-0202-0202-000000000002'::uuid,
  'bbbbbbbb-0002-0002-0002-000000000002'::uuid,
  'cccccccc-0202-0202-0202-000000000002'::uuid,
  'ffffffff-0202-0202-0202-000000000002'::uuid,
  'document',
  'Holiday test report — B1 north wall waterproofing',
  'Electrical spark test report showing pinhole location in membrane',
  'bbbbbbbb-0002-0002-0002-000000000002/evidence/eeeeffff-0202-0202-0202-000000000002.pdf',
  (SELECT id::text FROM bootstrap_users WHERE email = 'qa@ammap-test.com'),
  now() - interval '2 days'
WHERE EXISTS (SELECT 1 FROM bootstrap_users WHERE email = 'qa@ammap-test.com')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- CLEANUP: Drop temp view
-- =============================================================
DROP VIEW IF EXISTS bootstrap_users;

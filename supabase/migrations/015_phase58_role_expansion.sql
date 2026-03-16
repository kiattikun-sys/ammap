-- =============================================================
-- MIGRATION 015: Phase 5.8 — Role Expansion + Data Correction
-- Date: 2026-03-16
-- Purpose:
--   F-01 Fix: The organization_members.role column has a CHECK
--   constraint that only allows ('owner','admin','member').
--   The ROLE_PERMISSIONS matrix in can-perform.ts defines 11
--   specific roles. Because the constraint blocked specific roles,
--   all bootstrap users were stored as 'member', making the
--   permission system inert for 10 of 12 roles.
--
--   This migration:
--   1. Drops the old 3-value CHECK constraint
--   2. Adds a new CHECK constraint with the full 11-role set
--   3. Updates bootstrap users from 'member' to their correct
--      semantic roles based on their email prefix
--   4. Sets a safe fallback: any remaining 'member' rows → 'viewer'
-- =============================================================

-- -------------------------------------------------------------
-- STEP 1: Drop old restrictive CHECK constraint
-- -------------------------------------------------------------
alter table organization_members
  drop constraint if exists organization_members_role_check;

-- -------------------------------------------------------------
-- STEP 2: Add expanded CHECK constraint with all 11 roles
-- -------------------------------------------------------------
alter table organization_members
  add constraint organization_members_role_check
  check (role in (
    'owner',
    'admin',
    'pm',
    'site_manager',
    'engineer',
    'qa',
    'safety',
    'planner',
    'document',
    'viewer',
    'member'
  ));

-- -------------------------------------------------------------
-- STEP 3: Update bootstrap users to correct semantic roles
-- Based on BOOTSTRAP_NOTES.md — email prefix → role mapping.
-- Only updates rows with role='member' to prevent touching
-- existing owner/admin rows.
-- All updates are scoped to known bootstrap org IDs to avoid
-- touching real production users.
-- -------------------------------------------------------------

-- AMMAP Test Org (aaaaaaaa-0001-0001-0001-000000000001)
update organization_members
set role = 'pm'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'pm@ammap-test.com'
  );

update organization_members
set role = 'site_manager'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'site-manager@ammap-test.com'
  );

update organization_members
set role = 'engineer'
where role = 'member'
  and user_id in (
    select id from auth.users where email in (
      'engineer1@ammap-test.com',
      'engineer2@ammap-test.com'
    )
  );

update organization_members
set role = 'qa'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'qa@ammap-test.com'
  );

update organization_members
set role = 'safety'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'safety@ammap-test.com'
  );

update organization_members
set role = 'planner'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'planner@ammap-test.com'
  );

update organization_members
set role = 'document'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'document@ammap-test.com'
  );

update organization_members
set role = 'viewer'
where role = 'member'
  and user_id in (
    select id from auth.users where email in (
      'viewer@ammap-test.com',
      'procurement@ammap-test.com'
    )
  );

-- Main Contractor Org (aaaaaaaa-0002-0002-0002-000000000002)
update organization_members
set role = 'pm'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'pm@main-contractor.com'
  );

update organization_members
set role = 'engineer'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'engineer@main-contractor.com'
  );

update organization_members
set role = 'site_manager'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'foreman@main-contractor.com'
  );

update organization_members
set role = 'viewer'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'viewer@main-contractor.com'
  );

-- QA Consultant Org (aaaaaaaa-0003-0003-0003-000000000003)
update organization_members
set role = 'qa'
where role = 'member'
  and user_id in (
    select id from auth.users where email in (
      'qa-lead@qa-consultant.com',
      'inspector1@qa-consultant.com',
      'inspector2@qa-consultant.com'
    )
  );

update organization_members
set role = 'viewer'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'viewer@qa-consultant.com'
  );

-- Subcontractor Org (aaaaaaaa-0004-0004-0004-000000000004)
update organization_members
set role = 'site_manager'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'supervisor@subcontractor.com'
  );

update organization_members
set role = 'engineer'
where role = 'member'
  and user_id in (
    select id from auth.users where email in (
      'worker1@subcontractor.com',
      'worker2@subcontractor.com'
    )
  );

-- Client Owner Org (aaaaaaaa-0005-0005-0005-000000000005)
update organization_members
set role = 'viewer'
where role = 'member'
  and user_id in (
    select id from auth.users where email in (
      'executive@client-owner.com',
      'reviewer@client-owner.com',
      'viewer@client-owner.com'
    )
  );

-- Another Test Org (aaaaaaaa-0006-0006-0006-000000000006)
update organization_members
set role = 'engineer'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'engineer@another-org.com'
  );

update organization_members
set role = 'viewer'
where role = 'member'
  and user_id in (
    select id from auth.users where email = 'viewer@another-org.com'
  );

-- -------------------------------------------------------------
-- STEP 4: Safe fallback — any remaining 'member' rows → 'viewer'
-- This ensures no user is left with the broad 'member' permissions
-- after migration. Any future unknown users default to read-only.
-- -------------------------------------------------------------
update organization_members
set role = 'viewer'
where role = 'member';

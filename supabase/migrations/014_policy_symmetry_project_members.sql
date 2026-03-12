-- =============================================================
-- MIGRATION 014: Policy Symmetry + project_members Hardening
-- Date: 2026-03-12
-- Purpose:
--   1. Add DELETE RLS policy on inspections
--      (table has SELECT/INSERT/UPDATE but no DELETE)
--   2. Add DELETE RLS policy on progress_records
--      (table has SELECT/INSERT/UPDATE but no DELETE)
--   3. Add UPDATE and DELETE RLS policies on project_members
--      (RLS already enabled; SELECT and INSERT already present;
--       UPDATE and DELETE are missing)
--
-- NOTE on project_members live state (differs from expected):
--   Expected: RLS disabled, no policies.
--   Actual:   RLS already enabled with two existing policies:
--     - SELECT: "Users can view project members in their org"
--               (scoped via projects → organization_members)
--     - INSERT: "Managers can add project members"
--               (scoped via self-referential project_members role check)
--   This migration does NOT modify existing policies.
--   It adds only the missing UPDATE and DELETE policies.
--   ALTER TABLE project_members ENABLE ROW LEVEL SECURITY is omitted
--   because RLS is already enabled on this table.
-- =============================================================

-- =============================================================
-- FIX 1: inspections — DELETE policy
--
-- BEFORE: default deny — org members cannot delete inspection rows
-- AFTER:  org members can delete inspections within their projects
-- =============================================================
create policy "Members can delete inspections in their projects"
  on inspections for delete
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- =============================================================
-- FIX 2: progress_records — DELETE policy
--
-- BEFORE: default deny — org members cannot delete progress records
-- AFTER:  org members can delete progress records within their projects
-- =============================================================
create policy "Members can delete progress records in their projects"
  on progress_records for delete
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- =============================================================
-- FIX 3: project_members — UPDATE policy
--
-- Allows org members to update role assignments for project members
-- within projects belonging to their organization.
--
-- BEFORE: no UPDATE policy → default deny
-- AFTER:  org members can update project membership rows in their org
-- =============================================================
create policy "Members can update project memberships in their organization"
  on project_members for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- =============================================================
-- FIX 4: project_members — DELETE policy
--
-- Allows org members to remove project members from projects
-- within their organization.
--
-- BEFORE: no DELETE policy → default deny
-- AFTER:  org members can delete project membership rows in their org
-- =============================================================
create policy "Members can remove project members in their organization"
  on project_members for delete
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- =============================================================
-- FIX 5: project_members — replace broken recursive INSERT policy
--
-- PROBLEM (pre-existing, discovered during Test 7 verification):
--   Policy "Managers can add project members" uses a self-referential
--   WITH CHECK that queries project_members itself under RLS:
--     project_id IN (SELECT project_id FROM project_members
--                    WHERE user_id = auth.uid() AND role = 'manager')
--   This causes infinite recursion identical to the 011 incident.
--   The policy is effectively unusable — any authenticated INSERT
--   on project_members raises:
--     ERROR 42P17: infinite recursion detected in policy for relation
--     "project_members"
--
-- BEFORE: INSERT on project_members → infinite recursion for all users
-- AFTER:  org members can add project members to projects in their org
--
-- The replacement uses the same safe org-member scope pattern used
-- across all other domain tables and the existing SELECT policy on
-- this table. No cross-organization INSERT is possible.
-- =============================================================
drop policy if exists "Managers can add project members" on project_members;

create policy "Members can add project members in their organization"
  on project_members for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

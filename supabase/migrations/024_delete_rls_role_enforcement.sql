-- =============================================================
-- MIGRATION 024: DELETE RLS Role Enforcement
-- Date: 2026-03-17
-- Purpose:
--   Migration 016 added role != 'viewer' checks to INSERT and UPDATE
--   policies on project-scoped tables. The existing DELETE policies
--   on work_items and defects were not updated at that time — they
--   only enforce tenant membership, not role.
--
--   This migration replaces those DELETE policies to add the same
--   role != 'viewer' guard used on all INSERT/UPDATE policies,
--   preventing viewer-role users from deleting records even if RLS
--   would otherwise allow it.
--
--   No schema changes. No new tables. Additive security hardening.
-- =============================================================

-- -------------------------------------------------------------
-- work_items DELETE: add role != 'viewer' guard
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Members can delete work items in their projects" ON work_items;

CREATE POLICY "Non-viewers can delete work items in their projects"
  ON work_items FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
        AND om.role != 'viewer'
    )
  );

-- -------------------------------------------------------------
-- defects DELETE: add role != 'viewer' guard
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Members can delete defects in their projects" ON defects;

CREATE POLICY "Non-viewers can delete defects in their projects"
  ON defects FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
        AND om.role != 'viewer'
    )
  );

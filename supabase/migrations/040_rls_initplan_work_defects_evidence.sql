-- Migration: 040_rls_initplan_work_defects_evidence
-- Fix auth_rls_initplan on work_items, defects, evidence non-SELECT policies

-- ================================================================
-- work_items
-- ================================================================
DROP POLICY IF EXISTS "Non-viewers can insert work items in their projects" ON work_items;
DROP POLICY IF EXISTS "Non-viewers can update work items in their projects" ON work_items;
DROP POLICY IF EXISTS "Non-viewers can delete work items in their projects" ON work_items;

CREATE POLICY "Non-viewers can insert work items in their projects"
  ON work_items FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Non-viewers can update work items in their projects"
  ON work_items FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Non-viewers can delete work items in their projects"
  ON work_items FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

-- ================================================================
-- defects
-- ================================================================
DROP POLICY IF EXISTS "Non-viewers can insert defects in their projects" ON defects;
DROP POLICY IF EXISTS "Non-viewers can update defects in their projects" ON defects;
DROP POLICY IF EXISTS "Non-viewers can delete defects in their projects" ON defects;

CREATE POLICY "Non-viewers can insert defects in their projects"
  ON defects FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Non-viewers can update defects in their projects"
  ON defects FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Non-viewers can delete defects in their projects"
  ON defects FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

-- ================================================================
-- evidence
-- ================================================================
DROP POLICY IF EXISTS "Non-viewers can insert evidence in their projects" ON evidence;
DROP POLICY IF EXISTS "Non-viewers can update evidence in their projects" ON evidence;
DROP POLICY IF EXISTS "Members can delete evidence in their projects" ON evidence;

CREATE POLICY "Non-viewers can insert evidence in their projects"
  ON evidence FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Non-viewers can update evidence in their projects"
  ON evidence FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Members can delete evidence in their projects"
  ON evidence FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

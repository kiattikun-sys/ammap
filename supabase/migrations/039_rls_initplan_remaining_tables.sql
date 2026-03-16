-- Migration: 039_rls_initplan_remaining_tables
-- Fix auth_rls_initplan WARNs on all remaining tables by replacing
-- auth.uid() with (SELECT auth.uid()) in every RLS policy

-- ================================================================
-- organization_members — DELETE
-- ================================================================
DROP POLICY IF EXISTS "Users can remove their own membership" ON organization_members;
CREATE POLICY "Users can remove their own membership"
  ON organization_members FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ================================================================
-- corrective_actions — all 4 policies
-- ================================================================
DROP POLICY IF EXISTS "Members can view corrective actions in their projects" ON corrective_actions;
DROP POLICY IF EXISTS "Non-viewers can insert corrective actions in their projects" ON corrective_actions;
DROP POLICY IF EXISTS "Non-viewers can update corrective actions in their projects" ON corrective_actions;
DROP POLICY IF EXISTS "Members can delete corrective actions in their projects" ON corrective_actions;

CREATE POLICY "Members can view corrective actions in their projects"
  ON corrective_actions FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Non-viewers can insert corrective actions in their projects"
  ON corrective_actions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Non-viewers can update corrective actions in their projects"
  ON corrective_actions FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Members can delete corrective actions in their projects"
  ON corrective_actions FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- defects — SELECT
-- ================================================================
DROP POLICY IF EXISTS "Members can view defects in their projects" ON defects;
CREATE POLICY "Members can view defects in their projects"
  ON defects FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- evidence — SELECT
-- ================================================================
DROP POLICY IF EXISTS "Members can view evidence in their projects" ON evidence;
CREATE POLICY "Members can view evidence in their projects"
  ON evidence FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- inspections — all 4 policies
-- ================================================================
DROP POLICY IF EXISTS "Members can view inspections in their projects" ON inspections;
DROP POLICY IF EXISTS "Non-viewers can insert inspections in their projects" ON inspections;
DROP POLICY IF EXISTS "Non-viewers can update inspections in their projects" ON inspections;
DROP POLICY IF EXISTS "Members can delete inspections in their projects" ON inspections;

CREATE POLICY "Members can view inspections in their projects"
  ON inspections FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Non-viewers can insert inspections in their projects"
  ON inspections FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Non-viewers can update inspections in their projects"
  ON inspections FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Members can delete inspections in their projects"
  ON inspections FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- timeline_events — SELECT + INSERT
-- ================================================================
DROP POLICY IF EXISTS "Members can view timeline events in their projects" ON timeline_events;
DROP POLICY IF EXISTS "Non-viewers can insert timeline events in their projects" ON timeline_events;

CREATE POLICY "Members can view timeline events in their projects"
  ON timeline_events FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Non-viewers can insert timeline events in their projects"
  ON timeline_events FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

-- ================================================================
-- progress_records — all 4 policies
-- ================================================================
DROP POLICY IF EXISTS "Members can view progress records in their projects" ON progress_records;
DROP POLICY IF EXISTS "Members can insert progress records in their projects" ON progress_records;
DROP POLICY IF EXISTS "Members can update progress records in their projects" ON progress_records;
DROP POLICY IF EXISTS "Members can delete progress records in their projects" ON progress_records;

CREATE POLICY "Members can view progress records in their projects"
  ON progress_records FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Members can insert progress records in their projects"
  ON progress_records FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Members can update progress records in their projects"
  ON progress_records FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Members can delete progress records in their projects"
  ON progress_records FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- spatial_nodes INSERT/DELETE (rebuild from migration 035 with fix)
-- ================================================================
DROP POLICY IF EXISTS "Non-viewers can insert spatial nodes in their projects" ON spatial_nodes;
DROP POLICY IF EXISTS "Non-viewers can delete spatial nodes in their projects" ON spatial_nodes;

CREATE POLICY "Non-viewers can insert spatial nodes in their projects"
  ON spatial_nodes FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

CREATE POLICY "Non-viewers can delete spatial nodes in their projects"
  ON spatial_nodes FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid()) AND om.role != 'viewer'
    )
  );

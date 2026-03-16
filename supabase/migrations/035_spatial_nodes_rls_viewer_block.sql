-- Migration: 035_spatial_nodes_rls_viewer_block
-- Purpose: Prevent viewer-role members from inserting or deleting spatial nodes
-- Consistent with work_items/defects pattern (migration 024)

-- DROP old permissive INSERT/DELETE policies
DROP POLICY IF EXISTS "Members can insert spatial nodes in their projects" ON spatial_nodes;
DROP POLICY IF EXISTS "Members can delete spatial nodes in their projects" ON spatial_nodes;

-- Non-viewers can insert spatial nodes
CREATE POLICY "Non-viewers can insert spatial nodes in their projects"
  ON spatial_nodes
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
        AND om.role != 'viewer'
    )
  );

-- Non-viewers can delete spatial nodes in their projects
CREATE POLICY "Non-viewers can delete spatial nodes in their projects"
  ON spatial_nodes
  FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
        AND om.role != 'viewer'
    )
  );

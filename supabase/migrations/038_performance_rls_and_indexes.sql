-- Migration: 038_performance_rls_and_indexes
-- Fix auth_rls_initplan warnings on organizations, projects, project_members, spatial_nodes, work_items
-- Fix multiple_permissive_policies on organization_members INSERT/SELECT and projects UPDATE
-- Add missing FK indexes on corrective_actions, progress_records, timeline_events

-- ================================================================
-- 1. organizations — fix auth.uid() initplan + merge policies
-- ================================================================
DROP POLICY IF EXISTS "Owners can update their organization" ON organizations;
DROP POLICY IF EXISTS "Owners can delete their organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Owners can delete their organization"
  ON organizations FOR DELETE
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- ================================================================
-- 2. organization_members — merge duplicate INSERT + SELECT policies
-- ================================================================
DROP POLICY IF EXISTS "Owners and admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view memberships in their org" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;
DROP POLICY IF EXISTS "Admins and owners can manage members" ON organization_members;
DROP POLICY IF EXISTS "Allow self-join on org creation" ON organization_members;
DROP POLICY IF EXISTS "Members can view org membership" ON organization_members;

CREATE POLICY "Owners and admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner','admin')
    )
  );

CREATE POLICY "Users can view memberships in their org"
  ON organization_members FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- 3. projects — merge duplicate UPDATE policies
-- ================================================================
DROP POLICY IF EXISTS "Owners and admins can archive projects" ON projects;
DROP POLICY IF EXISTS "Owners and admins can update projects" ON projects;
DROP POLICY IF EXISTS "Managers and above can update projects" ON projects;

CREATE POLICY "Owners and admins can update projects"
  ON projects FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid()) AND role IN ('owner','admin','pm')
    )
  );

-- ================================================================
-- 4. projects SELECT — fix auth.uid() initplan
-- ================================================================
DROP POLICY IF EXISTS "Users can view projects in their org" ON projects;

CREATE POLICY "Users can view projects in their org"
  ON projects FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- 5. project_members SELECT — fix auth.uid() initplan
-- ================================================================
DROP POLICY IF EXISTS "Users can view project members in their org" ON project_members;

CREATE POLICY "Users can view project members in their org"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- 6. spatial_nodes — fix auth.uid() initplan for SELECT and UPDATE
-- ================================================================
DROP POLICY IF EXISTS "Members can view spatial nodes in their projects" ON spatial_nodes;
DROP POLICY IF EXISTS "Members can update spatial nodes in their projects" ON spatial_nodes;

CREATE POLICY "Members can view spatial nodes in their projects"
  ON spatial_nodes FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Members can update spatial nodes in their projects"
  ON spatial_nodes FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- 7. work_items SELECT — fix auth.uid() initplan
-- ================================================================
DROP POLICY IF EXISTS "Members can view work items in their projects" ON work_items;

CREATE POLICY "Members can view work items in their projects"
  ON work_items FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- 8. Missing FK indexes
-- ================================================================
CREATE INDEX IF NOT EXISTS corrective_actions_spatial_node_id_idx
  ON corrective_actions (spatial_node_id);

CREATE INDEX IF NOT EXISTS progress_records_spatial_node_id_idx
  ON progress_records (spatial_node_id);

CREATE INDEX IF NOT EXISTS timeline_events_spatial_node_id_idx
  ON timeline_events (spatial_node_id);

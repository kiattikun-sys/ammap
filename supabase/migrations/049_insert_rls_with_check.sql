-- ================================================================
-- 049_insert_rls_with_check
-- Add WITH CHECK to INSERT RLS policies so users cannot insert
-- records belonging to projects outside their organization.
-- ================================================================

-- work_items
DROP POLICY IF EXISTS "Non-viewers can insert work items in their projects" ON public.work_items;
CREATE POLICY "Non-viewers can insert work items in their projects"
  ON public.work_items FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- defects
DROP POLICY IF EXISTS "Non-viewers can insert defects in their projects" ON public.defects;
CREATE POLICY "Non-viewers can insert defects in their projects"
  ON public.defects FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- inspections
DROP POLICY IF EXISTS "Non-viewers can insert inspections in their projects" ON public.inspections;
CREATE POLICY "Non-viewers can insert inspections in their projects"
  ON public.inspections FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- evidence
DROP POLICY IF EXISTS "Non-viewers can insert evidence in their projects" ON public.evidence;
CREATE POLICY "Non-viewers can insert evidence in their projects"
  ON public.evidence FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- corrective_actions
DROP POLICY IF EXISTS "Non-viewers can insert corrective actions in their projects" ON public.corrective_actions;
CREATE POLICY "Non-viewers can insert corrective actions in their projects"
  ON public.corrective_actions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- spatial_nodes
DROP POLICY IF EXISTS "Non-viewers can insert spatial nodes in their projects" ON public.spatial_nodes;
CREATE POLICY "Non-viewers can insert spatial nodes in their projects"
  ON public.spatial_nodes FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

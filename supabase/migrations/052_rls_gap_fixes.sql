-- ================================================================
-- 052_rls_gap_fixes
-- Fix all RLS gaps found in permissions audit:
-- 1. corrective_actions/evidence/inspections DELETE: restrict to non-viewers
-- 2. progress_records INSERT/UPDATE/DELETE: restrict to non-viewers
-- 3. spatial_nodes UPDATE: restrict to non-viewers + add WITH CHECK
-- 4. projects DELETE: new policy (owners/admins only)
-- 5. projects UPDATE: add WITH CHECK clause
-- 6. organization_members UPDATE: new policy (owners/admins can update roles)
-- 7. timeline_events UPDATE: new policy (non-viewers)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. corrective_actions DELETE → non-viewers only
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Members can delete corrective actions in their projects"
  ON public.corrective_actions;

CREATE POLICY "Non-viewers can delete corrective actions in their projects"
  ON public.corrective_actions FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- ----------------------------------------------------------------
-- 2. evidence DELETE → non-viewers only
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Members can delete evidence in their projects"
  ON public.evidence;

CREATE POLICY "Non-viewers can delete evidence in their projects"
  ON public.evidence FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- ----------------------------------------------------------------
-- 3. inspections DELETE → non-viewers only
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Members can delete inspections in their projects"
  ON public.inspections;

CREATE POLICY "Non-viewers can delete inspections in their projects"
  ON public.inspections FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- ----------------------------------------------------------------
-- 4. progress_records: restrict INSERT/UPDATE/DELETE to non-viewers
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Members can insert progress records in their projects"
  ON public.progress_records;
CREATE POLICY "Non-viewers can insert progress records in their projects"
  ON public.progress_records FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

DROP POLICY IF EXISTS "Members can update progress records in their projects"
  ON public.progress_records;
CREATE POLICY "Non-viewers can update progress records in their projects"
  ON public.progress_records FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

DROP POLICY IF EXISTS "Members can delete progress records in their projects"
  ON public.progress_records;
CREATE POLICY "Non-viewers can delete progress records in their projects"
  ON public.progress_records FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- ----------------------------------------------------------------
-- 5. spatial_nodes UPDATE → non-viewers only + WITH CHECK
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Members can update spatial nodes in their projects"
  ON public.spatial_nodes;

CREATE POLICY "Non-viewers can update spatial nodes in their projects"
  ON public.spatial_nodes FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

-- ----------------------------------------------------------------
-- 6. projects DELETE → owners and admins only
-- ----------------------------------------------------------------
CREATE POLICY "Owners and admins can delete projects"
  ON public.projects FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ----------------------------------------------------------------
-- 7. projects UPDATE → add WITH CHECK (same condition as USING)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Owners and admins can update projects"
  ON public.projects;

CREATE POLICY "Owners and admins can update projects"
  ON public.projects FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'pm')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'pm')
    )
  );

-- ----------------------------------------------------------------
-- 8. organization_members UPDATE → owners/admins can update roles
--    (cannot promote to owner — owner role is set at org creation)
-- ----------------------------------------------------------------
CREATE POLICY "Owners and admins can update member roles"
  ON public.organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members om2
      WHERE om2.user_id = auth.uid()
        AND om2.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members om2
      WHERE om2.user_id = auth.uid()
        AND om2.role IN ('owner', 'admin')
    )
    AND role <> 'owner'
  );

-- ----------------------------------------------------------------
-- 9. timeline_events UPDATE → non-viewers only
-- ----------------------------------------------------------------
CREATE POLICY "Non-viewers can update timeline events in their projects"
  ON public.timeline_events FOR UPDATE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

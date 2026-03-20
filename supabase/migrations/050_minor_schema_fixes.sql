-- ================================================================
-- 050_minor_schema_fixes
-- - UNIQUE constraint on registration_requests.email
-- - DELETE policy on timeline_events
-- (role CHECK constraints already exist from prior migrations)
-- ================================================================

-- UNIQUE email on registration_requests
ALTER TABLE public.registration_requests
  ADD CONSTRAINT registration_requests_email_key UNIQUE (email);

-- DELETE policy on timeline_events
CREATE POLICY "Non-viewers can delete timeline events in their projects"
  ON public.timeline_events FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role <> 'viewer'
    )
  );

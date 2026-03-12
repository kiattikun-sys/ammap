-- =============================================================
-- PHASE 0: SECURITY CONTAINMENT
-- Date: 2026-03-12
-- Purpose: Enable RLS on defects, harden projects.organization_id,
--          create evidence-files storage bucket with policies.
-- =============================================================

-- -------------------------------------------------------------
-- TASK 1: Enable RLS on defects
-- SELECT/INSERT/UPDATE policies already existed from migration 004.
-- Only the RLS enable flag and DELETE policy were missing.
-- -------------------------------------------------------------

ALTER TABLE defects ENABLE ROW LEVEL SECURITY;

-- Add missing DELETE policy (SELECT/INSERT/UPDATE already exist from 004)
CREATE POLICY "Members can delete defects in their projects"
  ON defects FOR DELETE
  USING (
    project_id IN (
      SELECT p.id
      FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- TASK 2: Enforce projects.organization_id NOT NULL
-- Pre-verified: 0 NULL rows exist in projects table.
-- FK to organizations.id already exists (projects_organization_id_fkey).
-- Only the NOT NULL constraint was missing.
-- -------------------------------------------------------------

ALTER TABLE projects
  ALTER COLUMN organization_id SET NOT NULL;

-- -------------------------------------------------------------
-- TASK 3: Create evidence-files storage bucket
-- Path convention enforced by policies: {project_id}/{filename}
-- Bucket is private (public = false).
-- Storage policies are tenant-scoped via organization_members.
-- NOTE: storage.buckets INSERT and storage.objects policies were
-- applied via execute_sql (service_role) as Supabase Storage API
-- does not support these via apply_migration. They are documented
-- here for reproducibility.
-- -------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-files',
  'evidence-files',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org members can upload evidence files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'evidence-files'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can read evidence files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'evidence-files'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can delete evidence files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'evidence-files'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

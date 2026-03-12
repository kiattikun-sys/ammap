-- =============================================================
-- MIGRATION 013: Evidence Lifecycle Hardening
-- Date: 2026-03-12
-- Purpose:
--   1. Add DELETE RLS policy on public.evidence
--      (table currently has SELECT / INSERT / UPDATE but no DELETE)
--   2. Add UPDATE policy on storage.objects for bucket 'evidence-files'
--      (bucket currently has SELECT / INSERT / DELETE but no UPDATE)
--
-- Both gaps break the full evidence lifecycle:
--   - Gap 1: authenticated org members silently cannot delete evidence rows
--   - Gap 2: authenticated org members cannot overwrite an existing file
--     (Supabase Storage re-uploads to an existing path are executed as
--      UPDATE on storage.objects; without this policy they are rejected)
--
-- Scoping:
--   Both policies use the identical tenant isolation pattern already in
--   use across the system:
--     project_id → projects → organization_members → auth.uid()
--   No cross-organization access is introduced.
-- =============================================================

-- -------------------------------------------------------------
-- FIX A: evidence table — DELETE policy
--
-- BEFORE: RLS enabled, no DELETE policy → default deny
--   DELETE FROM evidence WHERE id = <any id>  → 0 rows, no error
--
-- AFTER: org members can delete evidence in their projects
--   DELETE FROM evidence WHERE id = <their row>  → row deleted
--   DELETE FROM evidence WHERE id = <cross-org>  → 0 rows (blocked)
-- -------------------------------------------------------------
create policy "Members can delete evidence in their projects"
  on evidence for delete
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- FIX B: storage.objects — UPDATE policy for evidence-files bucket
--
-- Storage path convention (matches existing INSERT/SELECT/DELETE):
--   evidence-files/<project_id>/<filename>
--   storage.foldername(name)[1] = project_id cast to text
--
-- BEFORE: no UPDATE policy → file overwrites rejected by Supabase Storage
--   Uploading to an existing path returns a permission error
--
-- AFTER: org members can overwrite files in their project folders
--   PUT to evidence-files/<their-project-id>/file  → allowed
--   PUT to evidence-files/<other-org-project-id>/file → denied
-- -------------------------------------------------------------
create policy "Org members can update evidence files"
  on storage.objects for update
  using (
    bucket_id = 'evidence-files'
    and (storage.foldername(name))[1] in (
      select p.id::text from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'evidence-files'
    and (storage.foldername(name))[1] in (
      select p.id::text from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

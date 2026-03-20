-- ================================================================
-- 048_projects_status_dates
-- Add status, start_date, end_date columns to projects table.
-- These fields are defined in the Project domain model but were
-- missing from the database schema.
-- ================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS status     text  NOT NULL DEFAULT 'active'
    CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived')),
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date   date;

-- Sync archived projects to 'archived' status
UPDATE public.projects
SET status = 'archived'
WHERE archived_at IS NOT NULL AND status = 'active';

CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);

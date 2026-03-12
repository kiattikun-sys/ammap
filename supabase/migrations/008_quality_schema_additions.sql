-- =============================================================
-- MIGRATION 008: Quality schema additions
-- Date: 2026-03-12
-- Purpose: Capture column additions and constraint modifications
--          on defects and inspections tables that exist in the
--          live database but were never recorded in migrations.
--          All changes were applied ad-hoc directly in Supabase.
--
-- Idempotent: uses ADD COLUMN IF NOT EXISTS and DO $$ blocks
--             for constraint modifications.
-- =============================================================

-- -------------------------------------------------------------
-- TABLE: defects
-- -------------------------------------------------------------

-- Add closed_at column (tracks when a defect was closed/resolved)
alter table defects
  add column if not exists closed_at timestamptz;

-- The original defects.status CHECK in migration 001 was:
--   check (status in ('open','in_progress','resolved','closed'))
-- The live DB has an expanded CHECK that adds 'pending_reinspection'.
-- We drop the old constraint and recreate with the full set.
do $$
begin
  -- Remove old constraint if it has the original 4-value definition
  if exists (
    select 1 from information_schema.check_constraints
    where constraint_schema = 'public'
      and constraint_name = 'defects_status_check'
  ) then
    alter table defects drop constraint defects_status_check;
  end if;

  -- Recreate with full 5-value set matching live DB
  alter table defects
    add constraint defects_status_check
      check (status in ('open', 'in_progress', 'pending_reinspection', 'resolved', 'closed'));
end;
$$;

-- -------------------------------------------------------------
-- TABLE: inspections
-- -------------------------------------------------------------

-- Add inspection_type column (e.g. general, structural, electrical)
alter table inspections
  add column if not exists inspection_type text not null default 'general';

-- Add result column (outcome of a completed inspection)
alter table inspections
  add column if not exists result text;

-- Add inspected_date column (actual date inspection was performed,
-- distinct from scheduled_date and completed_date)
alter table inspections
  add column if not exists inspected_date timestamptz;

-- Add CHECK constraint on result if not already present
do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_schema = 'public'
      and constraint_name = 'inspections_result_check'
  ) then
    alter table inspections
      add constraint inspections_result_check
        check (result in ('pass', 'fail', 'conditional'));
  end if;
end;
$$;

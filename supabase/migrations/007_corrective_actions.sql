-- =============================================================
-- MIGRATION 007: corrective_actions table
-- Date: 2026-03-12
-- Purpose: Capture the corrective_actions table that exists in
--          the live database but was never recorded in migrations.
--          This table was created ad-hoc and is required for the
--          quality management domain.
--
-- Idempotent: uses CREATE TABLE IF NOT EXISTS, CREATE INDEX IF
-- NOT EXISTS, and DO $$ blocks for triggers and policies.
-- =============================================================

-- -------------------------------------------------------------
-- TABLE: corrective_actions
-- -------------------------------------------------------------
create table if not exists corrective_actions (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references projects(id) on delete cascade,
  defect_id           uuid not null references defects(id) on delete cascade,
  spatial_node_id     uuid references spatial_nodes(id) on delete set null,
  action_text         text not null,
  status              text not null default 'open'
                        check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  assigned_to_user_id text,
  due_date            date,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- -------------------------------------------------------------
-- INDEXES
-- -------------------------------------------------------------
create index if not exists corrective_actions_project_id_idx
  on corrective_actions(project_id);

create index if not exists corrective_actions_defect_id_idx
  on corrective_actions(defect_id);

-- -------------------------------------------------------------
-- TRIGGER: updated_at
-- -------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'corrective_actions_updated_at'
      and event_object_table = 'corrective_actions'
      and trigger_schema = 'public'
  ) then
    execute '
      create trigger corrective_actions_updated_at
        before update on corrective_actions
        for each row execute function update_updated_at()
    ';
  end if;
end;
$$;

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
alter table corrective_actions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'corrective_actions'
      and policyname = 'Members can view corrective actions in their projects'
  ) then
    execute '
      create policy "Members can view corrective actions in their projects"
        on corrective_actions for select
        using (
          project_id in (
            select p.id from projects p
            join organization_members om on om.organization_id = p.organization_id
            where om.user_id = auth.uid()
          )
        )
    ';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'corrective_actions'
      and policyname = 'Members can insert corrective actions in their projects'
  ) then
    execute '
      create policy "Members can insert corrective actions in their projects"
        on corrective_actions for insert
        with check (
          project_id in (
            select p.id from projects p
            join organization_members om on om.organization_id = p.organization_id
            where om.user_id = auth.uid()
          )
        )
    ';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'corrective_actions'
      and policyname = 'Members can update corrective actions in their projects'
  ) then
    execute '
      create policy "Members can update corrective actions in their projects"
        on corrective_actions for update
        using (
          project_id in (
            select p.id from projects p
            join organization_members om on om.organization_id = p.organization_id
            where om.user_id = auth.uid()
          )
        )
    ';
  end if;
end;
$$;

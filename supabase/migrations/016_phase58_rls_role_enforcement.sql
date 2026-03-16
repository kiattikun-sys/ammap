-- =============================================================
-- MIGRATION 016: Phase 5.8 — RLS Role Enforcement (F-02 Fix)
-- Date: 2026-03-16
-- Purpose:
--   F-02 Fix: RLS policies previously checked only org membership.
--   Any authenticated org member could bypass requirePermission()
--   by calling the Supabase REST API directly with their JWT.
--   RLS would permit the write because it only checked membership,
--   not role.
--
--   This migration replaces INSERT and UPDATE policies on all
--   project-scoped write tables to require role != 'viewer'.
--   Viewer accounts become truly read-only at the database layer,
--   not just at the application layer.
--
--   Tables patched:
--     - work_items (INSERT, UPDATE)
--     - defects (INSERT, UPDATE)
--     - inspections (INSERT, UPDATE)
--     - corrective_actions (INSERT, UPDATE)
--     - evidence (INSERT, UPDATE)
--     - projects (INSERT)
--
--   SELECT policies are unchanged — viewers can still read all
--   data in their org's projects.
--
--   DELETE policies are unchanged — they were already restricted
--   by org membership and viewer has no UI delete path.
--
--   Pattern used (avoids RLS recursion — subquery on
--   organization_members using projects.organization_id directly):
--
--     EXISTS (
--       SELECT 1 FROM organization_members om
--       WHERE om.organization_id = <table>.organization_id (via subquery)
--         AND om.user_id = auth.uid()
--         AND om.role != 'viewer'
--     )
--
--   NOTE on corrective_actions: this table has project_id but
--   does NOT have organization_id directly. We join through projects.
-- =============================================================

-- =============================================================
-- work_items
-- =============================================================
drop policy if exists "Members can insert work items in their projects" on work_items;
drop policy if exists "Members can update work items in their projects" on work_items;

create policy "Non-viewers can insert work items in their projects"
  on work_items for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

create policy "Non-viewers can update work items in their projects"
  on work_items for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

-- =============================================================
-- defects
-- =============================================================
drop policy if exists "Members can insert defects in their projects" on defects;
drop policy if exists "Members can update defects in their projects" on defects;

create policy "Non-viewers can insert defects in their projects"
  on defects for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

create policy "Non-viewers can update defects in their projects"
  on defects for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

-- =============================================================
-- inspections
-- =============================================================
drop policy if exists "Members can insert inspections in their projects" on inspections;
drop policy if exists "Members can update inspections in their projects" on inspections;

create policy "Non-viewers can insert inspections in their projects"
  on inspections for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

create policy "Non-viewers can update inspections in their projects"
  on inspections for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

-- =============================================================
-- corrective_actions
-- =============================================================
drop policy if exists "Members can insert corrective actions in their projects" on corrective_actions;
drop policy if exists "Members can update corrective actions in their projects" on corrective_actions;

-- corrective_actions has project_id — join through projects
create policy "Non-viewers can insert corrective actions in their projects"
  on corrective_actions for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

create policy "Non-viewers can update corrective actions in their projects"
  on corrective_actions for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

-- =============================================================
-- evidence
-- =============================================================
drop policy if exists "Members can insert evidence in their projects" on evidence;
drop policy if exists "Members can update evidence in their projects" on evidence;

create policy "Non-viewers can insert evidence in their projects"
  on evidence for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

create policy "Non-viewers can update evidence in their projects"
  on evidence for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

-- =============================================================
-- projects INSERT
-- The existing INSERT policy allows all 'owner','admin','member'
-- roles. After migration 015, 'member' no longer exists as a
-- deployed role. Replace to be explicit: owner/admin/pm only.
-- =============================================================
drop policy if exists "Members can create projects in their org" on projects;

create policy "Owners, admins and PMs can create projects in their org"
  on projects for insert
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
        and role in ('owner', 'admin', 'pm')
    )
  );

-- =============================================================
-- timeline_events INSERT — add viewer exclusion
-- Previously any org member could forge timeline events.
-- Now only non-viewer roles can insert timeline events.
-- =============================================================
drop policy if exists "Members can insert timeline events in their projects" on timeline_events;

create policy "Non-viewers can insert timeline events in their projects"
  on timeline_events for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
        and om.role != 'viewer'
    )
  );

-- -------------------------------------------------------
-- Enable RLS on all tables that were left UNRESTRICTED
-- -------------------------------------------------------

alter table spatial_nodes    enable row level security;
alter table work_items       enable row level security;
alter table inspections      enable row level security;
alter table defects          enable row level security;
alter table evidence         enable row level security;
alter table timeline_events  enable row level security;
alter table progress_records enable row level security;

-- -------------------------------------------------------
-- Helper: check if current user is a member of the project
-- -------------------------------------------------------
-- We use a subquery pattern (not a function) so RLS policies
-- are inlined and use the correct auth.uid() per request.

-- -------------------------------------------------------
-- spatial_nodes
-- -------------------------------------------------------
create policy "Members can view spatial nodes in their projects"
  on spatial_nodes for select
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can insert spatial nodes in their projects"
  on spatial_nodes for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can update spatial nodes in their projects"
  on spatial_nodes for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can delete spatial nodes in their projects"
  on spatial_nodes for delete
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- work_items
-- -------------------------------------------------------
create policy "Members can view work items in their projects"
  on work_items for select
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can insert work items in their projects"
  on work_items for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can update work items in their projects"
  on work_items for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can delete work items in their projects"
  on work_items for delete
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- inspections
-- -------------------------------------------------------
create policy "Members can view inspections in their projects"
  on inspections for select
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can insert inspections in their projects"
  on inspections for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can update inspections in their projects"
  on inspections for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- defects
-- -------------------------------------------------------
create policy "Members can view defects in their projects"
  on defects for select
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can insert defects in their projects"
  on defects for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can update defects in their projects"
  on defects for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- evidence
-- -------------------------------------------------------
create policy "Members can view evidence in their projects"
  on evidence for select
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can insert evidence in their projects"
  on evidence for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can update evidence in their projects"
  on evidence for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- timeline_events
-- -------------------------------------------------------
create policy "Members can view timeline events in their projects"
  on timeline_events for select
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can insert timeline events in their projects"
  on timeline_events for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- progress_records
-- -------------------------------------------------------
create policy "Members can view progress records in their projects"
  on progress_records for select
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can insert progress records in their projects"
  on progress_records for insert
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Members can update progress records in their projects"
  on progress_records for update
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

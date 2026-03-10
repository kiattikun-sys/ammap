-- Projects
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Spatial nodes (zones, areas, levels, buildings)
create table if not exists spatial_nodes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  parent_id   uuid references spatial_nodes(id) on delete set null,
  type        text not null check (type in ('building','level','zone','area')),
  name        text not null,
  description text,
  geometry    jsonb,
  "order"     integer not null default 0,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists spatial_nodes_project_id_idx on spatial_nodes(project_id);
create index if not exists spatial_nodes_parent_id_idx  on spatial_nodes(parent_id);

-- Work items (tasks)
create table if not exists work_items (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  spatial_node_id uuid references spatial_nodes(id) on delete set null,
  title           text not null,
  description     text,
  status          text not null default 'planned' check (status in ('planned','in_progress','blocked','completed')),
  priority        text not null default 'medium' check (priority in ('low','medium','high','critical')),
  assigned_to     text,
  due_date        date,
  progress        integer not null default 0 check (progress between 0 and 100),
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists work_items_project_id_idx      on work_items(project_id);
create index if not exists work_items_spatial_node_id_idx on work_items(spatial_node_id);

-- Inspections
create table if not exists inspections (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  spatial_node_id uuid references spatial_nodes(id) on delete set null,
  title           text not null,
  description     text,
  status          text not null default 'scheduled' check (status in ('scheduled','in_progress','completed')),
  assigned_to     text,
  scheduled_date  timestamptz,
  completed_date  timestamptz,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists inspections_project_id_idx on inspections(project_id);

-- Defects
create table if not exists defects (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  spatial_node_id uuid references spatial_nodes(id) on delete set null,
  inspection_id   uuid references inspections(id) on delete set null,
  title           text not null,
  description     text,
  severity        text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status          text not null default 'open'   check (status in ('open','in_progress','resolved','closed')),
  assigned_to     text,
  due_date        date,
  location_lng    double precision,
  location_lat    double precision,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists defects_project_id_idx      on defects(project_id);
create index if not exists defects_spatial_node_id_idx on defects(spatial_node_id);

-- Evidence
create table if not exists evidence (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  spatial_node_id uuid references spatial_nodes(id) on delete set null,
  work_item_id    uuid references work_items(id) on delete set null,
  defect_id       uuid references defects(id) on delete set null,
  type            text not null check (type in ('photo','video','document')),
  title           text not null,
  description     text,
  file_url        text not null,
  thumbnail_url   text,
  location_lng    double precision,
  location_lat    double precision,
  captured_by     text,
  captured_at     timestamptz,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists evidence_project_id_idx      on evidence(project_id);
create index if not exists evidence_spatial_node_id_idx on evidence(spatial_node_id);
create index if not exists evidence_defect_id_idx       on evidence(defect_id);
create index if not exists evidence_work_item_id_idx    on evidence(work_item_id);

-- Timeline events
create table if not exists timeline_events (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  spatial_node_id uuid references spatial_nodes(id) on delete set null,
  type            text not null check (type in ('construction_start','inspection','defect_created','defect_resolved','milestone')),
  title           text not null,
  description     text,
  timestamp       timestamptz not null default now(),
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists timeline_events_project_id_idx on timeline_events(project_id);
create index if not exists timeline_events_timestamp_idx  on timeline_events(timestamp);

-- Progress records
create table if not exists progress_records (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  spatial_node_id uuid references spatial_nodes(id) on delete set null,
  progress_percent integer not null check (progress_percent between 0 and 100),
  status          text not null default 'in_progress' check (status in ('not_started','in_progress','completed','blocked')),
  recorded_at     timestamptz not null default now(),
  recorded_by     text,
  metadata        jsonb not null default '{}'
);
create index if not exists progress_records_project_id_idx on progress_records(project_id);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to all tables with updated_at
do $$
declare
  t text;
begin
  foreach t in array array[
    'projects','spatial_nodes','work_items','inspections',
    'defects','evidence','timeline_events'
  ] loop
    execute format(
      'create trigger %I before update on %I for each row execute function update_updated_at()',
      t || '_updated_at', t
    );
  end loop;
end;
$$;

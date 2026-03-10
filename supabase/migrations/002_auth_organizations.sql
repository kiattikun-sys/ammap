-- Organizations
create table if not exists organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Organization members
create table if not exists organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'member' check (role in ('owner','admin','member')),
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index if not exists org_members_org_id_idx  on organization_members(organization_id);
create index if not exists org_members_user_id_idx on organization_members(user_id);

-- Add organization_id to projects (if column doesn't exist)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'projects' and column_name = 'organization_id'
  ) then
    alter table projects add column organization_id uuid references organizations(id) on delete cascade;
  end if;
end;
$$;
create index if not exists projects_org_id_idx on projects(organization_id);

-- Project members
create table if not exists project_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'viewer' check (role in ('manager','engineer','viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
create index if not exists project_members_project_id_idx on project_members(project_id);
create index if not exists project_members_user_id_idx    on project_members(user_id);

-- Updated_at trigger for organizations
create trigger organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();

-- -------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------

-- organizations
alter table organizations enable row level security;

create policy "Users can view their organizations"
  on organizations for select
  using (
    id in (
      select organization_id from organization_members where user_id = auth.uid()
    )
  );

create policy "Owners can update their organization"
  on organizations for update
  using (owner_id = auth.uid());

create policy "Owners can delete their organization"
  on organizations for delete
  using (owner_id = auth.uid());

create policy "Authenticated users can create organizations"
  on organizations for insert
  with check (auth.uid() is not null);

-- organization_members
alter table organization_members enable row level security;

create policy "Members can view org membership"
  on organization_members for select
  using (
    organization_id in (
      select organization_id from organization_members where user_id = auth.uid()
    )
  );

create policy "Admins and owners can manage members"
  on organization_members for insert
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and role in ('owner','admin')
    )
  );

create policy "Allow self-join on org creation"
  on organization_members for insert
  with check (user_id = auth.uid());

-- projects
alter table projects enable row level security;

create policy "Users can view projects in their org"
  on projects for select
  using (
    organization_id in (
      select organization_id from organization_members where user_id = auth.uid()
    )
  );

create policy "Members can create projects in their org"
  on projects for insert
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and role in ('owner','admin','member')
    )
  );

create policy "Managers and above can update projects"
  on projects for update
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and role in ('owner','admin')
    )
    or
    id in (
      select project_id from project_members
      where user_id = auth.uid() and role = 'manager'
    )
  );

-- project_members
alter table project_members enable row level security;

create policy "Users can view project members in their org"
  on project_members for select
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

create policy "Managers can add project members"
  on project_members for insert
  with check (
    project_id in (
      select project_id from project_members
      where user_id = auth.uid() and role = 'manager'
    )
  );

-- -------------------------------------------------------
-- Auto-create organization on first signup (DB function)
-- -------------------------------------------------------
create or replace function handle_new_user_org()
returns trigger language plpgsql security definer as $$
declare
  org_id uuid;
  org_name text;
begin
  org_name := coalesce(new.raw_user_meta_data->>'org_name', split_part(new.email, '@', 1) || '''s Organization');

  insert into organizations (name, owner_id)
  values (org_name, new.id)
  returning id into org_id;

  insert into organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user_org();

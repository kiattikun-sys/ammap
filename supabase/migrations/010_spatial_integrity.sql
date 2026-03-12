-- =============================================================
-- MIGRATION 010: Spatial Integrity Hardening
-- Date: 2026-03-12
-- Purpose:
--   1. Expand spatial_nodes.type CHECK to include 'site' and
--      'floor' — these types exist in app TypeScript model and
--      Zod validation but were missing from the DB constraint.
--      'level' is retained for backward compatibility.
--   2. Add a BEFORE INSERT/UPDATE trigger that enforces the
--      full parent-child type hierarchy:
--        site     -> no parent required (root)
--        building -> parent must be site (or null if root)
--        floor    -> parent must be building
--        level    -> parent must be building (alias for floor)
--        zone     -> parent must be floor or level
--        area     -> parent must be zone
--   3. Add a BEFORE INSERT/UPDATE trigger that prevents
--      spatial_nodes.parent_id from referencing a node in a
--      different project_id.
--   4. Add a composite index on (project_id, type) for the
--      common query pattern "get all zones in project X".
-- =============================================================

-- -------------------------------------------------------------
-- STEP 1: Expand the type CHECK constraint
-- Drop old 4-value constraint, replace with 6-value set that
-- matches the application's SpatialNodeType enum exactly.
-- 'level' is kept alongside 'floor' for backward compatibility.
-- -------------------------------------------------------------
alter table spatial_nodes drop constraint if exists spatial_nodes_type_check;

alter table spatial_nodes
  add constraint spatial_nodes_type_check
    check (type in ('site', 'building', 'floor', 'level', 'zone', 'area'));

-- -------------------------------------------------------------
-- STEP 2: Trigger function — enforce parent-child hierarchy
--
-- Allowed parent types per node type:
--   site     : parent_id must be NULL (site is always root)
--   building : parent must be 'site', or NULL (standalone building)
--   floor    : parent must be 'building'
--   level    : parent must be 'building' (floor synonym)
--   zone     : parent must be 'floor' or 'level'
--   area     : parent must be 'zone'
--
-- If parent_id is NULL and type requires a parent, the insert
-- is rejected. If parent_id is set and type is 'site', the
-- insert is rejected (sites are always roots).
-- -------------------------------------------------------------
create or replace function enforce_spatial_node_hierarchy()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  parent_type text;
begin
  -- sites must have no parent
  if NEW.type = 'site' and NEW.parent_id is not null then
    raise exception
      'spatial_nodes: type "site" must be a root node (parent_id must be NULL)';
  end if;

  -- all other types require a parent
  if NEW.type != 'site' and NEW.parent_id is null then
    raise exception
      'spatial_nodes: type "%" requires a parent_id (only "site" may be a root node)',
      NEW.type;
  end if;

  -- if a parent is specified, look up its type
  if NEW.parent_id is not null then
    select type into parent_type
    from spatial_nodes
    where id = NEW.parent_id;

    if not found then
      raise exception
        'spatial_nodes: parent_id "%" does not exist', NEW.parent_id;
    end if;

    -- enforce allowed parent types per child type
    if NEW.type = 'building' and parent_type not in ('site') then
      raise exception
        'spatial_nodes: "building" must have a "site" parent, got "%"',
        parent_type;
    end if;

    if NEW.type = 'floor' and parent_type not in ('building') then
      raise exception
        'spatial_nodes: "floor" must have a "building" parent, got "%"',
        parent_type;
    end if;

    if NEW.type = 'level' and parent_type not in ('building') then
      raise exception
        'spatial_nodes: "level" must have a "building" parent, got "%"',
        parent_type;
    end if;

    if NEW.type = 'zone' and parent_type not in ('floor', 'level') then
      raise exception
        'spatial_nodes: "zone" must have a "floor" or "level" parent, got "%"',
        parent_type;
    end if;

    if NEW.type = 'area' and parent_type not in ('zone') then
      raise exception
        'spatial_nodes: "area" must have a "zone" parent, got "%"',
        parent_type;
    end if;
  end if;

  return NEW;
end;
$$;

-- Attach hierarchy trigger (idempotent: drop first)
drop trigger if exists spatial_nodes_enforce_hierarchy on spatial_nodes;

create trigger spatial_nodes_enforce_hierarchy
  before insert or update of type, parent_id
  on spatial_nodes
  for each row
  execute function enforce_spatial_node_hierarchy();

-- -------------------------------------------------------------
-- STEP 3: Trigger function — prevent cross-project parent_id
--
-- Ensures that when parent_id is set, the parent node belongs
-- to the same project_id as the child being inserted/updated.
-- This prevents cross-project spatial tree contamination that
-- the FK constraint alone cannot detect.
-- -------------------------------------------------------------
create or replace function enforce_spatial_node_same_project()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  parent_project_id uuid;
begin
  if NEW.parent_id is null then
    return NEW;
  end if;

  select project_id into parent_project_id
  from spatial_nodes
  where id = NEW.parent_id;

  if not found then
    -- parent existence is already checked by hierarchy trigger
    return NEW;
  end if;

  if parent_project_id != NEW.project_id then
    raise exception
      'spatial_nodes: parent_id "%" belongs to project "%" but child belongs to project "%". Cross-project parent references are not allowed.',
      NEW.parent_id, parent_project_id, NEW.project_id;
  end if;

  return NEW;
end;
$$;

-- Attach same-project trigger (idempotent: drop first)
drop trigger if exists spatial_nodes_enforce_same_project on spatial_nodes;

create trigger spatial_nodes_enforce_same_project
  before insert or update of project_id, parent_id
  on spatial_nodes
  for each row
  execute function enforce_spatial_node_same_project();

-- -------------------------------------------------------------
-- STEP 4: Add missing composite index (project_id, type)
--
-- Covers the query pattern: "get all zones in project X"
-- which appears in zone panels, dashboard, and RLS subqueries.
-- The existing project_id_idx is single-column and cannot
-- satisfy this filter without a full project scan + type filter.
-- -------------------------------------------------------------
create index if not exists spatial_nodes_project_id_type_idx
  on spatial_nodes(project_id, type);

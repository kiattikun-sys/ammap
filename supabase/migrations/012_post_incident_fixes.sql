-- =============================================================
-- MIGRATION 012: Post-incident P0 remediation
-- Date: 2026-03-12
--
-- FIX 1: enforce_spatial_node_hierarchy() — allow building with NULL parent
-- FIX 2: corrective_actions — add DELETE RLS policy
-- =============================================================

-- =============================================================
-- FIX 1: enforce_spatial_node_hierarchy() — building NULL parent
--
-- PROBLEM (migration 010 bug, now live in production):
--   Line: if NEW.type != 'site' and NEW.parent_id is null then RAISE
--   This blanket rule rejects ANY non-site node with NULL parent_id,
--   including type='building'. This directly contradicts the migration
--   010 comment which explicitly states:
--     "building -> parent must be 'site', or NULL (standalone building)"
--
--   AMMAP design intent: a building may exist as a standalone root node
--   (e.g. a single detached building project with no parent site).
--   Rejecting building+NULL parent breaks INSERT and UPDATE for any
--   top-level building, making the spatial tree unusable without a site.
--
-- BEFORE BEHAVIOR:
--   INSERT INTO spatial_nodes (type='building', parent_id=NULL) → EXCEPTION
--   "spatial_nodes: type "building" requires a parent_id
--    (only "site" may be a root node)"
--
-- AFTER BEHAVIOR:
--   INSERT INTO spatial_nodes (type='building', parent_id=NULL) → OK
--   INSERT INTO spatial_nodes (type='floor',    parent_id=NULL) → EXCEPTION
--   INSERT INTO spatial_nodes (type='zone',     parent_id=NULL) → EXCEPTION
--   (all non-root types except building still require a parent)
--
-- The fix changes the NULL-parent guard from:
--   "reject all non-site types with NULL parent"
-- to:
--   "reject all non-site, non-building types with NULL parent"
--
-- All other hierarchy checks (building→site parent, floor→building, etc.)
-- are preserved exactly. Cross-project check (separate trigger) unchanged.
-- =============================================================

create or replace function public.enforce_spatial_node_hierarchy()
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

  -- buildings may be root nodes (standalone building without a parent site)
  -- all other non-site types require a parent
  if NEW.type not in ('site', 'building') and NEW.parent_id is null then
    raise exception
      'spatial_nodes: type "%" requires a parent_id (only "site" and "building" may be root nodes)',
      NEW.type;
  end if;

  -- if a parent is specified, look up its type and validate hierarchy
  if NEW.parent_id is not null then
    select type into parent_type
    from spatial_nodes
    where id = NEW.parent_id;

    if not found then
      raise exception
        'spatial_nodes: parent_id "%" does not exist', NEW.parent_id;
    end if;

    if NEW.type = 'building' and parent_type not in ('site') then
      raise exception
        'spatial_nodes: "building" must have a "site" parent (or no parent), got "%"',
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

-- Trigger already exists from migration 010 — no need to re-create,
-- CREATE OR REPLACE on the function is sufficient.
-- The trigger binding (spatial_nodes_enforce_hierarchy) still points
-- to the same function name and will immediately use the new body.

-- =============================================================
-- FIX 2: corrective_actions DELETE RLS policy
--
-- PROBLEM (migration 007 omission, now live in production):
--   corrective_actions has RLS enabled with SELECT / INSERT / UPDATE
--   policies but NO DELETE policy. Because RLS is enabled, the default
--   deny applies: no authenticated user can delete any row, even their
--   own. This means delete operations in the quality domain silently
--   fail with 0 rows affected (RLS filters the row out before DELETE).
--
-- BEFORE BEHAVIOR:
--   DELETE FROM corrective_actions WHERE id = <any id>  → 0 rows affected
--   (row exists but RLS hides it from the DELETE command)
--
-- AFTER BEHAVIOR:
--   DELETE FROM corrective_actions WHERE id = <id in user's project>
--   → row is deleted
--   DELETE FROM corrective_actions WHERE id = <id in other org's project>
--   → 0 rows affected (tenant isolation preserved)
--
-- SCOPE: org-member-scoped, identical pattern to SELECT/INSERT/UPDATE
-- policies already on this table (project→org join).
-- =============================================================

create policy "Members can delete corrective actions in their projects"
  on corrective_actions for delete
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

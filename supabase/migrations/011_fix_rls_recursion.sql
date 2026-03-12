-- =============================================================
-- MIGRATION 011: Fix RLS infinite recursion
-- Date: 2026-03-12
-- Incident: "infinite recursion detected in policy for relation
--            'organization_members'"
--
-- ROOT CAUSE
-- ----------
-- Two SELECT policies form a mutual reference cycle:
--
--   organizations SELECT policy "Users can view their organizations":
--     USING (id IN (SELECT organization_id FROM organization_members
--                   WHERE user_id = auth.uid()))
--
--   organization_members SELECT policy "Users can view memberships in their org":
--     USING (organization_id IN (SELECT id FROM organizations
--                                WHERE owner_id = auth.uid()))
--
-- Execution path that triggers it:
--   1. Any query on work_items / spatial_nodes / defects / evidence /
--      timeline_events has an RLS subquery that JOINs organization_members.
--   2. organization_members SELECT RLS evaluates both its policies, one of
--      which queries organizations.
--   3. organizations SELECT RLS evaluates "Users can view their organizations",
--      which queries organization_members.
--   4. organization_members SELECT RLS fires again → infinite loop.
--
-- FIX STRATEGY
-- ------------
-- Break the cycle by replacing the organizations SELECT policy with one
-- that does NOT query organization_members.
--
-- organizations.owner_id is a direct column. An owner can always identify
-- their own organization without a membership join. Members (non-owners)
-- can reach their organization via the organization_members.user_id path
-- which is already non-recursive.
--
-- We replace the single recursive organizations SELECT policy with two
-- non-recursive policies:
--
--   a) Owner can see their own org:
--        USING (owner_id = auth.uid())
--      — pure column comparison, zero table joins, zero recursion risk.
--
--   b) Members can see their org via their own membership row:
--        USING (id IN (
--          SELECT organization_id FROM organization_members
--          WHERE user_id = auth.uid()
--        ))
--      — BUT this is still the recursive half! We must break it differently.
--
-- CORRECT BREAK POINT
-- -------------------
-- The ONLY safe break is a SECURITY DEFINER function that bypasses RLS
-- entirely when querying organization_members, allowing the lookup to
-- proceed without triggering organization_members' own SELECT policies.
--
-- Function: auth_user_org_ids()
--   - SECURITY DEFINER (runs as owner, bypasses RLS on organization_members)
--   - Returns the set of organization_ids for the current user
--   - Used as the USING clause for organizations SELECT policy
--   - Used as the base for all downstream project/domain RLS policies
--
-- This eliminates the cycle: organization_members RLS no longer needs to
-- consult organizations, and organizations RLS no longer queries
-- organization_members through an RLS-gated path.
--
-- POLICIES REPLACED
-- -----------------
--   DROP: organizations "Users can view their organizations"  (recursive)
--   ADD:  organizations "Users can view their organizations"  (via SECURITY DEFINER fn)
--
-- POLICIES UNCHANGED
-- ------------------
--   organization_members — all 5 current policies are already non-recursive
--   work_items, spatial_nodes, defects, evidence, timeline_events — unchanged
--   projects — unchanged
--
-- Idempotent: function uses CREATE OR REPLACE; policy uses DO $$ block.
-- =============================================================

-- -------------------------------------------------------------
-- STEP 1: Create SECURITY DEFINER helper function
--
-- Returns the set of organization_ids that auth.uid() belongs to,
-- by querying organization_members WITHOUT triggering its RLS
-- (SECURITY DEFINER runs as the function owner = postgres/service role).
-- -------------------------------------------------------------
create or replace function public.get_auth_user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id
  from organization_members
  where user_id = auth.uid();
$$;

-- Revoke public execute, grant only to authenticated users
revoke execute on function public.get_auth_user_org_ids() from public;
grant execute on function public.get_auth_user_org_ids() to authenticated;

-- -------------------------------------------------------------
-- STEP 2: Replace the recursive organizations SELECT policy
--
-- Old policy (RECURSIVE — queries organization_members through RLS):
--   USING (id IN (SELECT organization_id FROM organization_members
--                 WHERE user_id = auth.uid()))
--
-- New policy (NON-RECURSIVE — uses SECURITY DEFINER function):
--   USING (id IN (SELECT get_auth_user_org_ids()))
--
-- The function bypasses RLS on organization_members so there is
-- no feedback loop back into organizations SELECT RLS.
-- -------------------------------------------------------------
drop policy if exists "Users can view their organizations" on organizations;

create policy "Users can view their organizations"
  on organizations for select
  using (
    id in (select get_auth_user_org_ids())
  );

-- -------------------------------------------------------------
-- STEP 3: Verify no other organizations policies are recursive
-- (audit — no changes needed, documented for completeness)
--
-- "Owners can update their organization"  USING (owner_id = auth.uid()) ✓
-- "Owners can delete their organization"  USING (owner_id = auth.uid()) ✓
-- "Authenticated users can create organizations" WITH CHECK (auth.uid() IS NOT NULL) ✓
-- -------------------------------------------------------------

-- -------------------------------------------------------------
-- STEP 4: Verify organization_members SELECT policies are safe
-- (audit — no changes needed, these were already fixed in 005/009)
--
-- "Users can view their own memberships"
--   USING (user_id = auth.uid())  ← pure column, no join ✓
--
-- "Users can view memberships in their org"
--   USING (organization_id IN (SELECT id FROM organizations
--                               WHERE owner_id = auth.uid()))
--   ← queries organizations but only uses owner_id = auth.uid(),
--     which hits the organizations UPDATE/DELETE policy path (owner_id),
--     NOT the SELECT policy. However, any SELECT on organizations will
--     evaluate ALL SELECT policies including the one we just replaced.
--     After this migration, organizations SELECT uses get_auth_user_org_ids()
--     which is SECURITY DEFINER — no re-entry into organization_members RLS.
--     This path is now safe. ✓
-- -------------------------------------------------------------

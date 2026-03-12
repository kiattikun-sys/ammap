-- =============================================================
-- MIGRATION 009: Tenant Security Hardening
-- Date: 2026-03-12
-- Purpose: Fix two missing RLS policies on organization_members
--          that were defined in migration 005 but never applied
--          to the live database:
--
--   1. "Users can view memberships in their org"
--      Allows an org owner to SELECT all rows in their org.
--      Without this, owners can only see their own member row,
--      making member management UIs impossible.
--
--   2. "Users can remove their own membership"
--      Allows a member to DELETE their own row (self-leave).
--      Without this, no one can leave an organization via RLS.
--
-- Both policies are non-recursive:
--   - SELECT uses organizations.owner_id (direct lookup, no self-join)
--   - DELETE uses user_id = auth.uid() (own row only)
--
-- Idempotent: each CREATE POLICY is wrapped in a DO block
-- that checks pg_policies first.
-- =============================================================

-- -------------------------------------------------------------
-- FIX 1: Org owner can view all members in their organization
-- Mirrors what migration 005 intended but never applied.
-- -------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'organization_members'
      and policyname = 'Users can view memberships in their org'
  ) then
    execute '
      create policy "Users can view memberships in their org"
        on organization_members for select
        using (
          organization_id in (
            select id from organizations where owner_id = auth.uid()
          )
        )
    ';
  end if;
end;
$$;

-- -------------------------------------------------------------
-- FIX 2: Members can remove their own membership (self-leave)
-- Mirrors what migration 005 intended but never applied.
-- -------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'organization_members'
      and policyname = 'Users can remove their own membership'
  ) then
    execute '
      create policy "Users can remove their own membership"
        on organization_members for delete
        using (user_id = auth.uid())
    ';
  end if;
end;
$$;

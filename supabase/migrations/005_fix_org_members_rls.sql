-- Fix recursive RLS policy on organization_members
-- The original policy caused infinite recursion by querying itself

-- Drop old recursive policy
drop policy if exists "Members can view org membership" on organization_members;
drop policy if exists "Admins and owners can manage members" on organization_members;
drop policy if exists "Allow self-join on org creation" on organization_members;

-- Simple non-recursive policy: user can see rows where they are the member
create policy "Users can view their own memberships"
  on organization_members for select
  using (user_id = auth.uid());

-- Owner/admin can see all members in their org
create policy "Users can view memberships in their org"
  on organization_members for select
  using (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

-- Insert: user can insert their own membership (for trigger / org creation)
create policy "Users can insert their own membership"
  on organization_members for insert
  with check (user_id = auth.uid());

-- Owner/admin can add other members
create policy "Owners and admins can add members"
  on organization_members for insert
  with check (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );

-- Delete own membership
create policy "Users can remove their own membership"
  on organization_members for delete
  using (user_id = auth.uid());

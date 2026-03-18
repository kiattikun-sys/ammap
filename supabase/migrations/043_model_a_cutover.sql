-- ================================================================
-- 043_model_a_cutover
-- Phase 4: Model A cutover for new users
--
-- Changes:
-- 1. Gate handle_new_user() trigger: skip org creation for users
--    that do NOT have an approved registration_requests row.
--    Existing users are grandfathered (they already have orgs).
-- 2. Drop "Authenticated users can create organizations" RLS policy
--    to close the direct-insert bypass.
-- 3. Add tighter org-create policy gated by existing membership or approval.
--
-- Existing users: unaffected — their orgs and memberships remain.
-- New users without approval: get profile only, no org, no access.
-- New users with approval: get full org + owner member (via trigger).
-- ================================================================

-- ── 1. Replace handle_new_user() with gated version ─────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id   uuid;
  org_name text;
BEGIN
  -- Always create profile (harmless for unapproved users)
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;

  -- Gate: only create org + member if there is an approved
  -- registration_request for this email.
  -- Existing users already have orgs so this gate only affects new ones.
  -- Invited users provisioned via Admin API will have their
  -- registration_request marked approved before the invite is sent.
  IF EXISTS (
    SELECT 1
    FROM public.registration_requests
    WHERE email = lower(NEW.email)
      AND status = 'approved'
    LIMIT 1
  ) THEN
    org_name := COALESCE(
      NEW.raw_user_meta_data->>'org_name',
      (
        SELECT requested_org_name
        FROM public.registration_requests
        WHERE email = lower(NEW.email) AND status = 'approved'
        LIMIT 1
      ),
      split_part(NEW.email, '@', 1) || '''s Organization'
    );

    INSERT INTO public.organizations (name, owner_id)
    VALUES (org_name, NEW.id)
    RETURNING id INTO org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, NEW.id, 'owner');
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger defensively to ensure it's bound to new function body.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── 2. Drop the open org-create RLS policy ──────────────────────
-- This policy (from 002_auth_organizations) allowed any authenticated
-- user to INSERT into organizations directly, bypassing the trigger gate.
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;


-- ── 3. Add tighter org-create policy ────────────────────────────
-- Existing org members (grandfathered) OR users with an approved request
-- can create organizations.
CREATE POLICY "Approved users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (
    -- Already an org member (grandfathered existing users)
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.organization_members
    )
    OR
    -- Has an approved registration request
    EXISTS (
      SELECT 1 FROM public.registration_requests
      WHERE email = (
        SELECT email FROM auth.users WHERE id = (SELECT auth.uid())
      )
      AND status = 'approved'
    )
  );

-- Migration: 036_fix_signup_trigger_org_creation
-- CRITICAL FIX: on_auth_user_created was calling handle_new_user() (profile only)
-- instead of handle_new_user_org() (profile + org + member).
-- New signups were not getting organizations created automatically.
-- Consolidate both functions into handle_new_user() so profile + org are always created together.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  org_name text;
BEGIN
  -- Create profile
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

  -- Create organization
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'org_name',
    split_part(NEW.email, '@', 1) || '''s Organization'
  );

  INSERT INTO public.organizations (name, owner_id)
  VALUES (org_name, NEW.id)
  RETURNING id INTO org_id;

  -- Add user as owner member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

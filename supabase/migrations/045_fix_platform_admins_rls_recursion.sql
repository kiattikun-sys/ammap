-- ================================================================
-- 045_fix_platform_admins_rls_recursion
-- Replace self-referential RLS policies on platform_admins with
-- a security definer function to break the recursion loop.
-- ================================================================

-- 1. Create security definer functions that check platform admin status
--    without going through RLS (runs as function owner, bypasses policies)
CREATE OR REPLACE FUNCTION is_platform_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := COALESCE(check_user_id, (SELECT auth.uid()));
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = uid
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_platform_owner(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := COALESCE(check_user_id, (SELECT auth.uid()));
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = uid AND role = 'platform_owner'
  );
END;
$$;

-- 2. Drop old recursive policies
DROP POLICY IF EXISTS "Platform admins can view platform_admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform owners can delete platform_admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform owners can insert platform_admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform owners can update platform_admins" ON public.platform_admins;

-- 3. Recreate policies using security definer functions (no recursion)
CREATE POLICY "Platform admins can view platform_admins"
  ON public.platform_admins FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "Platform owners can insert platform_admins"
  ON public.platform_admins FOR INSERT
  WITH CHECK (is_platform_owner());

CREATE POLICY "Platform owners can update platform_admins"
  ON public.platform_admins FOR UPDATE
  USING (is_platform_owner());

CREATE POLICY "Platform owners can delete platform_admins"
  ON public.platform_admins FOR DELETE
  USING (is_platform_owner());

-- 4. Fix registration_requests UPDATE policy (same recursion risk)
DROP POLICY IF EXISTS "Platform admins can update registration requests" ON public.registration_requests;
CREATE POLICY "Platform admins can update registration requests"
  ON public.registration_requests FOR UPDATE
  USING (is_platform_admin());

-- 5. Fix registration_requests SELECT policy
DROP POLICY IF EXISTS "Platform admins can view all registration requests" ON public.registration_requests;
CREATE POLICY "Platform admins can view all registration requests"
  ON public.registration_requests FOR SELECT
  USING (is_platform_admin());

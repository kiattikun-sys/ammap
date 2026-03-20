-- ================================================================
-- 047_profiles_platform_admin_rls
-- Allow platform admins to UPDATE profiles (for suspend/reactivate)
-- Without this, manage-user-status actions must use adminClient only.
-- ================================================================

CREATE POLICY "Platform admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

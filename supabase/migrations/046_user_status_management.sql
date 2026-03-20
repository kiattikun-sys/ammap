-- ================================================================
-- 046_user_status_management
-- Phase 7: Platform-level user lifecycle control
--
-- Adds status fields to profiles table:
--   status:             'active' | 'suspended'  (default: 'active')
--   suspended_at:       timestamp of suspension
--   suspended_by:       uuid of platform admin who suspended
--   suspension_reason:  optional text reason
--   reactivated_at:     timestamp of last reactivation
--   reactivated_by:     uuid of platform admin who reactivated
--
-- All existing rows default to 'active' — no disruption to existing users.
-- ================================================================

-- ── 1. Add status columns to profiles ────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status            text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS suspended_at      timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS reactivated_at    timestamptz,
  ADD COLUMN IF NOT EXISTS reactivated_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 2. Index for fast status lookups in middleware guard ──────────

CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);
CREATE INDEX IF NOT EXISTS profiles_suspended_by_idx ON public.profiles(suspended_by);

-- ── 3. Helper security-definer function: is_user_suspended ────────

CREATE OR REPLACE FUNCTION is_user_suspended(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id AND status = 'suspended'
  );
END;
$$;

-- ── 4. Ensure existing users are all 'active' ────────────────────

UPDATE public.profiles
SET status = 'active'
WHERE status IS NULL;

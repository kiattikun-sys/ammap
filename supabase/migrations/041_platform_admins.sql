-- ================================================================
-- 041_platform_admins
-- Phase 1: Platform governance layer
-- Adds platform_admins table for platform_owner / platform_admin roles.
-- Completely separate from organization_members roles.
-- Seeds kiattikun@tprgs.com as the first platform_owner.
-- NO change to existing users, organizations, or signup trigger.
-- ================================================================

-- ── Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('platform_owner', 'platform_admin')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS platform_admins_user_id_idx ON public.platform_admins(user_id);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform_admins themselves can view the table
CREATE POLICY "Platform admins can view platform_admins"
  ON public.platform_admins FOR SELECT
  USING (
    (SELECT auth.uid()) IN (SELECT user_id FROM public.platform_admins)
  );

-- Only platform_owner can insert new platform_admins
CREATE POLICY "Platform owners can insert platform_admins"
  ON public.platform_admins FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.platform_admins WHERE role = 'platform_owner'
    )
  );

-- Only platform_owner can update platform_admins
CREATE POLICY "Platform owners can update platform_admins"
  ON public.platform_admins FOR UPDATE
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.platform_admins WHERE role = 'platform_owner'
    )
  );

-- Only platform_owner can delete platform_admins
CREATE POLICY "Platform owners can delete platform_admins"
  ON public.platform_admins FOR DELETE
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.platform_admins WHERE role = 'platform_owner'
    )
  );

-- ── Seed: kiattikun@tprgs.com as platform_owner ──────────────────
-- Uses user_id directly — no new auth.users row created.
-- created_by is NULL for the bootstrap seed (no approver above the first owner).
INSERT INTO public.platform_admins (user_id, role, created_by)
SELECT id, 'platform_owner', NULL
FROM auth.users
WHERE email = 'kiattikun@tprgs.com'
ON CONFLICT (user_id) DO NOTHING;

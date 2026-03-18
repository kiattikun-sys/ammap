-- ================================================================
-- 042_registration_requests
-- Phase 2: Registration request layer
-- Public users submit a request before any account is provisioned.
-- No org/user creation happens at submission time.
-- NO change to existing signup trigger or existing users.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.registration_requests (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   text NOT NULL,
  full_name               text NOT NULL,
  company_name            text,
  phone                   text,
  requested_org_name      text NOT NULL,
  status                  text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at             timestamptz,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reg_requests_email_idx  ON public.registration_requests(email);
CREATE INDEX IF NOT EXISTS reg_requests_status_idx ON public.registration_requests(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_registration_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER registration_requests_updated_at
  BEFORE UPDATE ON public.registration_requests
  FOR EACH ROW EXECUTE FUNCTION update_registration_requests_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can INSERT a request
-- This is a public submission form — no auth required
CREATE POLICY "Anyone can submit a registration request"
  ON public.registration_requests FOR INSERT
  WITH CHECK (true);

-- Only platform_admins can SELECT all requests
CREATE POLICY "Platform admins can view all registration requests"
  ON public.registration_requests FOR SELECT
  USING (
    (SELECT auth.uid()) IN (SELECT user_id FROM public.platform_admins)
  );

-- Only platform_admins can UPDATE (approve / reject / add notes)
CREATE POLICY "Platform admins can update registration requests"
  ON public.registration_requests FOR UPDATE
  USING (
    (SELECT auth.uid()) IN (SELECT user_id FROM public.platform_admins)
  );

-- No DELETE policy — requests are a permanent audit trail

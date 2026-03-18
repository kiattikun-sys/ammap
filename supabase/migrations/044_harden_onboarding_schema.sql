-- ================================================================
-- 044_harden_onboarding_schema
-- Phase 5.1: Production hardening schema changes
--
-- 1. Email normalization: enforce lowercase on insert, unique lower index
-- 2. Extend status CHECK to full lifecycle: pending→approved→invited→activated→rejected
-- 3. Add invited_at, invite_attempts, last_invite_error columns
-- 4. Create registration_request_events audit log table
-- 5. Update handle_new_user() trigger to mark status='activated' on signup
-- 6. DB-level email normalization trigger (BEFORE INSERT OR UPDATE)
-- ================================================================

-- ── 1. Email normalization ───────────────────────────────────────

-- Normalize all existing emails to lowercase first
UPDATE public.registration_requests
SET email = lower(email)
WHERE email != lower(email);

-- Add check constraint to enforce lowercase at DB level
ALTER TABLE public.registration_requests
  ADD CONSTRAINT registration_requests_email_lowercase
  CHECK (email = lower(email));

-- Drop old non-functional index, add functional unique index on lower(email)
DROP INDEX IF EXISTS public.reg_requests_email_idx;
CREATE UNIQUE INDEX idx_registration_requests_email_lower
  ON public.registration_requests (lower(email));

-- ── 2. Status lifecycle ──────────────────────────────────────────

-- Drop old CHECK constraint, add new one with full lifecycle states
ALTER TABLE public.registration_requests
  DROP CONSTRAINT IF EXISTS registration_requests_status_check;

ALTER TABLE public.registration_requests
  ADD CONSTRAINT registration_requests_status_check
  CHECK (status IN ('pending', 'approved', 'invited', 'activated', 'rejected'));

-- ── 3. New operational columns ───────────────────────────────────

ALTER TABLE public.registration_requests
  ADD COLUMN IF NOT EXISTS invited_at        timestamptz,
  ADD COLUMN IF NOT EXISTS invite_attempts   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_invite_error text;

-- ── 4. Audit log table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.registration_request_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   uuid        NOT NULL REFERENCES public.registration_requests(id) ON DELETE CASCADE,
  event_type   text        NOT NULL
                             CHECK (event_type IN (
                               'submitted', 'approved', 'rejected',
                               'invited', 'activated', 'resend_invite', 'invite_failed'
                             )),
  performed_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reg_request_events_request_id_idx
  ON public.registration_request_events(request_id);
CREATE INDEX IF NOT EXISTS reg_request_events_event_type_idx
  ON public.registration_request_events(event_type);

-- RLS on audit log
ALTER TABLE public.registration_request_events ENABLE ROW LEVEL SECURITY;

-- Platform admins can read all audit events
CREATE POLICY "Platform admins can view audit events"
  ON public.registration_request_events FOR SELECT
  USING (
    (SELECT auth.uid()) IN (SELECT user_id FROM public.platform_admins)
  );

-- INSERT is allowed from server actions (anon key w/ RLS) and trigger (security definer)
CREATE POLICY "Service role can insert audit events"
  ON public.registration_request_events FOR INSERT
  WITH CHECK (true);

-- ── 5. Update handle_new_user() to mark 'activated' ─────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id   uuid;
  org_name text;
  req_id   uuid;
BEGIN
  -- Always create profile
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

  -- Look up approved or invited request for this email
  SELECT id INTO req_id
  FROM public.registration_requests
  WHERE email = lower(NEW.email)
    AND status IN ('approved', 'invited')
  LIMIT 1;

  IF req_id IS NOT NULL THEN
    -- Resolve org name: prefer metadata, then requested_org_name from request
    org_name := COALESCE(
      NEW.raw_user_meta_data->>'org_name',
      (
        SELECT requested_org_name
        FROM public.registration_requests
        WHERE id = req_id
      ),
      split_part(NEW.email, '@', 1) || '''s Organization'
    );

    INSERT INTO public.organizations (name, owner_id)
    VALUES (org_name, NEW.id)
    RETURNING id INTO org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, NEW.id, 'owner');

    -- Advance lifecycle to 'activated'
    UPDATE public.registration_requests
    SET status = 'activated', updated_at = now()
    WHERE id = req_id;

    -- Audit: activated
    INSERT INTO public.registration_request_events
      (request_id, event_type, performed_by, metadata)
    VALUES (
      req_id,
      'activated',
      NEW.id,
      jsonb_build_object('org_id', org_id, 'org_name', org_name)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger bound to updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 6. Email normalization trigger ───────────────────────────────
-- Force lowercase + trim on every INSERT or email UPDATE

CREATE OR REPLACE FUNCTION normalize_registration_request_email()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER registration_requests_normalize_email
  BEFORE INSERT OR UPDATE OF email ON public.registration_requests
  FOR EACH ROW EXECUTE FUNCTION normalize_registration_request_email();

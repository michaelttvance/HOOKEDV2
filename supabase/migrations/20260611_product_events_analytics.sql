-- Product / analytics event tracking foundation.
--
-- NON-DESTRUCTIVE: creates ONE new table (public.product_events) plus indexes
-- and RLS. It does NOT touch any existing table, column, row, policy, function,
-- trigger, or auth/role model. Safe to apply on top of the current schema.
--
-- Write path: events are inserted EXCLUSIVELY by the service-role server
-- function `recordEvent` (src/lib/analytics.functions.ts). There is intentionally
-- NO anon/authenticated INSERT grant or policy, so the browser cannot write rows
-- directly — it must go through the validated server function.
--
-- Read path: Hooked staff only, via the existing public.is_super_admin() gate.
-- The founder console reads through the service-role client today; the SELECT
-- policy below also allows a future authenticated staff read without a new
-- migration.
--
-- Privacy: this table stores NO direct PII. No email, no IP, no user-agent, no
-- raw request headers. user_id/company_id are opaque UUIDs and are populated
-- only by trusted server-side helpers (never accepted from the browser).

CREATE TABLE IF NOT EXISTS public.product_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name    text NOT NULL,
  company_id    uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id       uuid,   -- auth.users id when known; no FK (avoid coupling to auth schema)
  session_id    text,   -- per-tab session id (sessionStorage), not a Supabase session
  anonymous_id  text,   -- stable per-browser id (localStorage), pre-login attribution
  route         text,   -- pathname the event fired on, e.g. '/demo'
  source        text NOT NULL DEFAULT 'client' CHECK (source IN ('client', 'server')),
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_events IS
  'Append-only product analytics events. Written only by service-role server functions. Contains no direct PII (no email/IP/user-agent).';

-- Query patterns: recent events, per-event-name time series, per-company usage,
-- and per-session funnel reconstruction.
CREATE INDEX IF NOT EXISTS product_events_created_at_idx
  ON public.product_events (created_at DESC);
CREATE INDEX IF NOT EXISTS product_events_name_created_idx
  ON public.product_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS product_events_company_idx
  ON public.product_events (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS product_events_session_idx
  ON public.product_events (session_id);

ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

-- Privileges:
--  * service_role (server functions) gets full access (also bypasses RLS).
--  * authenticated gets SELECT only; the RLS policy below still restricts it to
--    Hooked staff. No INSERT/UPDATE/DELETE for authenticated.
--  * anon gets nothing.
GRANT ALL    ON public.product_events TO service_role;
GRANT SELECT ON public.product_events TO authenticated;
REVOKE ALL   ON public.product_events FROM anon;

-- Hooked staff (founder/admin) may read events for the analytics console.
DROP POLICY IF EXISTS "super admins read product events" ON public.product_events;
CREATE POLICY "super admins read product events"
  ON public.product_events
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- NOTE: no INSERT/UPDATE/DELETE policy on purpose. All writes flow through the
-- service-role server function, which keeps the public write surface validated
-- and rate-limitable in one place.

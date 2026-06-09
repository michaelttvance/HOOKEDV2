
-- 1. Status timeline timestamps on jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS en_route_at timestamptz,
  ADD COLUMN IF NOT EXISTS on_scene_at timestamptz;

-- 2. Per-company editable SMS templates
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sms_templates jsonb NOT NULL DEFAULT '{
    "assigned":"Hi {name}, your driver {driver} is on the way in Truck {truck}. ETA {eta} min. Questions? Call {phone}.",
    "on_scene":"Hi {name}, your driver has arrived at your location.",
    "complete":"Hi {name}, your service is complete. Invoice $ {amount} is ready. Thank you! \u2014 {company}"
  }'::jsonb;

-- 3. SMS message log
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  kind text NOT NULL,
  to_phone text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.sms_messages TO authenticated;
GRANT ALL ON public.sms_messages TO service_role;

ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms read own company"
  ON public.sms_messages FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "sms insert own company"
  ON public.sms_messages FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "sms update own company"
  ON public.sms_messages FOR UPDATE
  TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE INDEX IF NOT EXISTS sms_messages_job_idx ON public.sms_messages(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sms_messages_company_idx ON public.sms_messages(company_id, created_at DESC);

-- Enable realtime on the new SMS log
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_messages;

-- Patch complete_job to also stamp on_scene_at if it wasn't set yet (no-op otherwise)
-- (we keep complete_job behavior; timeline display uses completed_at separately)

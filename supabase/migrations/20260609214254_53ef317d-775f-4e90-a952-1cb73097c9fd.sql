ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS inbound_email_code text UNIQUE
    DEFAULT lower(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

UPDATE public.companies
  SET inbound_email_code = lower(substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 8))
  WHERE inbound_email_code IS NULL;

CREATE INDEX IF NOT EXISTS companies_inbound_email_code_idx
  ON public.companies (inbound_email_code);

CREATE TABLE IF NOT EXISTS public.inbound_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  to_address text NOT NULL,
  from_address text NOT NULL,
  subject text,
  body_text text,
  body_html text,
  parsed_json jsonb,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'received',
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.inbound_emails TO authenticated;
GRANT ALL ON public.inbound_emails TO service_role;

ALTER TABLE public.inbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_members_read_inbound"
  ON public.inbound_emails FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
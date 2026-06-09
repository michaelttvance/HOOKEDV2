
-- Customer accounts
CREATE TABLE public.customer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'other',
  contact_name text,
  email text,
  phone text,
  address text,
  net_terms_days integer NOT NULL DEFAULT 30,
  credit_limit numeric NOT NULL DEFAULT 0,
  custom_pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_accounts_company_id_idx ON public.customer_accounts(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_accounts TO authenticated;
GRANT ALL ON public.customer_accounts TO service_role;

ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own company accounts" ON public.customer_accounts
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "insert own company accounts" ON public.customer_accounts
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "update own company accounts" ON public.customer_accounts
  FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "delete own company accounts" ON public.customer_accounts
  FOR DELETE TO authenticated
  USING (company_id = public.current_company_id());

-- Extend completed_jobs
ALTER TABLE public.completed_jobs
  ADD COLUMN account_id uuid REFERENCES public.customer_accounts(id) ON DELETE SET NULL,
  ADD COLUMN payment_method text,
  ADD COLUMN paid_at timestamptz,
  ADD COLUMN tax_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN tax_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN invoice_number text;

CREATE INDEX completed_jobs_account_id_idx ON public.completed_jobs(account_id);

-- Per-company billing settings
ALTER TABLE public.companies
  ADD COLUMN tax_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN tax_enabled_default boolean NOT NULL DEFAULT false,
  ADD COLUMN invoice_prefix text NOT NULL DEFAULT 'INV-';

-- Per-company invoice number sequence (table-based; no DDL at runtime)
CREATE TABLE public.invoice_counters (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  next_number integer NOT NULL DEFAULT 1001
);

GRANT SELECT ON public.invoice_counters TO authenticated;
GRANT ALL ON public.invoice_counters TO service_role;

ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own counter" ON public.invoice_counters
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

-- Allocate and return the next invoice number for the caller's company.
CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company uuid := public.current_company_id();
  _prefix text;
  _n integer;
BEGIN
  IF _company IS NULL THEN RAISE EXCEPTION 'no company context'; END IF;

  SELECT invoice_prefix INTO _prefix FROM public.companies WHERE id = _company;

  INSERT INTO public.invoice_counters (company_id, next_number)
    VALUES (_company, 1001)
    ON CONFLICT (company_id) DO NOTHING;

  UPDATE public.invoice_counters
    SET next_number = next_number + 1
    WHERE company_id = _company
    RETURNING next_number - 1 INTO _n;

  RETURN COALESCE(_prefix, 'INV-') || _n::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.next_invoice_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_invoice_number() TO authenticated;

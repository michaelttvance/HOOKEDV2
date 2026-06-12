-- Bridge signatures for future private/signed storage without breaking legacy public URLs.
--
-- Scope:
--   * Add nullable signature_path columns to active and completed jobs.
--   * Preserve existing signature_url behavior as the legacy fallback.
--   * Update complete_job so completed jobs retain both signature_url and signature_path.
--
-- Deliberately excluded:
--   * Storage bucket privacy / policies
--   * Any public tracking changes
--   * Any auth / RLS / Stripe / Twilio / billing / dispatch workflow changes

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS signature_path text;

ALTER TABLE public.completed_jobs
  ADD COLUMN IF NOT EXISTS signature_path text;

CREATE OR REPLACE FUNCTION public.complete_job(_job_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _j public.jobs%ROWTYPE;
  _d public.drivers%ROWTYPE;
  _new_id uuid;
BEGIN
  SELECT * INTO _j FROM public.jobs WHERE id = _job_id;
  IF _j.id IS NULL THEN RAISE EXCEPTION 'job not found'; END IF;
  IF _j.company_id <> public.current_company_id() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF _j.assigned_driver_id IS NOT NULL THEN
    SELECT * INTO _d FROM public.drivers WHERE id = _j.assigned_driver_id;
  END IF;

  INSERT INTO public.completed_jobs
    (
      company_id,
      completed_at,
      customer_name,
      driver_id,
      driver_name,
      job_type,
      duration_minutes,
      price,
      payment_status,
      response_minutes,
      signature_url,
      signature_path
    )
    VALUES (
      _j.company_id,
      now(),
      _j.customer_name,
      _d.id,
      _d.name,
      _j.job_type,
      _j.estimated_duration,
      _j.estimated_price,
      'pending',
      GREATEST(5, EXTRACT(EPOCH FROM (now() - _j.created_at))::int / 60),
      _j.signature_url,
      _j.signature_path
    )
    RETURNING id INTO _new_id;

  IF _d.id IS NOT NULL THEN
    UPDATE public.drivers SET status = 'available', current_job_id = NULL WHERE id = _d.id;
  END IF;

  DELETE FROM public.jobs WHERE id = _job_id;
  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_job(uuid) TO authenticated;

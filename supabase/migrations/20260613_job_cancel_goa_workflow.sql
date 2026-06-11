-- Local-only schema reconciliation for the V1 job cancel / GOA workflow.
-- Not applied to live production yet.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_outcome text,
  ADD COLUMN IF NOT EXISTS closed_reason text;

CREATE OR REPLACE FUNCTION public.get_job_tracking(_job_id uuid, _token text)
RETURNS TABLE (
  status text,
  job_type text,
  location text,
  created_at timestamptz,
  assigned_at timestamptz,
  en_route_at timestamptz,
  on_scene_at timestamptz,
  job_lat double precision,
  job_lng double precision,
  company_name text,
  driver_name text,
  truck_number text,
  driver_lat double precision,
  driver_lng double precision,
  eta_min integer,
  closed_outcome text,
  closed_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.status::text,
    j.job_type::text,
    j.location,
    j.created_at,
    j.assigned_at,
    j.en_route_at,
    j.on_scene_at,
    j.lat::double precision,
    j.lng::double precision,
    c.name::text,
    d.name::text,
    d.truck_number::text,
    d.location_lat::double precision,
    d.location_lng::double precision,
    d.eta_min::integer,
    j.closed_outcome,
    j.closed_reason
  FROM public.jobs AS j
  JOIN public.companies AS c ON c.id = j.company_id
  LEFT JOIN public.drivers AS d
    ON d.id = j.assigned_driver_id
   AND d.company_id = j.company_id
  WHERE j.id = _job_id
    AND j.public_token = _token;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_job(_job_id uuid, _outcome text, _reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_reason text := NULLIF(btrim(COALESCE(_reason, '')), '');
BEGIN
  SELECT *
  INTO v_job
  FROM public.jobs
  WHERE id = _job_id
    AND company_id = current_company_id()
    AND closed_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_job.assigned_driver_id IS NOT NULL THEN
    UPDATE public.drivers
    SET status = 'available',
        current_job_id = NULL,
        eta_min = 0
    WHERE id = v_job.assigned_driver_id
      AND company_id = current_company_id();
  END IF;

  UPDATE public.jobs
  SET closed_at = COALESCE(closed_at, NOW()),
      closed_outcome = COALESCE(closed_outcome, _outcome),
      closed_reason = COALESCE(closed_reason, v_reason),
      assigned_driver_id = NULL
  WHERE id = _job_id
    AND company_id = current_company_id();

  RETURN _job_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_job_tracking(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_job_tracking(uuid, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.close_job(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_job(uuid, text, text) TO authenticated;


ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_incoming boolean NOT NULL DEFAULT false;

-- Public submission RPC (anonymous customers)
CREATE OR REPLACE FUNCTION public.create_public_job(
  _company_id uuid,
  _customer_name text,
  _customer_phone text,
  _location text,
  _vehicle_year int,
  _vehicle_make text,
  _vehicle_model text,
  _job_type public.job_type,
  _notes text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _price numeric;
  _dur int;
BEGIN
  -- basic validation
  IF _customer_name IS NULL OR length(trim(_customer_name)) = 0 OR length(_customer_name) > 120 THEN
    RAISE EXCEPTION 'invalid name';
  END IF;
  IF _customer_phone IS NULL OR length(trim(_customer_phone)) = 0 OR length(_customer_phone) > 40 THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;
  IF _location IS NULL OR length(trim(_location)) = 0 OR length(_location) > 300 THEN
    RAISE EXCEPTION 'invalid location';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = _company_id) THEN
    RAISE EXCEPTION 'invalid company';
  END IF;

  _price := CASE _job_type
    WHEN 'Tow' THEN 185 WHEN 'Lockout' THEN 75 WHEN 'Jumpstart' THEN 65
    WHEN 'Tire' THEN 95 WHEN 'Winch' THEN 245 ELSE 120 END;
  _dur := CASE _job_type
    WHEN 'Tow' THEN 55 WHEN 'Lockout' THEN 25 WHEN 'Jumpstart' THEN 20
    WHEN 'Tire' THEN 30 WHEN 'Winch' THEN 70 ELSE 40 END;

  INSERT INTO public.jobs
    (company_id, customer_name, customer_phone, location,
     vehicle_year, vehicle_make, vehicle_model,
     job_type, priority, status, estimated_price, estimated_duration, notes,
     lat, lng, is_incoming)
  VALUES
    (_company_id, trim(_customer_name), trim(_customer_phone), trim(_location),
     _vehicle_year, NULLIF(trim(_vehicle_make), ''), NULLIF(trim(_vehicle_model), ''),
     _job_type, 'Standard', 'unassigned', _price, _dur, NULLIF(trim(_notes), ''),
     30 + floor(random()*40)::int, 30 + floor(random()*40)::int, true)
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_job(uuid, text, text, text, int, text, text, public.job_type, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_public_job(uuid, text, text, text, int, text, text, public.job_type, text) TO anon, authenticated;

-- Public company-name lookup (safe minimal data)
CREATE OR REPLACE FUNCTION public.get_public_company(_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name FROM public.companies WHERE id = _id;
$$;

REVOKE ALL ON FUNCTION public.get_public_company(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_company(uuid) TO anon, authenticated;

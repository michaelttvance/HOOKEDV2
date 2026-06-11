-- 20260612_reconcile_live_schema_drift.sql
-- ---------------------------------------------------------------------------
-- Reconcile live Supabase schema with local migrations (drift capture).
--
-- These objects already exist in the live project but were not present in any
-- local migration file, so a fresh `supabase db reset` would not reproduce
-- production. This migration captures the dispatch-core + demo/seed drift so
-- the database becomes reproducible.
--
-- Scope (approved):
--   * Required dispatch columns:  jobs.{public_token,photos,signature_url,is_demo},
--     completed_jobs.{photos,signature_url,is_demo}, drivers.is_demo
--   * Required trial column:      companies.trial_ends_at
--   * Required functions:         get_job_tracking, seed_demo_data, clear_demo_data
--   * Required grants + storage:  job-media bucket and its two policies
--
-- Deliberately EXCLUDED (handled separately, do not add here):
--   * Twilio:  companies.twilio_number, companies.forward_phone
--   * Stripe:  companies.{stripe_customer_id,stripe_subscription_id,
--              subscription_status,subscription_price_id,
--              subscription_current_period_end,plan}
--
-- Idempotent: every statement is a no-op against the live project and safe to
-- re-run. Function bodies are byte-identical to the live definitions.
-- ---------------------------------------------------------------------------

-- 1. Columns ----------------------------------------------------------------
-- (Added before the functions that reference is_demo / public_token.)

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS public_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(12), 'hex'),
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.completed_jobs
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');

-- 2. Functions (verbatim from live) -----------------------------------------

-- Anon-callable tracking lookup for the public /track/$jobId page.
-- Returns NULL unless both the job id AND its public_token match.
CREATE OR REPLACE FUNCTION public.get_job_tracking(_job_id uuid, _token text)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN j.id IS NULL THEN NULL
    ELSE jsonb_build_object(
      'status', j.status,
      'job_type', j.job_type,
      'location', j.location,
      'created_at', j.created_at,
      'assigned_at', j.assigned_at,
      'en_route_at', j.en_route_at,
      'on_scene_at', j.on_scene_at,
      'job_lat', j.lat,
      'job_lng', j.lng,
      'company_name', c.name,
      'driver_name', CASE WHEN d.id IS NULL THEN NULL ELSE split_part(d.name, ' ', 1) END,
      'truck_number', d.truck_number,
      'driver_lat', d.location_lat,
      'driver_lng', d.location_lng,
      'eta_min', d.eta_min
    )
  END
  FROM public.jobs j
  JOIN public.companies c ON c.id = j.company_id
  LEFT JOIN public.drivers d ON d.id = j.assigned_driver_id
  WHERE j.id = _job_id AND j.public_token = _token;
$function$;

-- Founder "load sample data" tool. Idempotent: wipes prior demo rows first,
-- then seeds a demo fleet, an active board, and 30 days of completed history.
CREATE OR REPLACE FUNCTION public.seed_demo_data()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _co uuid;
  _mike uuid; _sara uuid; _luis uuid; _jess uuid;
  _names text[] := ARRAY['Amanda Reyes','Devon Park','Marcus Lee','Nina Alvarez','Priya Shah','Carlos Mendez','Ethan Wu','Rachel Kim','Tyler Boone','Grace Holt','Omar Farah','Bianca Cruz'];
  _types job_type[] := ARRAY['Tow','Lockout','Jumpstart','Tire','Winch']::job_type[];
  _drivers text[];
  i int;
BEGIN
  _co := public.current_company_id();
  IF _co IS NULL THEN RAISE EXCEPTION 'no company'; END IF;

  -- idempotent: wipe any prior demo rows first
  DELETE FROM public.jobs           WHERE company_id = _co AND is_demo;
  DELETE FROM public.completed_jobs WHERE company_id = _co AND is_demo;
  DELETE FROM public.drivers        WHERE company_id = _co AND is_demo;

  -- Fleet (positions are 0..100 placeholders the app maps onto the live map)
  INSERT INTO public.drivers (company_id,name,truck_number,phone,status,location_lat,location_lng,distance_mi,certifications,is_demo)
    VALUES (_co,'Mike D.','T-07','(816) 555-0107','available',38,42,2.1,ARRAY['Light Duty','Flatbed'],true) RETURNING id INTO _mike;
  INSERT INTO public.drivers (company_id,name,truck_number,phone,status,location_lat,location_lng,distance_mi,certifications,is_demo)
    VALUES (_co,'Sara P.','T-12','(816) 555-0112','en_route',62,28,4.3,ARRAY['Light Duty','Medium Duty'],true) RETURNING id INTO _sara;
  INSERT INTO public.drivers (company_id,name,truck_number,phone,status,location_lat,location_lng,distance_mi,certifications,is_demo)
    VALUES (_co,'Luis R.','T-03','(816) 555-0103','on_scene',35,68,3.0,ARRAY['Heavy Duty','Winch'],true) RETURNING id INTO _luis;
  INSERT INTO public.drivers (company_id,name,truck_number,phone,status,location_lat,location_lng,distance_mi,certifications,is_demo)
    VALUES (_co,'Jess K.','T-18','(816) 555-0118','available',75,22,5.6,ARRAY['Light Duty','Lockout'],true) RETURNING id INTO _jess;

  -- Active board
  INSERT INTO public.jobs (company_id,customer_name,customer_phone,location,vehicle_year,vehicle_make,vehicle_model,job_type,priority,status,assigned_driver_id,notes,estimated_price,estimated_duration,lat,lng,is_demo) VALUES
    (_co,'Amanda Reyes','(816) 555-0142','I-70 W, mile 42 shoulder',2018,'Toyota','Camry','Tow','Urgent','unassigned',NULL,'Customer in vehicle, hazards on',185,45,20,30,true),
    (_co,'Devon Park','(816) 555-0188','742 Market St parking garage',2020,'Honda','Civic','Lockout','Standard','unassigned',NULL,'Keys locked in trunk',75,25,48,40,true),
    (_co,'Nina Alvarez','(816) 555-0166','Mission Bay Garage L2',2016,'Ford','Escape','Tow','Standard','assigned',_sara,'Won''t start, needs flatbed',195,50,55,55,true),
    (_co,'Marcus Lee','(816) 555-0151','Hwy 71 S, exit 8',2014,'Chevy','Silverado','Winch','Standard','on_scene',_luis,'Off-road recovery, ditch',265,70,35,68,true);

  -- 30 days of completed history (3-5/day) for insights + billing
  INSERT INTO public.completed_jobs (company_id,completed_at,customer_name,driver_id,driver_name,job_type,duration_minutes,price,payment_status,response_minutes,is_demo)
  SELECT _co,
         now() - (d || ' days')::interval - (floor(random()*10)||' hours')::interval,
         _names[1 + floor(random()*array_length(_names,1))::int],
         NULL,
         (ARRAY['Mike D.','Sara P.','Luis R.','Jess K.'])[1 + floor(random()*4)::int],
         _types[1 + floor(random()*array_length(_types,1))::int],
         20 + floor(random()*55)::int,
         65 + floor(random()*220)::int,
         (ARRAY['paid','paid','paid','invoiced','pending'])[1 + floor(random()*5)::int]::billing_status,
         6 + floor(random()*22)::int,
         true
  FROM generate_series(0,29) AS d,
       generate_series(1, 3 + floor(random()*3)::int) AS n;
END;
$function$;

-- Founder "clear sample data" tool. Removes only this company's demo rows.
CREATE OR REPLACE FUNCTION public.clear_demo_data()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE _co uuid;
BEGIN
  _co := public.current_company_id();
  IF _co IS NULL THEN RAISE EXCEPTION 'no company'; END IF;
  DELETE FROM public.jobs           WHERE company_id = _co AND is_demo;
  DELETE FROM public.completed_jobs WHERE company_id = _co AND is_demo;
  DELETE FROM public.drivers        WHERE company_id = _co AND is_demo;
END;
$function$;

-- 3. Grants -----------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_job_tracking(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_demo_data() TO authenticated;

-- 4. Storage: job-media bucket + policies ------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-media', 'job-media', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'job media insert'
  ) THEN
    CREATE POLICY "job media insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'job-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'job media read'
  ) THEN
    CREATE POLICY "job media read" ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'job-media');
  END IF;
END $$;

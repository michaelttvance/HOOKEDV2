
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('dispatcher', 'driver');
CREATE TYPE public.driver_status AS ENUM ('available', 'en_route', 'on_scene', 'off');
CREATE TYPE public.job_type AS ENUM ('Tow', 'Lockout', 'Jumpstart', 'Tire', 'Winch');
CREATE TYPE public.job_priority AS ENUM ('Urgent', 'Standard', 'Low');
CREATE TYPE public.job_status AS ENUM ('unassigned', 'assigned', 'en_route', 'on_scene', 'complete');
CREATE TYPE public.billing_status AS ENUM ('paid', 'invoiced', 'pending');

-- COMPANIES
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_company_id_idx ON public.profiles(company_id);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, role)
);
CREATE INDEX user_roles_user_id_idx ON public.user_roles(user_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- INVITES
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'dispatcher',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invites_email_idx ON public.invites(lower(email));
CREATE INDEX invites_token_idx ON public.invites(token);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO authenticated;
GRANT SELECT ON public.invites TO anon;
GRANT ALL ON public.invites TO service_role;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- DRIVERS
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  truck_number text NOT NULL,
  phone text,
  status public.driver_status NOT NULL DEFAULT 'available',
  current_job_id uuid,
  location_lat double precision NOT NULL DEFAULT 50,
  location_lng double precision NOT NULL DEFAULT 50,
  distance_mi numeric(5,2) NOT NULL DEFAULT 5,
  eta_min int NOT NULL DEFAULT 0,
  certifications text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX drivers_company_id_idx ON public.drivers(company_id);
CREATE INDEX drivers_user_id_idx ON public.drivers(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- JOBS
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL,
  customer_phone text,
  location text NOT NULL,
  vehicle_year int,
  vehicle_make text,
  vehicle_model text,
  job_type public.job_type NOT NULL,
  priority public.job_priority NOT NULL DEFAULT 'Standard',
  status public.job_status NOT NULL DEFAULT 'unassigned',
  assigned_driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  notes text,
  estimated_price numeric(10,2) NOT NULL DEFAULT 0,
  estimated_duration int NOT NULL DEFAULT 30,
  lat double precision NOT NULL DEFAULT 50,
  lng double precision NOT NULL DEFAULT 50
);
CREATE INDEX jobs_company_id_idx ON public.jobs(company_id);
CREATE INDEX jobs_assigned_driver_id_idx ON public.jobs(assigned_driver_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- COMPLETED JOBS
CREATE TABLE public.completed_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name text,
  job_type public.job_type NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  price numeric(10,2) NOT NULL DEFAULT 0,
  payment_status public.billing_status NOT NULL DEFAULT 'pending',
  response_minutes int NOT NULL DEFAULT 10
);
CREATE INDEX completed_jobs_company_id_idx ON public.completed_jobs(company_id);
CREATE INDEX completed_jobs_completed_at_idx ON public.completed_jobs(completed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.completed_jobs TO authenticated;
GRANT ALL ON public.completed_jobs TO service_role;
ALTER TABLE public.completed_jobs ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- SECURITY DEFINER HELPERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_driver_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.drivers WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =========================================================
-- RLS POLICIES
-- =========================================================
-- companies: members can see/update their own company
CREATE POLICY "members view own company" ON public.companies FOR SELECT TO authenticated
  USING (id = public.current_company_id());
CREATE POLICY "dispatchers update own company" ON public.companies FOR UPDATE TO authenticated
  USING (id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));
CREATE POLICY "authenticated can insert company" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

-- profiles: a user sees profiles in their company; can update their own
CREATE POLICY "view company profiles" ON public.profiles FOR SELECT TO authenticated
  USING (company_id = public.current_company_id() OR id = auth.uid());
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- user_roles: members see their company's roles
CREATE POLICY "view company roles" ON public.user_roles FOR SELECT TO authenticated
  USING (company_id = public.current_company_id() OR user_id = auth.uid());

-- invites: dispatchers manage their company's invites; anon can read by token (for accept screen)
CREATE POLICY "dispatchers view company invites" ON public.invites FOR SELECT TO authenticated
  USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));
CREATE POLICY "dispatchers insert invites" ON public.invites FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));
CREATE POLICY "dispatchers delete invites" ON public.invites FOR DELETE TO authenticated
  USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));
CREATE POLICY "anyone can look up invite by token" ON public.invites FOR SELECT TO anon
  USING (accepted_at IS NULL);

-- drivers: dispatchers see all; drivers see only themselves
CREATE POLICY "company members view drivers" ON public.drivers FOR SELECT TO authenticated
  USING (
    company_id = public.current_company_id()
    AND (public.has_role(auth.uid(), 'dispatcher') OR user_id = auth.uid())
  );
CREATE POLICY "dispatchers insert drivers" ON public.drivers FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));
CREATE POLICY "dispatchers update drivers" ON public.drivers FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));
CREATE POLICY "drivers update self" ON public.drivers FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "dispatchers delete drivers" ON public.drivers FOR DELETE TO authenticated
  USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));

-- jobs: dispatchers see all company jobs; drivers see only jobs assigned to them
CREATE POLICY "view jobs" ON public.jobs FOR SELECT TO authenticated
  USING (
    company_id = public.current_company_id()
    AND (
      public.has_role(auth.uid(), 'dispatcher')
      OR assigned_driver_id = public.current_driver_id()
    )
  );
CREATE POLICY "dispatchers insert jobs" ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));
CREATE POLICY "dispatchers update jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));
CREATE POLICY "drivers update assigned jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id() AND assigned_driver_id = public.current_driver_id());
CREATE POLICY "dispatchers delete jobs" ON public.jobs FOR DELETE TO authenticated
  USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));

-- completed jobs: members of company can view; dispatchers can update payment
CREATE POLICY "view completed jobs" ON public.completed_jobs FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY "insert completed jobs" ON public.completed_jobs FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "dispatchers update completed jobs" ON public.completed_jobs FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'dispatcher'));

-- =========================================================
-- SEED FUNCTION
-- =========================================================
CREATE OR REPLACE FUNCTION public.seed_company(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d1 uuid; d2 uuid; d3 uuid; d4 uuid;
  i int; t public.job_type; jt_arr public.job_type[] := ARRAY['Tow','Lockout','Jumpstart','Tire','Winch']::public.job_type[];
  price numeric; dur int; bill public.billing_status; resp int; r numeric;
  names text[] := ARRAY['A. Chen','R. Brooks','M. Patel','K. Sato','J. Romero','L. Nguyen','B. Carter','S. Okafor','T. Hayes','F. Diaz'];
  driver_names text[] := ARRAY['Mike D.','Sara P.','Luis R.','Jess K.'];
  d_day int; per_day int; j int;
BEGIN
  -- 4 drivers
  INSERT INTO public.drivers (company_id, name, truck_number, status, location_lat, location_lng, distance_mi, eta_min)
    VALUES (_company_id, 'Mike D.', 'T-07', 'available', 38, 42, 2.1, 0) RETURNING id INTO d1;
  INSERT INTO public.drivers (company_id, name, truck_number, status, location_lat, location_lng, distance_mi, eta_min)
    VALUES (_company_id, 'Sara P.', 'T-12', 'en_route', 62, 28, 4.3, 9) RETURNING id INTO d2;
  INSERT INTO public.drivers (company_id, name, truck_number, status, location_lat, location_lng, distance_mi, eta_min)
    VALUES (_company_id, 'Luis R.', 'T-03', 'on_scene', 24, 70, 6.0, 0) RETURNING id INTO d3;
  INSERT INTO public.drivers (company_id, name, truck_number, status, location_lat, location_lng, distance_mi, eta_min)
    VALUES (_company_id, 'Jess K.', 'T-18', 'available', 70, 60, 3.4, 0) RETURNING id INTO d4;

  -- 6 jobs
  INSERT INTO public.jobs (company_id, customer_name, customer_phone, location, vehicle_year, vehicle_make, vehicle_model, job_type, priority, status, estimated_price, estimated_duration, notes, lat, lng, created_at)
    VALUES (_company_id, 'Amanda Reyes', '(415) 555-0132', 'I-280 N, mile 42', 2019, 'Honda', 'Civic', 'Tow', 'Urgent', 'unassigned', 185, 55, 'Stalled in left lane, hazards on.', 30, 35, now() - interval '7 minutes');
  INSERT INTO public.jobs (company_id, customer_name, customer_phone, location, vehicle_year, vehicle_make, vehicle_model, job_type, priority, status, estimated_price, estimated_duration, lat, lng, created_at)
    VALUES (_company_id, 'Devon Park', '(415) 555-0188', '742 Market St', 2021, 'Tesla', 'Model 3', 'Lockout', 'Standard', 'unassigned', 75, 25, 55, 50, now() - interval '3 minutes');
  INSERT INTO public.jobs (company_id, customer_name, customer_phone, location, vehicle_year, vehicle_make, vehicle_model, job_type, priority, status, estimated_price, estimated_duration, lat, lng, created_at)
    VALUES (_company_id, 'Priya Shah', '(415) 555-0166', 'Costco lot, Daly City', 2017, 'Toyota', 'RAV4', 'Jumpstart', 'Low', 'unassigned', 65, 20, 68, 22, now() - interval '2 minutes');
  INSERT INTO public.jobs (company_id, customer_name, customer_phone, location, vehicle_year, vehicle_make, vehicle_model, job_type, priority, status, assigned_driver_id, estimated_price, estimated_duration, lat, lng, created_at)
    VALUES (_company_id, 'Marcus Lee', '(415) 555-0119', 'Hwy 101 S, exit 432', 2014, 'Ford', 'F-150', 'Tire', 'Standard', 'assigned', d2, 95, 30, 62, 28, now() - interval '12 minutes');
  INSERT INTO public.jobs (company_id, customer_name, customer_phone, location, vehicle_year, vehicle_make, vehicle_model, job_type, priority, status, assigned_driver_id, estimated_price, estimated_duration, lat, lng, created_at)
    VALUES (_company_id, 'Nina Alvarez', '(415) 555-0144', 'Mission Bay Garage L2', 2020, 'BMW', 'X3', 'Tow', 'Standard', 'en_route', d2, 185, 55, 50, 45, now() - interval '18 minutes');
  INSERT INTO public.jobs (company_id, customer_name, customer_phone, location, vehicle_year, vehicle_make, vehicle_model, job_type, priority, status, assigned_driver_id, estimated_price, estimated_duration, lat, lng, created_at)
    VALUES (_company_id, 'Ethan Wu', '(415) 555-0177', 'Off-road, Marin Headlands', 2016, 'Jeep', 'Wrangler', 'Winch', 'Standard', 'on_scene', d3, 245, 70, 24, 70, now() - interval '28 minutes');

  -- 30 days history (3-8 jobs/day)
  FOR d_day IN 0..29 LOOP
    per_day := 3 + floor(random() * 6)::int;
    FOR j IN 1..per_day LOOP
      t := jt_arr[1 + floor(random() * 5)::int];
      price := CASE t
        WHEN 'Tow' THEN 185 WHEN 'Lockout' THEN 75 WHEN 'Jumpstart' THEN 65
        WHEN 'Tire' THEN 95 WHEN 'Winch' THEN 245 END;
      dur := CASE t
        WHEN 'Tow' THEN 55 WHEN 'Lockout' THEN 25 WHEN 'Jumpstart' THEN 20
        WHEN 'Tire' THEN 30 WHEN 'Winch' THEN 70 END;
      price := price + floor((random() - 0.5) * 40);
      r := random();
      bill := CASE WHEN r < 0.62 THEN 'paid'::public.billing_status
                   WHEN r < 0.88 THEN 'invoiced'::public.billing_status
                   ELSE 'pending'::public.billing_status END;
      resp := 6 + floor(random() * 18)::int;
      INSERT INTO public.completed_jobs
        (company_id, completed_at, customer_name, driver_name, job_type, duration_minutes, price, payment_status, response_minutes)
        VALUES (_company_id,
          (now() - (d_day || ' days')::interval)::date + (random() * interval '12 hours'),
          names[1 + floor(random() * 10)::int],
          driver_names[1 + floor(random() * 4)::int],
          t, dur, price, bill, resp);
    END LOOP;
  END LOOP;
END;
$$;

-- =========================================================
-- SIGNUP TRIGGER
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite public.invites%ROWTYPE;
  _company_id uuid;
  _role public.app_role;
  _full_name text;
  _invite_token text;
  _company_name text;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  _invite_token := NEW.raw_user_meta_data->>'invite_token';
  _company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1) || '''s Towing');

  IF _invite_token IS NOT NULL THEN
    SELECT * INTO _invite FROM public.invites
      WHERE token = _invite_token AND accepted_at IS NULL
      LIMIT 1;
  END IF;

  IF _invite.id IS NOT NULL THEN
    _company_id := _invite.company_id;
    _role := _invite.role;
    UPDATE public.invites SET accepted_at = now() WHERE id = _invite.id;
  ELSE
    INSERT INTO public.companies (name) VALUES (_company_name) RETURNING id INTO _company_id;
    _role := 'dispatcher';
  END IF;

  INSERT INTO public.profiles (id, company_id, full_name, email)
    VALUES (NEW.id, _company_id, _full_name, NEW.email);

  INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (NEW.id, _company_id, _role)
    ON CONFLICT DO NOTHING;

  -- If role is driver, attach to first unclaimed driver row, or create one
  IF _role = 'driver' THEN
    UPDATE public.drivers SET user_id = NEW.id
      WHERE company_id = _company_id AND user_id IS NULL
      AND id = (SELECT id FROM public.drivers WHERE company_id = _company_id AND user_id IS NULL ORDER BY created_at LIMIT 1);
    IF NOT FOUND THEN
      INSERT INTO public.drivers (company_id, user_id, name, truck_number, phone)
        VALUES (_company_id, NEW.id, _full_name, 'T-' || lpad((floor(random()*99)+1)::text, 2, '0'), NULL);
    END IF;
  ELSE
    -- New dispatcher company → seed sample data
    IF _invite.id IS NULL THEN
      PERFORM public.seed_company(_company_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- COMPLETE JOB RPC (atomic move to completed_jobs)
-- =========================================================
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
    (company_id, completed_at, customer_name, driver_id, driver_name, job_type, duration_minutes, price, payment_status, response_minutes)
    VALUES (_j.company_id, now(), _j.customer_name, _d.id, _d.name, _j.job_type, _j.estimated_duration, _j.estimated_price, 'pending',
      GREATEST(5, EXTRACT(EPOCH FROM (now() - _j.created_at))::int / 60))
    RETURNING id INTO _new_id;

  IF _d.id IS NOT NULL THEN
    UPDATE public.drivers SET status = 'available', current_job_id = NULL WHERE id = _d.id;
  END IF;

  DELETE FROM public.jobs WHERE id = _job_id;
  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_driver_id() TO authenticated;

-- =========================================================
-- REALTIME
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.completed_jobs;


-- IMPOUND VEHICLES
CREATE TABLE public.impound_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vin text,
  vehicle_year int,
  vehicle_make text,
  vehicle_model text,
  vehicle_color text,
  license_plate text,
  plate_state text,
  owner_name text,
  owner_address text,
  owner_phone text,
  tow_location text,
  tow_reason text,
  towed_by text,
  date_in timestamptz NOT NULL DEFAULT now(),
  date_out timestamptz,
  daily_rate numeric NOT NULL DEFAULT 45,
  initial_tow_fee numeric NOT NULL DEFAULT 185,
  total_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_lot' CHECK (status IN ('in_lot','released','auctioned','abandoned')),
  auction_date date,
  lien_notice_sent_at timestamptz,
  released_to text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_impound_company_status ON public.impound_vehicles(company_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.impound_vehicles TO authenticated;
GRANT ALL ON public.impound_vehicles TO service_role;
ALTER TABLE public.impound_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company members manage impound" ON public.impound_vehicles
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- POLICE DEPARTMENTS / ROTATION
CREATE TABLE public.police_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  coverage_zone text,
  schedule_days text[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun']::text[],
  schedule_start time DEFAULT '00:00',
  schedule_end time DEFAULT '23:59',
  rotation_position int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pd_company ON public.police_departments(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.police_departments TO authenticated;
GRANT ALL ON public.police_departments TO service_role;
ALTER TABLE public.police_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company members manage PDs" ON public.police_departments
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.rotation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pd_id uuid REFERENCES public.police_departments(id) ON DELETE SET NULL,
  pd_name text NOT NULL,
  job_type text,
  response_minutes int,
  accepted boolean NOT NULL DEFAULT true,
  decline_reason text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rotation_history_company ON public.rotation_history(company_id, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rotation_history TO authenticated;
GRANT ALL ON public.rotation_history TO service_role;
ALTER TABLE public.rotation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company members read/write rotation history" ON public.rotation_history
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- MOTOR CLUBS
CREATE TABLE public.motor_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  contact_email text,
  contact_phone text,
  account_number text,
  avg_payout numeric DEFAULT 0,
  jobs_this_month int DEFAULT 0,
  accept_count int DEFAULT 0,
  total_offered int DEFAULT 0,
  eta_codes jsonb DEFAULT '{"en_route":"ER","on_scene":"OS","complete":"GOA"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, provider)
);
CREATE INDEX idx_motor_clubs_company ON public.motor_clubs(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.motor_clubs TO authenticated;
GRANT ALL ON public.motor_clubs TO service_role;
ALTER TABLE public.motor_clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company members manage motor clubs" ON public.motor_clubs
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- Extend JOBS
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS vin text,
  ADD COLUMN IF NOT EXISTS vehicle_color text,
  ADD COLUMN IF NOT EXISTS motor_club_id uuid REFERENCES public.motor_clubs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rotation_pd_id uuid REFERENCES public.police_departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS eta_code text,
  ADD COLUMN IF NOT EXISTS status_sent_at timestamptz;

ALTER TABLE public.completed_jobs
  ADD COLUMN IF NOT EXISTS motor_club_id uuid REFERENCES public.motor_clubs(id) ON DELETE SET NULL;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_impound_updated BEFORE UPDATE ON public.impound_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pd_updated BEFORE UPDATE ON public.police_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_motor_clubs_updated BEFORE UPDATE ON public.motor_clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Next-in-rotation function: returns PD with lowest position who is enabled & on-schedule
CREATE OR REPLACE FUNCTION public.next_rotation_pd()
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _company uuid := public.current_company_id();
  _pd uuid;
BEGIN
  IF _company IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO _pd FROM public.police_departments
    WHERE company_id = _company AND enabled = true
    ORDER BY rotation_position ASC, created_at ASC
    LIMIT 1;
  RETURN _pd;
END $$;

-- Advance rotation: bump the chosen PD to bottom of queue
CREATE OR REPLACE FUNCTION public.advance_rotation(_pd_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _max int;
BEGIN
  SELECT COALESCE(MAX(rotation_position),0)+1 INTO _max FROM public.police_departments
    WHERE company_id = public.current_company_id();
  UPDATE public.police_departments SET rotation_position = _max
    WHERE id = _pd_id AND company_id = public.current_company_id();
END $$;

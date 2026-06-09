
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  business_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city_state text NOT NULL,
  truck_count text NOT NULL,
  current_software text NOT NULL,
  software_complaints text,
  heard_from text NOT NULL,
  biggest_challenge text,
  billing_preference text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  invited_at timestamptz,
  CONSTRAINT applications_full_name_len CHECK (char_length(full_name) BETWEEN 1 AND 200),
  CONSTRAINT applications_business_len CHECK (char_length(business_name) BETWEEN 1 AND 200),
  CONSTRAINT applications_email_len CHECK (char_length(email) BETWEEN 3 AND 320),
  CONSTRAINT applications_phone_len CHECK (char_length(phone) BETWEEN 3 AND 40),
  CONSTRAINT applications_city_len CHECK (char_length(city_state) BETWEEN 1 AND 200),
  CONSTRAINT applications_truck_count_chk CHECK (truck_count IN ('1-2','3-5','6-10','10+')),
  CONSTRAINT applications_billing_chk CHECK (billing_preference IN ('Monthly','Annual','Not sure yet'))
);

GRANT INSERT ON public.applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authed) may submit a new application
CREATE POLICY "anyone can submit application"
  ON public.applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only super admin can read or modify
CREATE POLICY "super admin reads applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super admin updates applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE INDEX applications_created_at_idx ON public.applications (created_at DESC);

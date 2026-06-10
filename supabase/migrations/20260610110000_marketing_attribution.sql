ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS referrer text;

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'Other',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  budget numeric NOT NULL DEFAULT 0,
  goal text,
  notes text,
  target_url text NOT NULL DEFAULT 'https://hookedv-2.vercel.app/apply',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super admins manage marketing campaigns" ON public.marketing_campaigns;
CREATE POLICY "super admins manage marketing campaigns"
ON public.marketing_campaigns
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_marketing_campaigns_updated_at ON public.marketing_campaigns;
CREATE TRIGGER set_marketing_campaigns_updated_at
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.marketing_campaigns (name, channel, status, budget, goal, notes, target_url)
VALUES
  ('Google Search - Tow Dispatch', 'Google', 'active', 500, 'Capture high-intent operators searching for towing dispatch software.', 'Use this for Google Ads or SEO landing-page links.', 'https://hookedv-2.vercel.app/apply'),
  ('Facebook Towing Groups', 'Facebook Group', 'active', 250, 'Test operator interest from towing owner communities.', 'Post educational content and route clicks through the tracked apply link.', 'https://hookedv-2.vercel.app/apply'),
  ('Referral Partners', 'Friend/Referral', 'active', 0, 'Track word-of-mouth referrals from operators, vendors, and associations.', 'Use this link when someone asks for an intro link.', 'https://hookedv-2.vercel.app/apply')
ON CONFLICT DO NOTHING;

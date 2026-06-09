
-- 1. Status enum + columns on profiles
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.profiles
  ADD COLUMN status public.approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN phone text;

-- Existing users: approve them so they aren't locked out
UPDATE public.profiles SET status = 'approved';

-- 2. Approval tokens table
CREATE TABLE public.approval_tokens (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  used_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_tokens TO service_role;
ALTER TABLE public.approval_tokens ENABLE ROW LEVEL SECURITY;
-- No policies = locked from anon/authenticated; only service_role (server fns) can touch it.

-- 3. Admin check helper (hardcoded to mike's email)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND lower(email) = 'mike@hookaidashboard.com'
  );
$$;

-- 4. Update handle_new_user to capture phone and set pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _invite public.invites%ROWTYPE;
  _company_id uuid;
  _role public.app_role;
  _full_name text;
  _invite_token text;
  _company_name text;
  _phone text;
  _status public.approval_status;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  _invite_token := NEW.raw_user_meta_data->>'invite_token';
  _company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1) || '''s Towing');
  _phone := NEW.raw_user_meta_data->>'phone';

  IF _invite_token IS NOT NULL THEN
    SELECT * INTO _invite FROM public.invites
      WHERE token = _invite_token AND accepted_at IS NULL
      LIMIT 1;
  END IF;

  IF _invite.id IS NOT NULL THEN
    _company_id := _invite.company_id;
    _role := _invite.role;
    _status := 'approved'; -- invited users skip the gate
    UPDATE public.invites SET accepted_at = now() WHERE id = _invite.id;
  ELSE
    INSERT INTO public.companies (name) VALUES (_company_name) RETURNING id INTO _company_id;
    _role := 'dispatcher';
    _status := 'pending';
    -- Mike is auto-approved
    IF lower(NEW.email) = 'mike@hookaidashboard.com' THEN
      _status := 'approved';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, company_id, full_name, email, phone, status)
    VALUES (NEW.id, _company_id, _full_name, NEW.email, _phone, _status);

  INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (NEW.id, _company_id, _role)
    ON CONFLICT DO NOTHING;

  IF _role = 'driver' THEN
    UPDATE public.drivers SET user_id = NEW.id
      WHERE company_id = _company_id AND user_id IS NULL
      AND id = (SELECT id FROM public.drivers WHERE company_id = _company_id AND user_id IS NULL ORDER BY created_at LIMIT 1);
    IF NOT FOUND THEN
      INSERT INTO public.drivers (company_id, user_id, name, truck_number, phone)
        VALUES (_company_id, NEW.id, _full_name, 'T-' || lpad((floor(random()*99)+1)::text, 2, '0'), NULL);
    END IF;
  ELSE
    -- Only seed for approved dispatchers (avoid seeding pending accounts)
    IF _invite.id IS NULL AND _status = 'approved' THEN
      PERFORM public.seed_company(_company_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Ensure trigger exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Allow super admin to read all profiles (for /admin page)
CREATE POLICY "super_admin_read_all_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 7. Seed on approval: when a pending dispatcher gets approved, seed their company
CREATE OR REPLACE FUNCTION public.on_profile_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    SELECT role INTO _role FROM public.user_roles WHERE user_id = NEW.id LIMIT 1;
    IF _role = 'dispatcher' AND NOT EXISTS (
      SELECT 1 FROM public.drivers WHERE company_id = NEW.company_id
    ) THEN
      PERFORM public.seed_company(NEW.company_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profile_approved_seed ON public.profiles;
CREATE TRIGGER profile_approved_seed
AFTER UPDATE OF status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_profile_approved();

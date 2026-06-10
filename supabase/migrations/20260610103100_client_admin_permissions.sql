CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = public.current_company_id()
      AND (
        role = _role
        OR (_role = 'dispatcher'::public.app_role AND role = 'admin'::public.app_role)
      )
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

UPDATE public.user_roles
SET role = 'admin'::public.app_role
WHERE user_id IN (
  SELECT id
  FROM auth.users
  WHERE lower(email) IN ('michaelttvance@gmail.com', 'mike@hookaidashboard.com')
);

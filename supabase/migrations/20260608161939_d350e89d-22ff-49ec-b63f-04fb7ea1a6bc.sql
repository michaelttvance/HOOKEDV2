
-- 1) Scope has_role() to caller's company to prevent cross-company privilege escalation
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND company_id = public.current_company_id()
  );
$function$;

-- 2) Lock down SECURITY DEFINER helpers — only authenticated callers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_driver_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_driver_id() TO authenticated;

-- 3) Fix invite enumeration: drop the broad anon SELECT policy and expose
--    a token-scoped lookup function for the public accept-invite page.
DROP POLICY IF EXISTS "anyone can look up invite by token" ON public.invites;

CREATE OR REPLACE FUNCTION public.get_invite_preview(_token text)
RETURNS TABLE (email text, role app_role, company_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT i.email, i.role, c.name AS company_name
  FROM public.invites i
  JOIN public.companies c ON c.id = i.company_id
  WHERE i.token = _token
    AND i.accepted_at IS NULL
  LIMIT 1;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_invite_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_preview(text) TO anon, authenticated;


-- Companies should only be created by the signup trigger (SECURITY DEFINER), not by clients.
DROP POLICY IF EXISTS "authenticated can insert company" ON public.companies;

-- Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.seed_company(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

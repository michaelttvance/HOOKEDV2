-- Revoke public/anon EXECUTE on SECURITY DEFINER functions that are not meant to be called by unauthenticated users.
REVOKE EXECUTE ON FUNCTION public.current_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_driver_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_job(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.seed_company(uuid) FROM PUBLIC, anon;

-- Ensure authenticated retains needed access
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_driver_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_job(uuid) TO authenticated;

-- get_public_company, get_invite_preview, create_public_job remain callable by anon (intentionally public).
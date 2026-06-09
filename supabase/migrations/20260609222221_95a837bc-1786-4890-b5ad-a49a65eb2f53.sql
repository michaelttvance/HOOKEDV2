
-- 1) Tighten drivers update self with company scoping
DROP POLICY IF EXISTS "drivers update self" ON public.drivers;
CREATE POLICY "drivers update self"
ON public.drivers
FOR UPDATE
USING (user_id = auth.uid() AND company_id = public.current_company_id())
WITH CHECK (user_id = auth.uid() AND company_id = public.current_company_id());

-- 2) Revoke public/anon EXECUTE on tenant-scoped SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.next_rotation_pd() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.advance_rotation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_rotation_pd() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.advance_rotation(uuid) TO authenticated, service_role;

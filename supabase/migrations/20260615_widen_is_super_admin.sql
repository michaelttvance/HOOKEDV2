-- Widen is_super_admin() to match all three Hooked staff accounts.
-- Previously only matched 'mike@hookaidashboard.com', causing /founder
-- metrics to fail for the other two staff emails.
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND lower(email) IN (
        'mike@hookaidashboard.com',
        'michaelttvance@gmail.com',
        'michaelthomasvance@gmail.com'
      )
  );
$$;

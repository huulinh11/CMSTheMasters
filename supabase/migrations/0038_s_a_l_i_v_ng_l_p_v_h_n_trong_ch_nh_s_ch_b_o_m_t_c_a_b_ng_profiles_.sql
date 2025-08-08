-- Create a function to get the current user's role without causing recursion
-- This function runs with the permissions of the definer, bypassing RLS.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Drop the old, recursive policies
DROP POLICY IF EXISTS "Allow admins and managers to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins and managers to manage all profiles" ON public.profiles;

-- Recreate the policies using the new helper function to avoid recursion
CREATE POLICY "Allow admins and managers to view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (get_my_role() IN ('Admin', 'Quản lý'));

CREATE POLICY "Allow admins and managers to manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (get_my_role() IN ('Admin', 'Quản lý'))
WITH CHECK (get_my_role() IN ('Admin', 'Quản lý'));
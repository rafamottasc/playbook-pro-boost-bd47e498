-- Fix the "Block unapproved users" policy that still exposes PII
-- The current policy allows ANY user to see profiles where approved=true
-- We need to remove this overly permissive condition

DROP POLICY IF EXISTS "Block unapproved users" ON public.profiles;

-- Recreate the policy with proper restrictions
-- This policy should only allow users to access their own profile or admins to access all
CREATE POLICY "Block unapproved users from accessing system"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- Users can only see their own profile
  auth.uid() = id
  OR
  -- Admins can see all profiles
  has_role(auth.uid(), 'admin')
);

COMMENT ON POLICY "Block unapproved users from accessing system" ON public.profiles IS 'Restricts profile access to own profile and admins only. Unapproved users can still see their own profile to know their status.';
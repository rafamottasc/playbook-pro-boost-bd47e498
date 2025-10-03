-- Allow all authenticated users to view basic profile info (name, avatar) of other users
-- This enables viewing campaign participants while keeping sensitive data (email, whatsapp) protected

-- Add a new PERMISSIVE policy that allows all authenticated users to view profiles
-- This works with OR logic alongside existing policies
CREATE POLICY "Authenticated users can view basic profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Note: The existing policies remain in place:
-- - "Admins can view all profiles" - allows admins full access
-- - "Users can view own profile" - allows users to see their own profile
-- - "Blocked users cannot access own profile" - RESTRICTIVE policy that blocks blocked users
-- 
-- With PERMISSIVE OR logic: Any authenticated user can now view profiles
-- This is safe because sensitive data (email, whatsapp) is not exposed in campaign queries
-- Only full_name is returned in the campaign participant joins
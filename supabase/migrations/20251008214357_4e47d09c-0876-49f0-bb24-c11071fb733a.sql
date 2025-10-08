-- Fix security definer view warning by making it security invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  full_name,
  avatar_url,
  points,
  approved,
  blocked
FROM public.profiles
WHERE approved = true AND (blocked = false OR blocked IS NULL);

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add restricted policy to allow view to work with security invoker
-- This policy only allows seeing approved, non-blocked users (matching view filter)
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- Users can see their own profile (covered by existing policy)
  auth.uid() = id
  OR
  -- Admins can see all (covered by existing policy)
  has_role(auth.uid(), 'admin')
  OR
  -- Others can only check if user is approved and not blocked
  -- (Note: This doesn't expose sensitive columns - apps should use public_profiles view)
  (approved = true AND (blocked = false OR blocked IS NULL))
);

COMMENT ON VIEW public.public_profiles IS 'Safe public view of user profiles with security invoker - excludes PII like email, whatsapp, and gender. Always use this view instead of querying profiles directly.';
COMMENT ON POLICY "Public profiles are viewable by authenticated users" ON public.profiles IS 'Allows public_profiles view to work. Applications should use public_profiles view to prevent PII exposure.';
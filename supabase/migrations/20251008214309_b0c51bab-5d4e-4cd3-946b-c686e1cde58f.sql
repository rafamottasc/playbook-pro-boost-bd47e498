-- SECURITY FIX: Remove overly permissive policy that exposes PII
DROP POLICY IF EXISTS "Users can view basic profile info of others" ON public.profiles;

-- Create a secure public profiles view with only safe fields
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Add comment for documentation
COMMENT ON VIEW public.public_profiles IS 'Safe public view of user profiles - excludes PII like email, whatsapp, and gender';
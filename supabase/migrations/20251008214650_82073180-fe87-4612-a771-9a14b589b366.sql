-- Remove the permissive policy that still exposes PII
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

-- Drop the view since we'll use a function instead
DROP VIEW IF EXISTS public.public_profiles;

-- Create a security definer function that returns only safe profile data
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  points integer
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    full_name,
    avatar_url,
    points
  FROM profiles
  WHERE approved = true AND (blocked = false OR blocked IS NULL)
  ORDER BY full_name;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated;

COMMENT ON FUNCTION public.get_public_profiles() IS 'Securely returns public profile information without exposing PII like email, whatsapp, or gender. Use this instead of querying profiles table directly.';
-- Fix "Blocked users cannot access own profile" policy
-- Current policy has "ELSE true" which allows viewing ANY profile that isn't yours
-- This is a critical security flaw

DROP POLICY IF EXISTS "Blocked users cannot access own profile" ON public.profiles;

-- Recreate with proper logic - only affects own profile access
CREATE POLICY "Blocked users cannot access own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- This policy only restricts blocked users from seeing their own profile
  -- It should NOT grant access to other profiles
  CASE
    WHEN auth.uid() = id THEN ((blocked = false) OR (blocked IS NULL))
    ELSE false  -- Don't grant access to other profiles (other policies handle that)
  END
);

COMMENT ON POLICY "Blocked users cannot access own profile" ON public.profiles IS 'Prevents blocked users from accessing their own profile. Does not grant access to other profiles.';
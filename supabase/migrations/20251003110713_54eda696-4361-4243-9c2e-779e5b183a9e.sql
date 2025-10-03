-- Fix security issue: Convert profile SELECT policies to PERMISSIVE for proper access control
-- This allows: (Admins to view all profiles) OR (Users to view own profile) AND (Blocked users cannot access)

-- Drop existing RESTRICTIVE SELECT policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Blocked users cannot access" ON public.profiles;
DROP POLICY IF EXISTS "Blocked users cannot access own profile" ON public.profiles;

-- Create PERMISSIVE policies (default type) that work with OR logic
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create RESTRICTIVE policy to block access for blocked users
CREATE POLICY "Blocked users cannot access own profile"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  -- If viewing own profile, must not be blocked
  -- If viewing other profiles (as admin), this check doesn't apply
  CASE 
    WHEN auth.uid() = id THEN (blocked = false OR blocked IS NULL)
    ELSE true
  END
);
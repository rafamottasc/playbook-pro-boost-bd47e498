-- Fix security issue: Require authentication to view resources
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view resources" ON public.resources;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view resources"
ON public.resources
FOR SELECT
USING (auth.uid() IS NOT NULL);
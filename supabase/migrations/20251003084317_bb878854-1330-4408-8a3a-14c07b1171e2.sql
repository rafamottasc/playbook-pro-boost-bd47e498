-- Add gender field to profiles for personalized welcome messages
ALTER TABLE public.profiles 
ADD COLUMN gender text CHECK (gender IN ('masculino', 'feminino'));

-- Add blocked field to profiles to allow blocking users without deleting
ALTER TABLE public.profiles 
ADD COLUMN blocked boolean DEFAULT false;

-- Update suggestions table to better track applied suggestions
-- The status field already exists with values: pending, approved, rejected
-- We'll use 'applied' as a new status value
ALTER TABLE public.suggestions 
DROP CONSTRAINT IF EXISTS suggestions_status_check;

ALTER TABLE public.suggestions 
ADD CONSTRAINT suggestions_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'applied'));

-- Create RLS policy to prevent blocked users from accessing the system
CREATE POLICY "Blocked users cannot access"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id AND (blocked = false OR blocked IS NULL));

-- Allow admins to delete users (this will cascade to related records)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete suggestions
CREATE POLICY "Admins can delete suggestions"
ON public.suggestions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
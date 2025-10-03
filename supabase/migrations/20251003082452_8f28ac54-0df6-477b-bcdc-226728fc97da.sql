-- Drop the existing combined policy for profiles
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;

-- Create separate policy for users to view only their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Create separate policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
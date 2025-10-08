-- Allow authenticated users to view basic profile information (name and avatar) of other users
-- This is needed for social features like questions, comments, and rankings
CREATE POLICY "Users can view basic profile info of others"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
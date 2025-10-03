-- Drop the existing public access policy for messages
DROP POLICY IF EXISTS "Everyone can view messages" ON public.messages;

-- Create new policy requiring authentication to view messages
CREATE POLICY "Authenticated users can view messages" 
ON public.messages 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);
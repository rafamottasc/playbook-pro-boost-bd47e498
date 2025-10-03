-- Add DELETE policy to user_message_feedback table
-- Only admins can delete feedback to maintain data integrity
CREATE POLICY "Only admins can delete feedback" 
ON public.user_message_feedback 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
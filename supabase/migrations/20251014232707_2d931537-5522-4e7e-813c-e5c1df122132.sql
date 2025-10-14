-- Permitir que admins excluam feedbacks anônimos
CREATE POLICY "admin_delete_feedbacks"
ON public.anonymous_feedbacks
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
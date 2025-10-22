-- Permitir que criadores excluam suas próprias reuniões
CREATE POLICY "Creator can delete own meetings"
ON public.meetings
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);
-- Permitir que usuários autenticados vejam seus próprios votos
CREATE POLICY "Users can view own responses"
ON poll_responses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
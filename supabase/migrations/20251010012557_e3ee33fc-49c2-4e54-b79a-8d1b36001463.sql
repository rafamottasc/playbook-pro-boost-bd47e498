-- Adicionar política RLS para permitir visualização de participantes de campanhas
-- Isso permite que corretores vejam os nomes de outros corretores nas mesmas campanhas

CREATE POLICY "Users can view campaign participants profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT user_id 
    FROM public.campaign_participants
  )
  AND approved = true 
  AND (blocked = false OR blocked IS NULL)
);
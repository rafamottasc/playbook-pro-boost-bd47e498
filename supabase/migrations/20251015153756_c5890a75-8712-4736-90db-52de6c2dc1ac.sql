-- Adicionar coluna para rastrear se o onboarding inicial foi concluído
ALTER TABLE profiles 
ADD COLUMN profile_onboarding_completed BOOLEAN DEFAULT FALSE;

-- Marcar usuários existentes como "já fizeram onboarding"
-- (para não redirecionar usuários antigos)
UPDATE profiles 
SET profile_onboarding_completed = TRUE 
WHERE created_at < NOW();
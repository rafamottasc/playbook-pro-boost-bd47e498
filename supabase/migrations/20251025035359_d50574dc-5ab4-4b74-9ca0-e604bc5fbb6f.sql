-- Remove constraint obsoleta que impede novos nomes de equipes
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_team_check;

-- Remove coluna emoji da tabela teams
ALTER TABLE public.teams 
DROP COLUMN IF EXISTS emoji;
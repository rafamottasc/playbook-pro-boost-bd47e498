-- Add team column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN team TEXT;

-- Add constraint to only allow valid team values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_team_check 
CHECK (team IS NULL OR team IN ('Equipe Leão', 'Equipe Lobo', 'Equipe Águia'));
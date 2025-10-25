-- ============================================
-- FASE 1: Sistema de Equipes Dinâmico
-- Criação da tabela teams e políticas RLS
-- ============================================

-- 1.1. Criar tabela teams
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  emoji text DEFAULT '👥',
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índice para busca rápida de equipes ativas
CREATE INDEX idx_teams_active ON public.teams(active) WHERE active = true;

-- Comentário da tabela
COMMENT ON TABLE public.teams IS 'Equipes personalizáveis da empresa';
COMMENT ON COLUMN public.teams.name IS 'Nome da equipe - deve corresponder aos valores em profiles.team';

-- 1.2. Habilitar RLS na tabela teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem visualizar equipes ativas
CREATE POLICY "Todos podem visualizar equipes ativas"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Política: Apenas admins podem gerenciar equipes
CREATE POLICY "Apenas admins podem gerenciar equipes"
  ON public.teams
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 1.3. MIGRAÇÃO RETROCOMPATÍVEL CRÍTICA
-- Inserir as 3 equipes atuais da Comarc (EXATAMENTE como estão no sistema)
INSERT INTO public.teams (name, emoji, display_order)
VALUES 
  ('Equipe Leão', '🦁', 1),
  ('Equipe Lobo', '🐺', 2),
  ('Equipe Águia', '🦅', 3)
ON CONFLICT (name) DO NOTHING;

-- 1.4. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_teams_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teams_updated_at();
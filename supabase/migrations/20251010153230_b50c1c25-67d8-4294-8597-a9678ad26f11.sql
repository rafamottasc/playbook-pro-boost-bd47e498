-- Tabela para registrar o humor diário dos usuários
CREATE TABLE public.daily_mood (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('otimo', 'bem', 'neutro', 'cansado', 'dificil')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  team TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Garante um único registro por usuário por dia
  UNIQUE(user_id, date)
);

-- Índices para performance
CREATE INDEX idx_daily_mood_user_id ON public.daily_mood(user_id);
CREATE INDEX idx_daily_mood_date ON public.daily_mood(date);
CREATE INDEX idx_daily_mood_team ON public.daily_mood(team);

-- RLS Policies
ALTER TABLE public.daily_mood ENABLE ROW LEVEL SECURITY;

-- Usuários podem inserir/atualizar seu próprio humor
CREATE POLICY "users_own_mood" ON public.daily_mood
  FOR ALL USING (auth.uid() = user_id);

-- Admins podem visualizar todos os humores
CREATE POLICY "admins_view_all_moods" ON public.daily_mood
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela para feedbacks anônimos (sugestões e reclamações)
CREATE TABLE public.anonymous_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'complaint')),
  category TEXT NOT NULL CHECK (category IN (
    'system', 'service', 'campaigns', 'leadership', 
    'resources', 'academy', 'coworkers', 'infrastructure', 'other'
  )),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'analyzing', 'resolved', 'archived')),
  team TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_anonymous_feedbacks_type ON public.anonymous_feedbacks(type);
CREATE INDEX idx_anonymous_feedbacks_category ON public.anonymous_feedbacks(category);
CREATE INDEX idx_anonymous_feedbacks_status ON public.anonymous_feedbacks(status);
CREATE INDEX idx_anonymous_feedbacks_created_at ON public.anonymous_feedbacks(created_at DESC);

-- RLS Policies
ALTER TABLE public.anonymous_feedbacks ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir feedbacks (sem user_id para garantir anonimato)
CREATE POLICY "anyone_insert_feedback" ON public.anonymous_feedbacks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas admins podem visualizar feedbacks
CREATE POLICY "admin_view_feedbacks" ON public.anonymous_feedbacks
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar feedbacks
CREATE POLICY "admin_update_feedbacks" ON public.anonymous_feedbacks
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_anonymous_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anonymous_feedbacks_timestamp
  BEFORE UPDATE ON public.anonymous_feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_anonymous_feedbacks_updated_at();
-- Fase 1: Sistema de Logging Profissional
-- Criar tabela de logs da aplicação
CREATE TABLE IF NOT EXISTS public.application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT,
  metadata JSONB,
  url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance de consulta de logs
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.application_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON public.application_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_action ON public.application_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_level_timestamp ON public.application_logs(level, timestamp DESC);

-- RLS para logs (apenas admins podem ver todos os logs)
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
ON public.application_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert logs"
ON public.application_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Função para limpeza automática de logs antigos (90 dias)
CREATE OR REPLACE FUNCTION public.delete_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.application_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;

-- Fase 2: Índices de Performance para Tabelas Existentes
-- Tabela messages (usada no Kanban - alta frequência)
CREATE INDEX IF NOT EXISTS idx_messages_funnel_stage ON public.messages(funnel, stage);
CREATE INDEX IF NOT EXISTS idx_messages_display_order ON public.messages(display_order);
CREATE INDEX IF NOT EXISTS idx_messages_funnel ON public.messages(funnel);

-- Tabela notifications (alta frequência de leitura)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Tabela user_message_feedback (recém implementada)
CREATE INDEX IF NOT EXISTS idx_feedback_message_user ON public.user_message_feedback(message_id, user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.user_message_feedback(user_id);

-- Tabela campaigns (filtros complexos)
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_updated ON public.campaigns(status, updated_at DESC);

-- Tabela campaign_participants
CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign ON public.campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_user ON public.campaign_participants(user_id);

-- Tabela academy_lessons (ordenação e filtros)
CREATE INDEX IF NOT EXISTS idx_lessons_module_order ON public.academy_lessons(module_id, display_order);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON public.academy_lessons(published);

-- Tabela academy_modules (ordenação)
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON public.academy_modules(display_order);
CREATE INDEX IF NOT EXISTS idx_modules_published ON public.academy_modules(published);

-- Tabela user_lesson_progress (consultas frequentes)
CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON public.user_lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_watched ON public.user_lesson_progress(user_id, watched);

-- Tabela lesson_questions (ordenação por likes e data)
CREATE INDEX IF NOT EXISTS idx_questions_lesson_created ON public.lesson_questions(lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_lesson_likes ON public.lesson_questions(lesson_id, likes DESC);

-- Tabela profiles (buscas e ordenações)
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON public.profiles(approved);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Tabela resources (ordenação e categoria)
CREATE INDEX IF NOT EXISTS idx_resources_category_order ON public.resources(category, display_order);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);

-- Tabela suggestions (status e ordenação)
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_message ON public.suggestions(message_id);

-- Tabela partners (filtros e ordenação)
CREATE INDEX IF NOT EXISTS idx_partners_category_active ON public.partners(category_id, active);
CREATE INDEX IF NOT EXISTS idx_partners_active ON public.partners(active);

-- Tabela partners_categories
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON public.partners_categories(active, display_order);
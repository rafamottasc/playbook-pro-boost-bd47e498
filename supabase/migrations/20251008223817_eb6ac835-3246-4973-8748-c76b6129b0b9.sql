-- Fase 1: Ajustar tabela de logs existente (se necessário)
-- Garantir que a tabela tenha todas as colunas necessárias
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'application_logs' 
                 AND column_name = 'url') THEN
    ALTER TABLE public.application_logs ADD COLUMN url TEXT;
  END IF;
END $$;

-- Recriar políticas RLS
DROP POLICY IF EXISTS "Admins can view all logs" ON public.application_logs;
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.application_logs;

CREATE POLICY "Admins can view all logs"
ON public.application_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert logs"
ON public.application_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fase 2: Criar índices de performance (IF NOT EXISTS para segurança)
-- Tabela messages
CREATE INDEX IF NOT EXISTS idx_messages_funnel_stage ON public.messages(funnel, stage);
CREATE INDEX IF NOT EXISTS idx_messages_display_order ON public.messages(display_order);
CREATE INDEX IF NOT EXISTS idx_messages_funnel ON public.messages(funnel);

-- Tabela notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Tabela user_message_feedback
CREATE INDEX IF NOT EXISTS idx_feedback_message_user ON public.user_message_feedback(message_id, user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.user_message_feedback(user_id);

-- Tabela campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_updated ON public.campaigns(status, updated_at DESC);

-- Tabela campaign_participants
CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign ON public.campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_user ON public.campaign_participants(user_id);

-- Tabela academy_lessons
CREATE INDEX IF NOT EXISTS idx_lessons_module_order ON public.academy_lessons(module_id, display_order);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON public.academy_lessons(published);

-- Tabela academy_modules
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON public.academy_modules(display_order);
CREATE INDEX IF NOT EXISTS idx_modules_published ON public.academy_modules(published);

-- Tabela user_lesson_progress
CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON public.user_lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_watched ON public.user_lesson_progress(user_id, watched);

-- Tabela lesson_questions
CREATE INDEX IF NOT EXISTS idx_questions_lesson_created ON public.lesson_questions(lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_lesson_likes ON public.lesson_questions(lesson_id, likes DESC);

-- Tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON public.profiles(approved);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Tabela resources
CREATE INDEX IF NOT EXISTS idx_resources_category_order ON public.resources(category, display_order);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);

-- Tabela suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_message ON public.suggestions(message_id);

-- Tabela partners
CREATE INDEX IF NOT EXISTS idx_partners_category_active ON public.partners(category_id, active);
CREATE INDEX IF NOT EXISTS idx_partners_active ON public.partners(active);

-- Tabela partners_categories
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON public.partners_categories(active, display_order);
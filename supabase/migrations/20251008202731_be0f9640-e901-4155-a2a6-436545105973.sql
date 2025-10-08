-- ============================================
-- MIGRATION COMPLETA - SISTEMA PRONTO PARA PRODUÇÃO
-- ============================================

-- 1. ADICIONAR SISTEMA DE APROVAÇÃO DE USUÁRIOS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Aprovar todos os usuários existentes
UPDATE public.profiles SET approved = true WHERE approved IS NULL OR approved = false;

-- Criar política RLS para bloquear usuários não aprovados
DROP POLICY IF EXISTS "Block unapproved users" ON public.profiles;
CREATE POLICY "Block unapproved users"
ON public.profiles FOR SELECT
USING (
  approved = true OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  auth.uid() = id -- pode ver próprio perfil para saber status
);

-- 2. REESTRUTURAR RECURSOS EDUCATIVOS
-- Criar enum para categorias
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_category') THEN
    CREATE TYPE resource_category AS ENUM ('administrativo', 'digital');
  END IF;
END $$;

-- Adicionar categoria aos recursos
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS category resource_category DEFAULT 'administrativo'::resource_category;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 3. ADICIONAR COLUNA DE PROGRESSO DO VÍDEO
ALTER TABLE public.user_lesson_progress ADD COLUMN IF NOT EXISTS video_progress INTEGER DEFAULT 0;

-- 4. ADICIONAR ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson ON public.user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_questions_lesson ON public.lesson_questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_questions_user ON public.lesson_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON public.profiles(approved);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON public.profiles(blocked);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_module ON public.academy_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_published ON public.academy_lessons(published);

-- 5. ZERAR TODAS AS MÉTRICAS (dados fictícios)
TRUNCATE TABLE public.lesson_feedback CASCADE;
TRUNCATE TABLE public.lesson_questions CASCADE;
TRUNCATE TABLE public.question_likes CASCADE;
TRUNCATE TABLE public.user_lesson_progress CASCADE;
TRUNCATE TABLE public.user_message_feedback CASCADE;
TRUNCATE TABLE public.suggestions CASCADE;
TRUNCATE TABLE public.notifications CASCADE;

-- Resetar pontos de todos os usuários (exceto primeiro admin)
UPDATE public.profiles SET points = 0 WHERE id != (
  SELECT p.id FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'admin'
  ORDER BY p.created_at ASC
  LIMIT 1
);

-- 6. ATUALIZAR TRIGGER PARA NOVOS USUÁRIOS (approved = false)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Create profile with email
  INSERT INTO public.profiles (id, full_name, whatsapp, email, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    NEW.email,
    false -- Novos usuários precisam de aprovação
  );
  
  -- Count existing users (excluding current one)
  SELECT COUNT(*) INTO user_count 
  FROM auth.users 
  WHERE id != NEW.id;
  
  -- Assign corretor role to all users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'corretor');
  
  -- If first user, also assign admin role and approve
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    -- Aprovar primeiro usuário automaticamente
    UPDATE public.profiles SET approved = true WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;
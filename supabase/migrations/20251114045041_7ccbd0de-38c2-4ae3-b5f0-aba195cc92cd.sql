-- ============================================================
-- FASE 1: Criar tabela task_statuses e migrar dados existentes
-- ============================================================

-- 1. Criar tabela task_statuses (sem ícones, máximo 6 por usuário)
CREATE TABLE IF NOT EXISTS public.task_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug),
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

-- 2. Adicionar coluna status_id em daily_tasks (nullable por enquanto)
ALTER TABLE public.daily_tasks 
ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES public.task_statuses(id) ON DELETE RESTRICT;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_task_statuses_user_id ON public.task_statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_task_statuses_display_order ON public.task_statuses(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status_id ON public.daily_tasks(status_id);

-- 4. Criar 3 status padrão para cada usuário existente com tarefas
INSERT INTO public.task_statuses (user_id, name, slug, color, display_order)
SELECT DISTINCT 
  user_id,
  'Para Fazer' as name,
  'todo' as slug,
  '#3b82f6' as color,
  1 as display_order
FROM public.daily_tasks
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_statuses ts 
  WHERE ts.user_id = daily_tasks.user_id AND ts.slug = 'todo'
);

INSERT INTO public.task_statuses (user_id, name, slug, color, display_order)
SELECT DISTINCT 
  user_id,
  'Em Andamento' as name,
  'in_progress' as slug,
  '#f59e0b' as color,
  2 as display_order
FROM public.daily_tasks
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_statuses ts 
  WHERE ts.user_id = daily_tasks.user_id AND ts.slug = 'in_progress'
);

INSERT INTO public.task_statuses (user_id, name, slug, color, display_order)
SELECT DISTINCT 
  user_id,
  'Concluído' as name,
  'done' as slug,
  '#10b981' as color,
  3 as display_order
FROM public.daily_tasks
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_statuses ts 
  WHERE ts.user_id = daily_tasks.user_id AND ts.slug = 'done'
);

-- 5. Mapear status atual (text) para status_id (UUID)
UPDATE public.daily_tasks dt
SET status_id = (
  SELECT ts.id 
  FROM public.task_statuses ts 
  WHERE ts.user_id = dt.user_id 
  AND ts.slug = dt.status
)
WHERE status_id IS NULL;

-- 6. RLS Policies para task_statuses
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios status
CREATE POLICY "Users can view own statuses"
ON public.task_statuses FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar novos status (com limite de 6 validado na aplicação)
CREATE POLICY "Users can insert own statuses"
ON public.task_statuses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios status
CREATE POLICY "Users can update own statuses"
ON public.task_statuses FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar status SEM tarefas associadas
CREATE POLICY "Users can delete own statuses without tasks"
ON public.task_statuses FOR DELETE
USING (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.daily_tasks 
    WHERE status_id = task_statuses.id
  )
);

-- 7. Trigger para criar status padrão em novos usuários
CREATE OR REPLACE FUNCTION public.create_default_task_statuses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar 3 status padrão para o novo usuário
  INSERT INTO public.task_statuses (user_id, name, slug, color, display_order)
  VALUES
    (NEW.id, 'Para Fazer', 'todo', '#3b82f6', 1),
    (NEW.id, 'Em Andamento', 'in_progress', '#f59e0b', 2),
    (NEW.id, 'Concluído', 'done', '#10b981', 3);
  
  RETURN NEW;
END;
$$;

-- Trigger executa após criar perfil de novo usuário
DROP TRIGGER IF EXISTS on_user_created_task_statuses ON public.profiles;
CREATE TRIGGER on_user_created_task_statuses
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_task_statuses();

-- 8. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_task_statuses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_task_statuses_timestamp ON public.task_statuses;
CREATE TRIGGER update_task_statuses_timestamp
BEFORE UPDATE ON public.task_statuses
FOR EACH ROW
EXECUTE FUNCTION public.update_task_statuses_updated_at();
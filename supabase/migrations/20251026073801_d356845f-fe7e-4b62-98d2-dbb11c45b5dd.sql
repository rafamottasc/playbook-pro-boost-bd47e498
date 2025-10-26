-- Migration de correção: Limpar e recriar estrutura completa

-- Drop indexes existentes se houver
DROP INDEX IF EXISTS public.idx_daily_tasks_user_date;
DROP INDEX IF EXISTS public.idx_daily_tasks_period;
DROP INDEX IF EXISTS public.idx_checklist_task;
DROP INDEX IF EXISTS public.idx_contacts_task;
DROP INDEX IF EXISTS public.idx_attachments_task;

-- Drop triggers se existirem
DROP TRIGGER IF EXISTS update_task_categories_updated_at ON public.task_categories;
DROP TRIGGER IF EXISTS update_daily_tasks_updated_at ON public.daily_tasks;
DROP TRIGGER IF EXISTS task_completed_trigger ON public.daily_tasks;
DROP TRIGGER IF EXISTS create_default_categories_on_signup ON public.profiles;

-- Drop functions se existirem
DROP FUNCTION IF EXISTS public.update_task_completed_at();
DROP FUNCTION IF EXISTS public.create_default_task_categories();

-- Drop policies existentes
DROP POLICY IF EXISTS "Users can view own categories" ON public.task_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.task_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.task_categories;
DROP POLICY IF EXISTS "Users can delete own custom categories" ON public.task_categories;
DROP POLICY IF EXISTS "Users can view own tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Users can view own checklist items" ON public.task_checklist_items;
DROP POLICY IF EXISTS "Users can insert own checklist items" ON public.task_checklist_items;
DROP POLICY IF EXISTS "Users can update own checklist items" ON public.task_checklist_items;
DROP POLICY IF EXISTS "Users can delete own checklist items" ON public.task_checklist_items;
DROP POLICY IF EXISTS "Users can view own task contacts" ON public.task_contacts;
DROP POLICY IF EXISTS "Users can insert own task contacts" ON public.task_contacts;
DROP POLICY IF EXISTS "Users can update own task contacts" ON public.task_contacts;
DROP POLICY IF EXISTS "Users can delete own task contacts" ON public.task_contacts;
DROP POLICY IF EXISTS "Users can view own task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can insert own task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can update own task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can delete own task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can upload own task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own task attachments" ON storage.objects;

-- Drop tabelas se existirem (em ordem reversa devido às foreign keys)
DROP TABLE IF EXISTS public.task_attachments CASCADE;
DROP TABLE IF EXISTS public.task_contacts CASCADE;
DROP TABLE IF EXISTS public.task_checklist_items CASCADE;
DROP TABLE IF EXISTS public.daily_tasks CASCADE;
DROP TABLE IF EXISTS public.task_categories CASCADE;

-- Recriar tudo do zero

-- 1. Tabela de Categorias de Tarefas
CREATE TABLE public.task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(label) >= 2 AND char_length(label) <= 50),
  icon TEXT NOT NULL DEFAULT '📌' CHECK (char_length(icon) <= 10),
  color TEXT NOT NULL DEFAULT 'bg-blue-100',
  is_system BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, label)
);

-- 2. Tabela de Tarefas Diárias
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.task_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  notes TEXT CHECK (char_length(notes) <= 2000),
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time TIME,
  period TEXT NOT NULL CHECK (period IN ('manha', 'tarde', 'noite')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgente', 'importante', 'normal', 'baixa')),
  recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  done BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 3. Tabela de Itens do Checklist
CREATE TABLE public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 200),
  done BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de Contatos das Tarefas
CREATE TABLE public.task_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  phone TEXT CHECK (char_length(phone) <= 20),
  address TEXT CHECK (char_length(address) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela de Anexos das Tarefas
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('file', 'link')),
  file_url TEXT CHECK (char_length(file_url) <= 500),
  file_type TEXT CHECK (file_type IN ('pdf', 'image', 'other')),
  file_size BIGINT CHECK (file_size <= 10485760),
  url TEXT CHECK (char_length(url) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar indexes
CREATE INDEX idx_daily_tasks_user_date ON public.daily_tasks(user_id, task_date);
CREATE INDEX idx_daily_tasks_period ON public.daily_tasks(period);
CREATE INDEX idx_checklist_task ON public.task_checklist_items(task_id);
CREATE INDEX idx_contacts_task ON public.task_contacts(task_id);
CREATE INDEX idx_attachments_task ON public.task_attachments(task_id);

-- Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_categories_updated_at
  BEFORE UPDATE ON public.task_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.done = true AND OLD.done = false THEN
    NEW.completed_at = now();
  ELSIF NEW.done = false AND OLD.done = true THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completed_trigger
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_completed_at();

-- Habilitar RLS
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para task_categories
CREATE POLICY "Users can view own categories" ON public.task_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.task_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.task_categories FOR UPDATE USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can delete own custom categories" ON public.task_categories FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- RLS Policies para daily_tasks
CREATE POLICY "Users can view own tasks" ON public.daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.daily_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.daily_tasks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para task_checklist_items
CREATE POLICY "Users can view own checklist items" ON public.task_checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_checklist_items.task_id AND daily_tasks.user_id = auth.uid()));
CREATE POLICY "Users can insert own checklist items" ON public.task_checklist_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_checklist_items.task_id AND daily_tasks.user_id = auth.uid()));
CREATE POLICY "Users can update own checklist items" ON public.task_checklist_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_checklist_items.task_id AND daily_tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete own checklist items" ON public.task_checklist_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_checklist_items.task_id AND daily_tasks.user_id = auth.uid()));

-- RLS Policies para task_contacts
CREATE POLICY "Users can view own task contacts" ON public.task_contacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_contacts.task_id AND daily_tasks.user_id = auth.uid()));
CREATE POLICY "Users can insert own task contacts" ON public.task_contacts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_contacts.task_id AND daily_tasks.user_id = auth.uid()));
CREATE POLICY "Users can update own task contacts" ON public.task_contacts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_contacts.task_id AND daily_tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete own task contacts" ON public.task_contacts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_contacts.task_id AND daily_tasks.user_id = auth.uid()));

-- RLS Policies para task_attachments
CREATE POLICY "Users can view own task attachments" ON public.task_attachments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_attachments.task_id AND daily_tasks.user_id = auth.uid()));
CREATE POLICY "Users can insert own task attachments" ON public.task_attachments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_attachments.task_id AND daily_tasks.user_id = auth.uid()));
CREATE POLICY "Users can update own task attachments" ON public.task_attachments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_attachments.task_id AND daily_tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete own task attachments" ON public.task_attachments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.daily_tasks WHERE daily_tasks.id = task_attachments.task_id AND daily_tasks.user_id = auth.uid()));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('task-attachments', 'task-attachments', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Users can upload own task attachments" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own task attachments" ON storage.objects FOR SELECT
  USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own task attachments" ON storage.objects FOR DELETE
  USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Função para criar categorias padrão
CREATE OR REPLACE FUNCTION public.create_default_task_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.task_categories (user_id, label, icon, color, is_system, display_order)
  VALUES
    (NEW.id, 'Ligações', '📞', 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400', true, 1),
    (NEW.id, 'Visitas', '🏠', 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400', true, 2),
    (NEW.id, 'Propostas', '📝', 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400', true, 3),
    (NEW.id, 'Follow-up', '🔄', 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400', true, 4),
    (NEW.id, 'Reuniões', '👥', 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400', true, 5),
    (NEW.id, 'Geral', '📌', 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400', true, 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_default_categories_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_task_categories();
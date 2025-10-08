-- 1. Adicionar coluna published nas tabelas de academy
ALTER TABLE public.academy_modules 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

ALTER TABLE public.academy_lessons 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_academy_modules_published 
ON public.academy_modules(published);

CREATE INDEX IF NOT EXISTS idx_academy_lessons_published 
ON public.academy_lessons(published);

-- 3. Criar bucket de storage para capas dos módulos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-covers',
  'academy-covers',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Atualizar RLS policies para academy_modules (usuários só veem publicados)
DROP POLICY IF EXISTS "Authenticated users can view modules" ON public.academy_modules;

CREATE POLICY "Authenticated users can view published modules"
ON public.academy_modules
FOR SELECT
TO authenticated
USING (published = true OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Atualizar RLS policies para academy_lessons (usuários só veem publicadas)
DROP POLICY IF EXISTS "Authenticated users can view lessons" ON public.academy_lessons;

CREATE POLICY "Authenticated users can view published lessons"
ON public.academy_lessons
FOR SELECT
TO authenticated
USING (published = true OR has_role(auth.uid(), 'admin'::app_role));

-- 6. RLS policies para storage bucket academy-covers
CREATE POLICY "Admins can upload covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'academy-covers' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'academy-covers' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'academy-covers' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Public can view covers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'academy-covers');
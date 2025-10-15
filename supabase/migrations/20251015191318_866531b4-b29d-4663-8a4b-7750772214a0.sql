-- ====================================
-- PARTE 1: Criar tabela de categorias de recursos
-- ====================================

-- Criar tabela de categorias de recursos
CREATE TABLE IF NOT EXISTS public.resource_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir categorias existentes
INSERT INTO public.resource_categories (name, description, display_order) VALUES
  ('Materiais Administrativos', 'Documentos e recursos para gestão administrativa', 0),
  ('Material Digital', 'Recursos digitais e conteúdos online', 1);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_resource_categories_updated_at
  BEFORE UPDATE ON public.resource_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Habilitar RLS
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Usuários autenticados podem visualizar categorias ativas
CREATE POLICY "Authenticated users can view active categories"
  ON public.resource_categories
  FOR SELECT
  TO authenticated
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy: Apenas admins podem gerenciar categorias
CREATE POLICY "Only admins can manage categories"
  ON public.resource_categories
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ====================================
-- PARTE 2: Atualizar tabela resources para usar foreign key
-- ====================================

-- Adicionar coluna category_id (UUID)
ALTER TABLE public.resources 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.resource_categories(id) ON DELETE SET NULL;

-- Migrar dados existentes para a nova estrutura
UPDATE public.resources r
SET category_id = rc.id
FROM public.resource_categories rc
WHERE 
  (r.category = 'administrativo' AND rc.name = 'Materiais Administrativos') OR
  (r.category = 'digital' AND rc.name = 'Material Digital');
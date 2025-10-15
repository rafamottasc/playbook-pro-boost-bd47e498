-- Criar tabela de funis personalizáveis
CREATE TABLE public.playbook_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📊',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de etapas personalizáveis
CREATE TABLE public.playbook_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.playbook_funnels(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(funnel_id, name)
);

-- Enable RLS
ALTER TABLE public.playbook_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies para funis
CREATE POLICY "Admins can manage funnels" 
ON public.playbook_funnels 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active funnels" 
ON public.playbook_funnels 
FOR SELECT 
USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para etapas
CREATE POLICY "Admins can manage stages" 
ON public.playbook_stages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active stages" 
ON public.playbook_stages 
FOR SELECT 
USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Popular funis existentes
INSERT INTO public.playbook_funnels (slug, name, emoji, display_order) VALUES
  ('lead-novo', 'Abordagem – Lead Novo', '🔴', 0),
  ('atendimento', 'Atendimento Geral', '🟢', 1),
  ('repescagem', 'Repescagem', '🟠', 2),
  ('nutricao', 'Nutrição', '🔵', 3);

-- Popular etapas do funil "lead-novo"
INSERT INTO public.playbook_stages (funnel_id, name, display_order)
SELECT pf.id, t.stage, t.ord - 1
FROM public.playbook_funnels pf, 
UNNEST(ARRAY['1ª Abordagem', '2ª Abordagem', '3ª Abordagem', '4ª Abordagem', '5ª Abordagem', '6ª Abordagem', '7ª Abordagem']) WITH ORDINALITY AS t(stage, ord)
WHERE pf.slug = 'lead-novo';

-- Popular etapas do funil "atendimento"
INSERT INTO public.playbook_stages (funnel_id, name, display_order)
SELECT pf.id, t.stage, t.ord - 1
FROM public.playbook_funnels pf, 
UNNEST(ARRAY['Sondagem', 'Apresentação do Produto', 'Visita / Call', 'Proposta', 'Fechamento']) WITH ORDINALITY AS t(stage, ord)
WHERE pf.slug = 'atendimento';

-- Popular etapas do funil "repescagem"
INSERT INTO public.playbook_stages (funnel_id, name, display_order)
SELECT pf.id, t.stage, t.ord - 1
FROM public.playbook_funnels pf, 
UNNEST(ARRAY['1ª Abordagem', '2ª Abordagem', '3ª Abordagem', '4ª Abordagem', '5ª Abordagem', '6ª Abordagem', '7ª Abordagem', '8ª Abordagem', '9ª Abordagem']) WITH ORDINALITY AS t(stage, ord)
WHERE pf.slug = 'repescagem';

-- Popular etapas do funil "nutricao"
INSERT INTO public.playbook_stages (funnel_id, name, display_order)
SELECT pf.id, t.stage, t.ord - 1
FROM public.playbook_funnels pf, 
UNNEST(ARRAY['Educação', 'Oportunidades']) WITH ORDINALITY AS t(stage, ord)
WHERE pf.slug = 'nutricao';

-- Adicionar novas colunas à tabela messages
ALTER TABLE public.messages 
  ADD COLUMN funnel_slug TEXT,
  ADD COLUMN stage_name TEXT;

-- Migrar dados existentes
UPDATE public.messages SET funnel_slug = funnel, stage_name = stage;

-- Remover colunas antigas
ALTER TABLE public.messages DROP COLUMN funnel;
ALTER TABLE public.messages DROP COLUMN stage;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_funnel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_playbook_funnels_updated_at
BEFORE UPDATE ON public.playbook_funnels
FOR EACH ROW
EXECUTE FUNCTION public.update_funnel_updated_at();

CREATE TRIGGER update_playbook_stages_updated_at
BEFORE UPDATE ON public.playbook_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_funnel_updated_at();
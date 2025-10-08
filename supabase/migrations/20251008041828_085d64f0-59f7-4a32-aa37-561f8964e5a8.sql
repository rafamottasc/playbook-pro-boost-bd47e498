-- Criar tabela de categorias de construtoras
CREATE TABLE partners_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de construtoras parceiras
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES partners_categories(id) ON DELETE RESTRICT NOT NULL,
  name TEXT NOT NULL,
  manager_name TEXT,
  manager_phone TEXT,
  manager_email TEXT,
  drive_link TEXT,
  observations TEXT,
  active BOOLEAN DEFAULT true,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de arquivos/materiais
CREATE TABLE partner_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de links externos
CREATE TABLE partner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  link_type TEXT DEFAULT 'external',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_partners_category ON partners(category_id);
CREATE INDEX idx_partner_files_partner ON partner_files(partner_id);
CREATE INDEX idx_partner_links_partner ON partner_links(partner_id);

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_partners_categories_updated_at
  BEFORE UPDATE ON partners_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Habilitar RLS
ALTER TABLE partners_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_links ENABLE ROW LEVEL SECURITY;

-- Policies para categorias
CREATE POLICY "Todos podem visualizar categorias ativas"
  ON partners_categories FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem gerenciar categorias"
  ON partners_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para construtoras
CREATE POLICY "Todos podem visualizar construtoras ativas"
  ON partners FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem gerenciar construtoras"
  ON partners FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para arquivos
CREATE POLICY "Todos podem visualizar arquivos"
  ON partner_files FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem gerenciar arquivos"
  ON partner_files FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para links
CREATE POLICY "Todos podem visualizar links"
  ON partner_links FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem gerenciar links"
  ON partner_links FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar bucket de storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-files', 'partner-files', true);

-- Policies de storage para upload (apenas admins)
CREATE POLICY "Admins podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'partner-files' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Policy para visualização (todos autenticados)
CREATE POLICY "Todos podem visualizar arquivos parceiros"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-files' AND auth.uid() IS NOT NULL);

-- Policy para deleção (apenas admins)
CREATE POLICY "Admins podem deletar arquivos parceiros"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'partner-files'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Habilitar Realtime nas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE partners_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE partners;
ALTER PUBLICATION supabase_realtime ADD TABLE partner_files;
ALTER PUBLICATION supabase_realtime ADD TABLE partner_links;
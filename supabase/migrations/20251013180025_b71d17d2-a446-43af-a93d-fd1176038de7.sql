-- Adicionar novos campos à tabela partners
ALTER TABLE partners 
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS frente_mar BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS prioritaria BOOLEAN DEFAULT false;

-- Criar índices para performance nos filtros
CREATE INDEX IF NOT EXISTS idx_partners_cidade ON partners(cidade);
CREATE INDEX IF NOT EXISTS idx_partners_frente_mar ON partners(frente_mar);
CREATE INDEX IF NOT EXISTS idx_partners_prioritaria ON partners(prioritaria);

-- Tornar category_id nullable para permitir construtoras sem categoria
ALTER TABLE partners ALTER COLUMN category_id DROP NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN partners.cidade IS 'Cidade onde a construtora atua';
COMMENT ON COLUMN partners.frente_mar IS 'Indica se possui empreendimentos frente mar';
COMMENT ON COLUMN partners.prioritaria IS 'Construtoras destacadas (WSelent, Caleone, ARS Kammer, Viva Park)';

-- Marcar construtoras prioritárias automaticamente
UPDATE partners 
SET prioritaria = true 
WHERE LOWER(name) IN ('wselent', 'caleone', 'ars kammer', 'viva park');
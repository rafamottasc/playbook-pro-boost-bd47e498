-- Tabela para armazenar valores do CUB/SC
CREATE TABLE public.cub_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value DECIMAL(10,5) NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  UNIQUE(month, year)
);

-- Índice para buscar CUB do mês atual rapidamente
CREATE INDEX idx_cub_month_year ON public.cub_values(year DESC, month DESC);

-- RLS policies
ALTER TABLE public.cub_values ENABLE ROW LEVEL SECURITY;

-- Todos podem ler o CUB atual
CREATE POLICY "Authenticated users can view CUB values"
ON public.cub_values FOR SELECT
TO authenticated
USING (true);

-- Apenas admins podem gerenciar
CREATE POLICY "Only admins can manage CUB values"
ON public.cub_values FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.cub_values IS 'Armazena valores mensais do CUB/SC para cálculos da calculadora';
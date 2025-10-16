-- Criar tabela para salvar fluxos de pagamento
CREATE TABLE payment_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  calculation_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_payment_flows_user_id ON payment_flows(user_id);
CREATE INDEX idx_payment_flows_created_at ON payment_flows(created_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_payment_flows_updated_at
  BEFORE UPDATE ON payment_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Habilitar RLS
ALTER TABLE payment_flows ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own proposals"
  ON payment_flows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proposals"
  ON payment_flows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own proposals"
  ON payment_flows FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own proposals"
  ON payment_flows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all proposals"
  ON payment_flows FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
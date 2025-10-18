-- Criar tabela para logs de limpeza de storage
CREATE TABLE IF NOT EXISTS public.storage_cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  files_deleted INTEGER NOT NULL DEFAULT 0,
  space_freed_bytes BIGINT NOT NULL DEFAULT 0,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para storage_cleanup_logs
ALTER TABLE public.storage_cleanup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cleanup logs"
  ON public.storage_cleanup_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert cleanup logs"
  ON public.storage_cleanup_logs
  FOR INSERT
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.storage_cleanup_logs IS 'Registra execuções de limpeza automática e manual de arquivos órfãos no storage';
COMMENT ON COLUMN public.storage_cleanup_logs.files_deleted IS 'Quantidade de arquivos órfãos deletados';
COMMENT ON COLUMN public.storage_cleanup_logs.space_freed_bytes IS 'Espaço liberado em bytes';
COMMENT ON COLUMN public.storage_cleanup_logs.details IS 'Detalhes dos arquivos deletados (bucket, path, size)';

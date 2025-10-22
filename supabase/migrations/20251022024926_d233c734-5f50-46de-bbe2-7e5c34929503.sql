-- =====================================================
-- LIMPEZA AUTOMÁTICA DE STORAGE
-- =====================================================

-- 1. Habilitar extensões necessárias para CRON
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Agendar limpeza semanal de storage
-- Executa toda segunda-feira às 3h da manhã (horário do servidor)
SELECT cron.schedule(
  'cleanup-storage-weekly',
  '0 3 * * 1', -- Cron format: minuto hora dia_mes mês dia_semana
  $$
  SELECT net.http_post(
    url:='https://ldnfkceonksxmybfvhco.supabase.co/functions/v1/cleanup-storage',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkbmZrY2VvbmtzeG15YmZ2aGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTU4NTYsImV4cCI6MjA3NDk5MTg1Nn0.FDIkm9M1QQLj7YEGd1RAnJgc5YnHpRBwP0rK9k1sCKY"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- 3. Verificar tarefas agendadas (para debug)
COMMENT ON EXTENSION pg_cron IS 'Limpeza automática de storage configurada para rodar toda segunda às 3h';
-- Habilitar extensão pg_cron para jobs agendados
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar limpeza mensal de logs antigos (>90 dias)
-- Executa todo dia 1 do mês às 3h da manhã
SELECT cron.schedule(
  'cleanup-old-logs',
  '0 3 1 * *',
  $$SELECT delete_old_logs()$$
);
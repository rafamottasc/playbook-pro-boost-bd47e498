-- Remove CRON job de limpeza de storage (não é mais necessário)
-- A limpeza agora é feita em tempo real quando arquivos são deletados/substituídos

DO $$
BEGIN
  -- Remove o CRON job se existir
  PERFORM cron.unschedule('cleanup-storage-weekly');
EXCEPTION
  WHEN undefined_table THEN
    -- Se a tabela cron não existe, ignora
    NULL;
  WHEN OTHERS THEN
    -- Se o job não existe, ignora
    NULL;
END $$;
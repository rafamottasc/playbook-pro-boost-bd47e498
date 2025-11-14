-- ============================================================
-- FASE 5: Remover coluna status antiga e finalizar migração
-- ============================================================

-- 1. Verificar novamente se todas as tarefas têm status_id (segurança)
DO $$
DECLARE
  tasks_without_status_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO tasks_without_status_id
  FROM public.daily_tasks
  WHERE status_id IS NULL;
  
  IF tasks_without_status_id > 0 THEN
    RAISE EXCEPTION 'Existem % tarefas sem status_id. Migração cancelada!', tasks_without_status_id;
  END IF;
END $$;

-- 2. Remover a coluna status antiga (não é mais necessária)
ALTER TABLE public.daily_tasks DROP COLUMN IF EXISTS status;

-- 3. Tornar status_id NOT NULL (agora é obrigatório)
ALTER TABLE public.daily_tasks ALTER COLUMN status_id SET NOT NULL;

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status_id_user ON public.daily_tasks(status_id, user_id);

-- 5. Atualizar comentário da tabela
COMMENT ON COLUMN public.daily_tasks.status_id IS 'Status dinâmico da tarefa (referência para task_statuses)';

-- Migração concluída com sucesso!
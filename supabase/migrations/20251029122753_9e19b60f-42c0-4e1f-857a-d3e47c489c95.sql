-- Tornar a coluna period nullable e adicionar valor padrão
ALTER TABLE daily_tasks 
ALTER COLUMN period DROP NOT NULL;

ALTER TABLE daily_tasks 
ALTER COLUMN period SET DEFAULT 'manha';

-- Comentário explicando que o campo está deprecated
COMMENT ON COLUMN daily_tasks.period IS 'DEPRECATED: Campo mantido para compatibilidade. Use o campo status no lugar.';
-- Adicionar coluna status na tabela daily_tasks
ALTER TABLE daily_tasks 
ADD COLUMN status text NOT NULL DEFAULT 'todo'
CHECK (status IN ('todo', 'in_progress', 'done'));

-- Migrar dados existentes: done = true -> status = 'done', done = false -> status = 'todo'
UPDATE daily_tasks 
SET status = CASE 
  WHEN done = true THEN 'done'
  ELSE 'todo'
END;

-- Adicionar índice para performance
CREATE INDEX idx_daily_tasks_status ON daily_tasks(status);

-- Comentário para documentação
COMMENT ON COLUMN daily_tasks.status IS 'Status da tarefa no Kanban: todo, in_progress, done';
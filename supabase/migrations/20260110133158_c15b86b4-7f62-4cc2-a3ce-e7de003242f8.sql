-- Remover a foreign key constraint em meeting_audit_logs.created_by
-- Logs de auditoria são históricos e não devem bloquear a exclusão de usuários
ALTER TABLE public.meeting_audit_logs 
DROP CONSTRAINT IF EXISTS meeting_audit_logs_created_by_fkey;
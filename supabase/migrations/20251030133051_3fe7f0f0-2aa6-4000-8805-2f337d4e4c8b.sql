-- Remover o trigger duplicado 'meeting_notifications'
-- Manter apenas 'meeting_changes_notification' que cobre todos os eventos

DROP TRIGGER IF EXISTS meeting_notifications ON meetings;

-- Confirmar que apenas meeting_changes_notification permanece ativo
-- Esse trigger já cobre: AFTER INSERT OR DELETE OR UPDATE
-- Portanto, não precisamos de um segundo trigger

COMMENT ON TRIGGER meeting_changes_notification ON meetings IS 
'Único trigger para notificações de reuniões (INSERT, UPDATE, DELETE)';
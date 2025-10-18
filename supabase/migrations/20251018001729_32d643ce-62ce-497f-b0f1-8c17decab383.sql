-- Limpar registros de humor com data futura (causados pelo bug de timezone UTC)
-- Isso remove entradas criadas quando o sistema usava UTC ao invés do timezone local
DELETE FROM daily_mood 
WHERE date > CURRENT_DATE;
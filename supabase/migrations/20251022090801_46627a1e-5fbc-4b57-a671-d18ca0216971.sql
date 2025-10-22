-- Atualizar função para notificar apenas nova reunião e cancelamento
CREATE OR REPLACE FUNCTION public.notify_meeting_changes()
RETURNS TRIGGER AS $$
DECLARE
  room_name TEXT;
  meeting_date TEXT;
BEGIN
  -- Buscar nome da sala
  SELECT name INTO room_name FROM meeting_rooms WHERE id = NEW.room_id;
  meeting_date := TO_CHAR(NEW.start_date AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY às HH24:MI');

  -- Nova reunião criada
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, title, message, link, type)
    SELECT 
      id,
      '📅 Nova reunião agendada',
      'Reunião em ' || room_name || ' marcada para ' || meeting_date,
      '/agenda',
      'meeting'
    FROM profiles
    WHERE approved = true AND (blocked = false OR blocked IS NULL);

  -- Reunião cancelada
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, link, type)
    SELECT 
      id,
      '❌ Reunião cancelada',
      'A reunião "' || NEW.title || '" em ' || room_name || ' foi cancelada' ||
      CASE WHEN NEW.cancellation_reason IS NOT NULL 
        THEN '. Motivo: ' || NEW.cancellation_reason 
        ELSE '' 
      END,
      '/agenda',
      'meeting'
    FROM profiles
    WHERE approved = true AND (blocked = false OR blocked IS NULL);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
-- Corrigir search_path nas funções criadas

-- Atualizar log_meeting_audit com search_path
CREATE OR REPLACE FUNCTION public.log_meeting_audit()
RETURNS TRIGGER AS $$
DECLARE
  room_name_var TEXT;
BEGIN
  -- Buscar nome da sala
  SELECT name INTO room_name_var FROM meeting_rooms WHERE id = OLD.room_id;
  
  INSERT INTO meeting_audit_logs (
    meeting_id,
    meeting_title,
    action,
    performed_by,
    details,
    reason,
    room_name,
    start_date,
    end_date,
    created_by
  ) VALUES (
    OLD.id,
    OLD.title,
    'deleted',
    auth.uid(),
    jsonb_build_object(
      'description', OLD.description,
      'participants_count', OLD.participants_count,
      'status', OLD.status
    ),
    NULL,
    room_name_var,
    OLD.start_date,
    OLD.end_date,
    OLD.created_by
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Atualizar notify_meeting_changes com search_path
CREATE OR REPLACE FUNCTION notify_meeting_changes()
RETURNS TRIGGER AS $$
DECLARE
  room_name TEXT;
  meeting_date TEXT;
BEGIN
  -- Buscar nome da sala
  IF TG_OP = 'DELETE' THEN
    SELECT name INTO room_name FROM meeting_rooms WHERE id = OLD.room_id;
    meeting_date := TO_CHAR(OLD.start_date AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY às HH24:MI');
  ELSE
    SELECT name INTO room_name FROM meeting_rooms WHERE id = NEW.room_id;
    meeting_date := TO_CHAR(NEW.start_date AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY às HH24:MI');
  END IF;

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
    WHERE approved = true AND (blocked = false OR blocked IS NULL) AND id != NEW.created_by;

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

  -- Reunião editada
  ELSIF TG_OP = 'UPDATE' AND NEW.status != 'cancelled' AND (
    OLD.title != NEW.title OR 
    OLD.start_date != NEW.start_date OR 
    OLD.end_date != NEW.end_date OR 
    OLD.room_id != NEW.room_id
  ) THEN
    INSERT INTO notifications (user_id, title, message, link, type)
    SELECT 
      id,
      '✏️ Reunião atualizada',
      'A reunião "' || NEW.title || '" em ' || room_name || ' foi alterada',
      '/agenda',
      'meeting'
    FROM profiles
    WHERE approved = true AND (blocked = false OR blocked IS NULL) AND id != NEW.created_by;

  -- Reunião excluída
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO notifications (user_id, title, message, link, type)
    SELECT 
      id,
      '🗑️ Reunião excluída',
      'A reunião "' || OLD.title || '" em ' || room_name || ' de ' || meeting_date || ' foi removida permanentemente',
      '/agenda/relatorio',
      'meeting'
    FROM profiles
    WHERE approved = true AND (blocked = false OR blocked IS NULL);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
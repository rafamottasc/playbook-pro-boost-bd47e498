-- CORREÇÃO CRÍTICA: Recriar triggers que faltam
-- =====================================================

-- 1. Trigger de validação de conflitos
DROP TRIGGER IF EXISTS validate_meeting_conflict ON public.meetings;
CREATE TRIGGER validate_meeting_conflict
  BEFORE INSERT OR UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_meeting_conflict();

-- 2. Trigger de notificações
DROP TRIGGER IF EXISTS meeting_notifications ON public.meetings;
CREATE TRIGGER meeting_notifications
  AFTER INSERT OR UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_meeting_changes();

-- 3. Trigger de updated_at para meetings
DROP TRIGGER IF EXISTS update_meetings_updated_at ON public.meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 4. Trigger de updated_at para meeting_rooms
DROP TRIGGER IF EXISTS update_meeting_rooms_updated_at ON public.meeting_rooms;
CREATE TRIGGER update_meeting_rooms_updated_at
  BEFORE UPDATE ON public.meeting_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
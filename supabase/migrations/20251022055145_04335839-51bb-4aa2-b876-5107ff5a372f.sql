-- ============================================
-- FASE 1 (COMPLEMENTO): Triggers, Índices e Realtime
-- ============================================

-- 1. CRIAR TRIGGERS PARA VALIDAÇÃO E NOTIFICAÇÕES
-- ============================================

-- Trigger para validação de conflitos de horário
DROP TRIGGER IF EXISTS validate_meeting_conflict ON public.meetings;
CREATE TRIGGER validate_meeting_conflict
  BEFORE INSERT OR UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_meeting_conflict();

-- Trigger para notificações automáticas
DROP TRIGGER IF EXISTS meeting_notifications ON public.meetings;
CREATE TRIGGER meeting_notifications
  AFTER INSERT OR UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_meeting_changes();

-- Trigger para updated_at em meetings
DROP TRIGGER IF EXISTS update_meetings_updated_at ON public.meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger para updated_at em meeting_rooms
DROP TRIGGER IF EXISTS update_meeting_rooms_updated_at ON public.meeting_rooms;
CREATE TRIGGER update_meeting_rooms_updated_at
  BEFORE UPDATE ON public.meeting_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 2. CRIAR ÍNDICES PARA PERFORMANCE (se não existem)
-- ============================================

-- Índices para meeting_rooms
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_active 
  ON public.meeting_rooms(active);

-- Índices para meetings
CREATE INDEX IF NOT EXISTS idx_meetings_room_dates 
  ON public.meetings(room_id, start_date, end_date) 
  WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_meetings_creator 
  ON public.meetings(created_by);

CREATE INDEX IF NOT EXISTS idx_meetings_status 
  ON public.meetings(status);

CREATE INDEX IF NOT EXISTS idx_meetings_date_range 
  ON public.meetings(start_date, end_date) 
  WHERE status != 'cancelled';

-- 3. HABILITAR REALTIME
-- ============================================

-- Adicionar tabelas à publicação realtime
DO $$
BEGIN
  -- Verificar se já não está na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'meeting_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
  END IF;
END $$;
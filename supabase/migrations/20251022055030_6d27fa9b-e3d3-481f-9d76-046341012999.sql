-- ============================================
-- FASE 1: SISTEMA DE AGENDAMENTO DE REUNIÕES
-- Tabelas, Funções, Triggers e RLS Policies
-- ============================================

-- 1. TABELA: meeting_rooms (Salas de Reunião)
-- ============================================
CREATE TABLE public.meeting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  capacity INTEGER DEFAULT 10 CHECK (capacity > 0),
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para meeting_rooms
ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active rooms"
  ON public.meeting_rooms FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage rooms"
  ON public.meeting_rooms FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Índice para performance
CREATE INDEX idx_meeting_rooms_active ON public.meeting_rooms(active);

-- Trigger para updated_at
CREATE TRIGGER update_meeting_rooms_updated_at
  BEFORE UPDATE ON public.meeting_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 2. TABELA: meetings (Reuniões)
-- ============================================
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  room_id UUID NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE RESTRICT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participants_count INTEGER DEFAULT 1 CHECK (participants_count > 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validação de datas
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- RLS para meetings
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view non-cancelled meetings"
  ON public.meetings FOR SELECT
  USING (
    status != 'cancelled' OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can create meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (
    auth.uid() = created_by 
    AND NOT is_user_blocked(auth.uid())
  );

CREATE POLICY "Creator can update own meetings"
  ON public.meetings FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all meetings"
  ON public.meetings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Índices estratégicos para performance
CREATE INDEX idx_meetings_room_dates ON public.meetings(room_id, start_date, end_date) 
  WHERE status != 'cancelled';
CREATE INDEX idx_meetings_creator ON public.meetings(created_by);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_date_range ON public.meetings(start_date, end_date) 
  WHERE status != 'cancelled';

-- Trigger para updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 3. FUNÇÃO: Validação de Conflitos de Horário
-- ============================================
CREATE OR REPLACE FUNCTION public.check_meeting_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar conflitos de horário para a mesma sala
  IF EXISTS (
    SELECT 1 FROM public.meetings
    WHERE room_id = NEW.room_id
      AND status != 'cancelled'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (NEW.start_date >= start_date AND NEW.start_date < end_date) OR
        (NEW.end_date > start_date AND NEW.end_date <= end_date) OR
        (NEW.start_date <= start_date AND NEW.end_date >= end_date)
      )
  ) THEN
    RAISE EXCEPTION 'Conflito de horário: esta sala já está reservada neste período';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_meeting_conflict
  BEFORE INSERT OR UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_meeting_conflict();

-- ============================================
-- 4. FUNÇÃO: Notificações Automáticas
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_meeting_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room_name TEXT;
  creator_name TEXT;
  meeting_date TEXT;
BEGIN
  -- Buscar dados para notificação
  SELECT mr.name INTO room_name 
  FROM public.meeting_rooms mr 
  WHERE mr.id = NEW.room_id;
  
  SELECT p.full_name INTO creator_name 
  FROM public.profiles p 
  WHERE p.id = NEW.created_by;
  
  meeting_date := TO_CHAR(NEW.start_date AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY às HH24:MI');
  
  -- Nova reunião criada
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, message, link, type)
    SELECT 
      id,
      '📅 Nova reunião agendada',
      creator_name || ' agendou reunião em ' || room_name || ' para ' || meeting_date,
      '/agenda',
      'meeting'
    FROM public.profiles
    WHERE approved = true 
      AND (blocked = false OR blocked IS NULL)
      AND id != NEW.created_by;
  
  -- Reunião cancelada
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, title, message, link, type)
    SELECT 
      id,
      '❌ Reunião cancelada',
      'A reunião em ' || room_name || ' de ' || meeting_date || ' foi cancelada',
      '/agenda',
      'meeting'
    FROM public.profiles
    WHERE approved = true 
      AND (blocked = false OR blocked IS NULL);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER meeting_notifications
  AFTER INSERT OR UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_meeting_changes();

-- ============================================
-- 5. HABILITAÇÃO DE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;

-- ============================================
-- 6. DADOS INICIAIS (Sala Padrão)
-- ============================================
INSERT INTO public.meeting_rooms (name, description, capacity, display_order)
VALUES 
  ('Sala Oficial', 'Sala principal para reuniões gerais', 20, 1)
ON CONFLICT (name) DO NOTHING;
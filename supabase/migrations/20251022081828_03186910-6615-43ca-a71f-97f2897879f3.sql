-- Criar índices para melhor performance nas queries de reuniões

-- Índice composto para buscar reuniões confirmadas ordenadas por data
CREATE INDEX IF NOT EXISTS idx_meetings_status_start_date 
ON public.meetings (status, start_date) 
WHERE status = 'confirmed';

-- Índice para filtro por sala
CREATE INDEX IF NOT EXISTS idx_meetings_room_id 
ON public.meetings (room_id);

-- Índice para busca por criador
CREATE INDEX IF NOT EXISTS idx_meetings_created_by 
ON public.meetings (created_by);
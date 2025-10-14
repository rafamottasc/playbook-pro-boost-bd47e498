-- Adicionar coluna para indicar se o aviso requer confirmação
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS requires_confirmation BOOLEAN DEFAULT false;

-- Adicionar colunas na tabela de views para rastrear confirmação
ALTER TABLE announcement_views 
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Dropar a função existente para recriá-la com novo retorno
DROP FUNCTION IF EXISTS public.get_active_announcements();

-- Recriar a função com o campo requires_confirmation
CREATE OR REPLACE FUNCTION public.get_active_announcements()
RETURNS TABLE(
  id uuid,
  title text,
  message text,
  priority text,
  icon text,
  cta_text text,
  cta_link text,
  dismissed boolean,
  requires_confirmation boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.message,
    a.priority,
    a.icon,
    a.cta_text,
    a.cta_link,
    COALESCE(av.dismissed, false) as dismissed,
    a.requires_confirmation
  FROM announcements a
  LEFT JOIN announcement_views av ON av.announcement_id = a.id AND av.user_id = auth.uid()
  WHERE a.active = true
    AND a.start_date <= NOW()
    AND (a.end_date IS NULL OR a.end_date > NOW())
    AND (
      a.target_audience = 'all'
      OR (a.target_audience = 'admin' AND has_role(auth.uid(), 'admin'::app_role))
      OR (a.target_audience = 'corretor' AND has_role(auth.uid(), 'corretor'::app_role))
    )
    AND COALESCE(av.dismissed, false) = false
  ORDER BY 
    CASE a.priority
      WHEN 'urgent' THEN 1
      WHEN 'warning' THEN 2
      WHEN 'info' THEN 3
      WHEN 'success' THEN 4
    END,
    a.created_at DESC
  LIMIT 1;
END;
$function$;

COMMENT ON COLUMN announcements.requires_confirmation IS 'Indica se o aviso exige confirmação de leitura';
COMMENT ON COLUMN announcement_views.confirmed IS 'Indica se o usuário confirmou a leitura';
COMMENT ON COLUMN announcement_views.confirmed_at IS 'Data e hora em que o usuário confirmou a leitura';
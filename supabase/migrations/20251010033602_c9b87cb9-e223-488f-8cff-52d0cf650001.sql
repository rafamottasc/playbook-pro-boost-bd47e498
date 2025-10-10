-- Criar tabela para tracking de cópias de mensagens
CREATE TABLE user_message_copies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_message_copies_user ON user_message_copies(user_id);
CREATE INDEX idx_user_message_copies_date ON user_message_copies(created_at);
CREATE INDEX idx_user_message_copies_user_message ON user_message_copies(user_id, message_id);

-- Habilitar RLS
ALTER TABLE user_message_copies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can insert own copies"
ON user_message_copies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own copies"
ON user_message_copies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all copies"
ON user_message_copies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Função para adicionar pontos de Playbooks com limite diário de 25 pontos
CREATE OR REPLACE FUNCTION add_playbook_points()
RETURNS TRIGGER AS $$
DECLARE
  daily_limit INTEGER := 25;
  points_today INTEGER;
  already_copied BOOLEAN;
BEGIN
  -- Se for uma cópia, verifica se já copiou esta mensagem hoje
  IF TG_TABLE_NAME = 'user_message_copies' THEN
    SELECT EXISTS(
      SELECT 1 FROM user_message_copies 
      WHERE user_id = NEW.user_id 
        AND message_id = NEW.message_id 
        AND DATE(created_at) = DATE(NEW.created_at)
        AND id != NEW.id
    ) INTO already_copied;
    
    IF already_copied THEN
      RETURN NEW; -- Não adiciona pontos se já copiou hoje
    END IF;
  END IF;

  -- Conta quantos pontos o usuário já ganhou hoje de Playbooks (cada ação = 5 pts)
  SELECT COALESCE(
    (SELECT COUNT(*) FROM user_message_copies 
     WHERE user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE) +
    (SELECT COUNT(*) FROM user_message_feedback 
     WHERE user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE)
  , 0) * 5 INTO points_today;

  -- Se ainda não atingiu o limite, adiciona 5 pontos
  IF points_today < daily_limit THEN
    UPDATE profiles
    SET points = points + 5
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para adicionar pontos ao copiar mensagem
CREATE TRIGGER on_message_copy_points
  AFTER INSERT ON user_message_copies
  FOR EACH ROW
  EXECUTE FUNCTION add_playbook_points();

-- Trigger para adicionar pontos ao dar feedback (like/dislike)
CREATE TRIGGER on_message_feedback_points
  AFTER INSERT ON user_message_feedback
  FOR EACH ROW
  EXECUTE FUNCTION add_playbook_points();
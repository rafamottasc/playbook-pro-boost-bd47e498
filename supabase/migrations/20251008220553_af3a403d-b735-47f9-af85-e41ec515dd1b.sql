-- Resetar likes e dislikes de todas as mensagens
UPDATE messages 
SET likes = 0, dislikes = 0;

-- Limpar todo o histórico de feedbacks dos usuários
DELETE FROM user_message_feedback;
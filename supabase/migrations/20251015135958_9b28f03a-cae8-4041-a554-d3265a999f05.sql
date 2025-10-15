-- Adicionar coluna delivery_type na tabela messages
-- Esta coluna permite marcar cada mensagem como Áudio, Ligação ou Texto
ALTER TABLE public.messages 
ADD COLUMN delivery_type text CHECK (delivery_type IN ('audio', 'call', 'text')) DEFAULT 'text';

-- Comentário: Default 'text' para mensagens existentes não quebrará nada
-- Ajustar a coluna value para ter precisão adequada
ALTER TABLE cub_values 
ALTER COLUMN value TYPE numeric(10,2);
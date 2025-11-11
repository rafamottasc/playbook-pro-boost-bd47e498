-- Forçar recálculo dos valores de outubro e novembro/2025
-- Isso dispara o trigger calculate_cub_variations e recalcula automaticamente as variações
UPDATE cub_values 
SET value = value 
WHERE year = 2025 AND month IN (10, 11);
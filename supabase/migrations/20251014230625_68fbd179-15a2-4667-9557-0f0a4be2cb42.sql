-- Reorganizar funil de Repescagem: transformar 1 etapa única em 9 etapas
-- Distribuir as 9 mensagens existentes nas novas etapas (1ª a 9ª Abordagem)

UPDATE messages 
SET stage = '1ª Abordagem'
WHERE funnel = 'repescagem' 
  AND stage = 'Reativação'
  AND display_order = 0;

UPDATE messages 
SET stage = '2ª Abordagem'
WHERE funnel = 'repescagem' 
  AND stage = 'Reativação'
  AND display_order = 1;

UPDATE messages 
SET stage = '3ª Abordagem'
WHERE funnel = 'repescagem' 
  AND stage = 'Reativação'
  AND display_order = 2;

UPDATE messages 
SET stage = '4ª Abordagem'
WHERE funnel = 'repescagem' 
  AND stage = 'Reativação'
  AND display_order = 3;

UPDATE messages 
SET stage = '5ª Abordagem'
WHERE funnel = 'repescagem' 
  AND stage = 'Reativação'
  AND display_order = 4;

UPDATE messages 
SET stage = '6ª Abordagem'
WHERE funnel = 'repescagem' 
  AND stage = 'Reativação'
  AND display_order = 5;

UPDATE messages 
SET stage = '7ª Abordagem'
WHERE funnel = 'repescagem' 
  AND stage = 'Reativação'
  AND display_order = 6;

UPDATE messages 
SET stage = '8ª Abordagem'
WHERE funnel = 'repescagem' 
  AND stage = 'Reativação'
  AND display_order = 7;

UPDATE messages 
SET stage = '9ª Abordagem'
WHERE funnel = 'repescagem' 
  AND stage = 'Reativação'
  AND display_order = 8;
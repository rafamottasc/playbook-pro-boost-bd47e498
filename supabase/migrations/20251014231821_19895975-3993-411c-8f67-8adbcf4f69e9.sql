-- Corrigir as 5 mensagens de Repescagem que ficaram com stage "Reativação"
-- Atualizar stage e display_order para sequência correta

UPDATE messages 
SET stage = '5ª Abordagem', display_order = 4
WHERE funnel = 'repescagem' 
  AND id = '4ac652d4-32d9-4210-9562-383043194650';

UPDATE messages 
SET stage = '6ª Abordagem', display_order = 5
WHERE funnel = 'repescagem' 
  AND id = '82c36fa0-96e8-463f-a994-e8ca4f18006c';

UPDATE messages 
SET stage = '7ª Abordagem', display_order = 6
WHERE funnel = 'repescagem' 
  AND id = '42ad61bc-558f-45e6-b550-27b6a0bc55dd';

UPDATE messages 
SET stage = '8ª Abordagem', display_order = 7
WHERE funnel = 'repescagem' 
  AND id = '1642fde9-daa3-4770-be89-36d4ab0cae6a';

UPDATE messages 
SET stage = '9ª Abordagem', display_order = 8
WHERE funnel = 'repescagem' 
  AND id = 'b0a0afcc-376f-404b-8405-6f1d3acc1c5d';
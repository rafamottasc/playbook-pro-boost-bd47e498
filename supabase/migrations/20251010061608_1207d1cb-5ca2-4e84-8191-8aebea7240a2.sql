-- Corrigir mensagens de teste com nomenclatura inconsistente no funil lead-novo
UPDATE messages 
SET stage = '1ª Abordagem' 
WHERE stage IN ('Primeira Abordagem', 'primeira abordagem', '1 Abordagem') AND funnel = 'lead-novo';

UPDATE messages 
SET stage = '2ª Abordagem' 
WHERE stage IN ('Segunda Abordagem', 'segunda abordagem', '2 Abordagem') AND funnel = 'lead-novo';

UPDATE messages 
SET stage = '3ª Abordagem' 
WHERE stage IN ('Terceira Abordagem', 'terceira abordagem', '3 Abordagem') AND funnel = 'lead-novo';

UPDATE messages 
SET stage = '4ª Abordagem' 
WHERE stage IN ('Quarta Abordagem', 'quarta abordagem', '4 Abordagem') AND funnel = 'lead-novo';

UPDATE messages 
SET stage = '5ª Abordagem' 
WHERE stage IN ('Quinta Abordagem', 'quinta abordagem', '5 Abordagem') AND funnel = 'lead-novo';

UPDATE messages 
SET stage = '6ª Abordagem' 
WHERE stage IN ('Sexta Abordagem', 'sexta abordagem', '6 Abordagem') AND funnel = 'lead-novo';

UPDATE messages 
SET stage = '7ª Abordagem' 
WHERE stage IN ('Sétima Abordagem', 'sétima abordagem', '7 Abordagem') AND funnel = 'lead-novo';

-- Corrigir mensagens do funil atendimento
UPDATE messages 
SET stage = 'Apresentação do Produto' 
WHERE stage IN ('Apresentação Produto', 'apresentação produto', 'Apresentacao Produto') AND funnel = 'atendimento';

UPDATE messages 
SET stage = 'Visita / Call' 
WHERE stage IN ('Visita/Call', 'visita/call', 'Visita Call') AND funnel = 'atendimento';

-- Corrigir mensagens do funil repescagem
UPDATE messages 
SET stage = 'Reativação' 
WHERE stage IN ('Etapa 1', 'etapa 1') AND funnel = 'repescagem';

-- Corrigir mensagens do funil nutrição
UPDATE messages 
SET stage = 'Educação' 
WHERE stage IN ('Etapa 1', 'etapa 1') AND funnel = 'nutricao';

UPDATE messages 
SET stage = 'Oportunidades' 
WHERE stage IN ('Etapa 2', 'etapa 2') AND funnel = 'nutricao';

-- Adicionar comentário para auditoria
COMMENT ON COLUMN messages.stage IS 'Deve usar os valores exatos definidos em playbook-constants.ts';
-- Adicionar campos opcionais para cálculos automáticos
ALTER TABLE cub_values
ADD COLUMN IF NOT EXISTS variacao_mensal numeric,
ADD COLUMN IF NOT EXISTS acumulado_ano numeric;

-- Função para calcular variação mensal e acumulado anual automaticamente
CREATE OR REPLACE FUNCTION calculate_cub_variations()
RETURNS TRIGGER AS $$
DECLARE
  previous_month_value numeric;
  january_value numeric;
BEGIN
  -- Buscar valor do mês anterior
  SELECT value INTO previous_month_value
  FROM cub_values
  WHERE (year = NEW.year AND month = NEW.month - 1)
     OR (year = NEW.year - 1 AND month = 12 AND NEW.month = 1)
  ORDER BY year DESC, month DESC
  LIMIT 1;

  -- Calcular variação mensal
  IF previous_month_value IS NOT NULL AND previous_month_value > 0 THEN
    NEW.variacao_mensal := ROUND(((NEW.value - previous_month_value) / previous_month_value) * 100, 2);
  END IF;

  -- Buscar valor de janeiro do ano atual
  SELECT value INTO january_value
  FROM cub_values
  WHERE year = NEW.year AND month = 1
  LIMIT 1;

  -- Calcular acumulado no ano
  IF january_value IS NOT NULL AND january_value > 0 THEN
    NEW.acumulado_ano := ROUND(((NEW.value - january_value) / january_value) * 100, 2);
  ELSIF NEW.month = 1 THEN
    -- Se for janeiro, buscar dezembro do ano anterior para calcular variação
    SELECT value INTO previous_month_value
    FROM cub_values
    WHERE year = NEW.year - 1 AND month = 12
    LIMIT 1;
    
    IF previous_month_value IS NOT NULL AND previous_month_value > 0 THEN
      NEW.acumulado_ano := ROUND(((NEW.value - previous_month_value) / previous_month_value) * 100, 2);
    ELSE
      NEW.acumulado_ano := 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Criar trigger para executar a função antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS cub_calculate_variations ON cub_values;
CREATE TRIGGER cub_calculate_variations
BEFORE INSERT OR UPDATE ON cub_values
FOR EACH ROW
EXECUTE FUNCTION calculate_cub_variations();
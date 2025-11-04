-- ============================================
-- 1️⃣ Recriar função de cálculo de variações
-- ============================================
CREATE OR REPLACE FUNCTION calculate_cub_variations()
RETURNS TRIGGER AS $$
DECLARE
  previous_month_value numeric;
  january_value numeric;
BEGIN
  -- Buscar valor do mês anterior (incluindo dezembro do ano anterior para janeiro)
  IF NEW.month = 1 THEN
    -- Janeiro: buscar dezembro do ano anterior
    SELECT value INTO previous_month_value
    FROM cub_values
    WHERE year = NEW.year - 1 AND month = 12
    LIMIT 1;
  ELSE
    -- Outros meses: buscar mês anterior do mesmo ano
    SELECT value INTO previous_month_value
    FROM cub_values
    WHERE year = NEW.year AND month = NEW.month - 1
    LIMIT 1;
  END IF;

  -- Calcular variação mensal
  IF previous_month_value IS NOT NULL AND previous_month_value > 0 THEN
    NEW.variacao_mensal := ROUND(((NEW.value - previous_month_value) / previous_month_value) * 100, 2);
  END IF;

  -- Calcular acumulado no ano
  IF NEW.month = 1 THEN
    -- Janeiro: acumulado = própria variação mensal (reinicia o ano)
    NEW.acumulado_ano := NEW.variacao_mensal;
  ELSE
    -- Outros meses: buscar janeiro do ano atual
    SELECT value INTO january_value
    FROM cub_values
    WHERE year = NEW.year AND month = 1
    LIMIT 1;
    
    IF january_value IS NOT NULL AND january_value > 0 THEN
      NEW.acumulado_ano := ROUND(((NEW.value - january_value) / january_value) * 100, 2);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- ============================================
-- 2️⃣ Inserir Dezembro/2024 (base para janeiro)
-- ============================================
INSERT INTO cub_values (month, year, value, created_at)
VALUES (12, 2024, 2868.56, '2024-12-15 10:00:00'::timestamptz)
ON CONFLICT (month, year) DO UPDATE
SET value = EXCLUDED.value;

-- ============================================
-- 3️⃣ Forçar recálculo de Janeiro/2025
-- ============================================
UPDATE cub_values 
SET value = value 
WHERE year = 2025 AND month = 1;
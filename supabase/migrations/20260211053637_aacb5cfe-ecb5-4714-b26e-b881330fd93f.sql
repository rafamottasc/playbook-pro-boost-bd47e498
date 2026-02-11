
CREATE OR REPLACE FUNCTION public.calculate_cub_variations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  previous_month_value numeric;
  same_month_prev_year_value numeric;
BEGIN
  -- Buscar valor do mês anterior (incluindo dezembro do ano anterior para janeiro)
  IF NEW.month = 1 THEN
    SELECT value INTO previous_month_value
    FROM cub_values
    WHERE year = NEW.year - 1 AND month = 12
    LIMIT 1;
  ELSE
    SELECT value INTO previous_month_value
    FROM cub_values
    WHERE year = NEW.year AND month = NEW.month - 1
    LIMIT 1;
  END IF;

  -- Calcular variação mensal
  IF previous_month_value IS NOT NULL AND previous_month_value > 0 THEN
    NEW.variacao_mensal := ROUND(((NEW.value - previous_month_value) / previous_month_value) * 100, 2);
  END IF;

  -- Calcular acumulado no ano: variação em relação ao mesmo mês do ano anterior
  SELECT value INTO same_month_prev_year_value
  FROM cub_values
  WHERE year = NEW.year - 1 AND month = NEW.month
  LIMIT 1;

  IF same_month_prev_year_value IS NOT NULL AND same_month_prev_year_value > 0 THEN
    NEW.acumulado_ano := ROUND(((NEW.value - same_month_prev_year_value) / same_month_prev_year_value) * 100, 2);
  ELSE
    -- Fallback: se não houver dado do ano anterior, usa variação mensal
    NEW.acumulado_ano := NEW.variacao_mensal;
  END IF;

  RETURN NEW;
END;
$function$;

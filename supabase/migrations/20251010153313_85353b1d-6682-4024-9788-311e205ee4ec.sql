-- Corrigir search_path da função para segurança
DROP TRIGGER IF EXISTS update_anonymous_feedbacks_timestamp ON public.anonymous_feedbacks;
DROP FUNCTION IF EXISTS update_anonymous_feedbacks_updated_at();

CREATE OR REPLACE FUNCTION update_anonymous_feedbacks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_anonymous_feedbacks_timestamp
  BEFORE UPDATE ON public.anonymous_feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_anonymous_feedbacks_updated_at();
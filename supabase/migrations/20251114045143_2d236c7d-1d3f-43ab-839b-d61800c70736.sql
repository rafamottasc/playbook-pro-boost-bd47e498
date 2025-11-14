-- Corrigir search_path na função update_task_statuses_updated_at
DROP FUNCTION IF EXISTS public.update_task_statuses_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_task_statuses_updated_at()
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

-- Recriar o trigger
DROP TRIGGER IF EXISTS update_task_statuses_timestamp ON public.task_statuses;
CREATE TRIGGER update_task_statuses_timestamp
BEFORE UPDATE ON public.task_statuses
FOR EACH ROW
EXECUTE FUNCTION public.update_task_statuses_updated_at();
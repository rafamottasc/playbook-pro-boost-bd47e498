-- Correção de segurança: Adicionar search_path nas funções

-- Recriar update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Recriar update_task_completed_at com search_path
CREATE OR REPLACE FUNCTION public.update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.done = true AND OLD.done = false THEN
    NEW.completed_at = now();
  ELSIF NEW.done = false AND OLD.done = true THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Recriar create_default_task_categories com search_path
CREATE OR REPLACE FUNCTION public.create_default_task_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.task_categories (user_id, label, icon, color, is_system, display_order)
  VALUES
    (NEW.id, 'Ligações', '📞', 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400', true, 1),
    (NEW.id, 'Visitas', '🏠', 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400', true, 2),
    (NEW.id, 'Propostas', '📝', 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400', true, 3),
    (NEW.id, 'Follow-up', '🔄', 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400', true, 4),
    (NEW.id, 'Reuniões', '👥', 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400', true, 5),
    (NEW.id, 'Geral', '📌', 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400', true, 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
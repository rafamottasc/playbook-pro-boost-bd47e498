-- Inserir categorias padrão para todos os usuários que ainda não as possuem
-- Busca usuários que não têm nenhuma categoria
INSERT INTO public.task_categories (user_id, label, icon, color, is_system, display_order)
SELECT 
  p.id as user_id,
  unnest(ARRAY['Ligações', 'Visitas', 'Propostas', 'Follow-up', 'Reuniões', 'Geral']) as label,
  unnest(ARRAY['Phone', 'Home', 'FileText', 'RefreshCw', 'Users', 'Bookmark']) as icon,
  unnest(ARRAY[
    'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
    'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
    'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400',
    'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400',
    'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400',
    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
  ]) as color,
  true as is_system,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as display_order
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_categories tc WHERE tc.user_id = p.id
);

-- Atualizar categorias existentes com emoji para usar ícones Lucide
UPDATE public.task_categories
SET 
  icon = CASE 
    WHEN icon = '📞' THEN 'Phone'
    WHEN icon = '🏠' THEN 'Home'
    WHEN icon = '📝' THEN 'FileText'
    WHEN icon = '🔄' THEN 'RefreshCw'
    WHEN icon = '👥' THEN 'Users'
    WHEN icon = '📌' THEN 'Bookmark'
    ELSE icon
  END
WHERE icon IN ('📞', '🏠', '📝', '🔄', '👥', '📌');
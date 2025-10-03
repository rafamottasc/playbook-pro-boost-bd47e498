-- Criar função para identificar o primeiro admin do sistema
CREATE OR REPLACE FUNCTION public.is_first_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT target_user_id = (
    SELECT p.id
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'admin'
    ORDER BY p.created_at ASC
    LIMIT 1
  )
$$;

-- Atualizar política RLS para impedir remoção do primeiro admin
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND 
  -- Impedir que qualquer um remova a role admin do primeiro admin
  NOT (role = 'admin' AND is_first_admin(user_id))
);
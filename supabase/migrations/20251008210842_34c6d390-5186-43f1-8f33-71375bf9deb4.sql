-- 1. CRIAR PERFIS PARA USUÁRIOS ÓRFÃOS (como comarcsecretaria@gmail.com)
INSERT INTO public.profiles (id, full_name, whatsapp, email, approved)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) as full_name,
  COALESCE(au.raw_user_meta_data->>'whatsapp', '') as whatsapp,
  au.email,
  false as approved
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. ATRIBUIR ROLE DE CORRETOR PARA USUÁRIOS ÓRFÃOS
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'corretor'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id AND ur.role = 'corretor'::app_role
WHERE ur.id IS NULL
ON CONFLICT DO NOTHING;

-- 3. CRIAR NOTIFICAÇÕES PARA ADMINS SOBRE NOVOS USUÁRIOS PENDENTES
INSERT INTO public.notifications (user_id, title, message, link, type)
SELECT 
  admin_user.id,
  'Novo usuário cadastrado',
  COALESCE(p.full_name, 'Um novo usuário') || ' aguarda aprovação de cadastro.',
  '/admin',
  'user'
FROM public.profiles p
CROSS JOIN (
  SELECT DISTINCT ur.user_id as id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role
) admin_user
WHERE p.approved = false
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = admin_user.id 
      AND n.type = 'user'
      AND n.message LIKE '%' || p.full_name || '%'
      AND n.created_at > (NOW() - INTERVAL '1 day')
  );

-- 4. MELHORAR TRIGGER handle_new_user() PARA SER MAIS ROBUSTO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_count INTEGER;
  v_full_name TEXT;
  v_whatsapp TEXT;
  v_is_first_user BOOLEAN;
BEGIN
  -- Extrair dados do metadata (funciona com Google OAuth e cadastro manual)
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  v_whatsapp := COALESCE(
    NEW.raw_user_meta_data->>'whatsapp',
    ''
  );
  
  -- Count existing users (excluding current one)
  SELECT COUNT(*) INTO user_count 
  FROM auth.users 
  WHERE id != NEW.id;
  
  v_is_first_user := (user_count = 0);
  
  -- Create profile with ON CONFLICT to avoid errors
  INSERT INTO public.profiles (id, full_name, whatsapp, email, approved)
  VALUES (
    NEW.id, 
    v_full_name, 
    v_whatsapp, 
    NEW.email, 
    v_is_first_user  -- First user is auto-approved
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    whatsapp = COALESCE(NULLIF(EXCLUDED.whatsapp, ''), profiles.whatsapp);
  
  -- Assign corretor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'corretor'::app_role)
  ON CONFLICT DO NOTHING;
  
  -- If first user, also assign admin role
  IF v_is_first_user THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  ELSE
    -- Create notification for all admins about new user registration
    INSERT INTO public.notifications (user_id, title, message, link, type)
    SELECT 
      ur.user_id,
      'Novo usuário cadastrado',
      v_full_name || ' aguarda aprovação de cadastro.',
      '/admin',
      'user'
    FROM public.user_roles ur
    WHERE ur.role = 'admin'::app_role;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
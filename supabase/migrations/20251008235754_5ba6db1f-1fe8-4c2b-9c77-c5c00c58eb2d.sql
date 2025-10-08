-- Passo 1: Criar profile faltante para comarcsecretaria@gmail.com
INSERT INTO public.profiles (id, full_name, whatsapp, email, approved, blocked)
VALUES (
  '126448ef-3f79-448e-b363-20bed7ee7a17',
  'Secretária Comarc',
  '',
  'comarcsecretaria@gmail.com',
  true,
  false
)
ON CONFLICT (id) DO UPDATE
SET 
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  email = COALESCE(EXCLUDED.email, profiles.email),
  approved = COALESCE(EXCLUDED.approved, profiles.approved);

-- Garantir role corretor
INSERT INTO public.user_roles (user_id, role)
VALUES ('126448ef-3f79-448e-b363-20bed7ee7a17', 'corretor'::app_role)
ON CONFLICT DO NOTHING;

-- Passo 3: Melhorar trigger handle_new_user com logs e melhor tratamento de erros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;
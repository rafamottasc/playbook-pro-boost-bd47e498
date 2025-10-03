-- Modify handle_new_user function to make first user admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', '')
  );
  
  -- Count existing users (excluding current one)
  SELECT COUNT(*) INTO user_count 
  FROM auth.users 
  WHERE id != NEW.id;
  
  -- Assign corretor role to all users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'corretor');
  
  -- If first user, also assign admin role
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;
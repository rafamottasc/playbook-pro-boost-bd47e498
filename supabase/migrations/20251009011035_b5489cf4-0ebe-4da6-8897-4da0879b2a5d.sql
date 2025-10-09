-- Add last_sign_in_at column to profiles table
ALTER TABLE public.profiles
ADD COLUMN last_sign_in_at TIMESTAMP WITH TIME ZONE;

-- Create or replace function to update last sign in timestamp
CREATE OR REPLACE FUNCTION public.update_last_sign_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_sign_in_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger to update last_sign_in_at on auth state change
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.update_last_sign_in();
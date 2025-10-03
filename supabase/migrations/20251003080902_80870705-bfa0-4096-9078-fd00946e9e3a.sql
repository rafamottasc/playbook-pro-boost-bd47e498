-- Phase 1: Fix Critical RLS Policies

-- 1. Fix Profiles Table RLS Policy - restrict to own profile or admin access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Restrict User Roles Visibility - users can only see their own roles
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles or admins can view all"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Phase 2: Fix Database Function Security

-- 3. Add search_path to update_updated_at() function for security
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
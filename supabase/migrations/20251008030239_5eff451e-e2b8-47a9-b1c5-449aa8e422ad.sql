-- Priority 1: Remove overly permissive profile access policy
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;

-- Priority 2: Create function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(blocked, false) 
  FROM public.profiles 
  WHERE id = _user_id
$$;

-- Priority 2: Add blocking policies to critical tables
DROP POLICY IF EXISTS "Blocked users cannot access messages" ON public.messages;
CREATE POLICY "Blocked users cannot access messages"
ON public.messages FOR ALL
USING (NOT is_user_blocked(auth.uid()));

DROP POLICY IF EXISTS "Blocked users cannot access resources" ON public.resources;
CREATE POLICY "Blocked users cannot access resources"
ON public.resources FOR ALL
USING (NOT is_user_blocked(auth.uid()));

DROP POLICY IF EXISTS "Blocked users cannot access academy modules" ON public.academy_modules;
CREATE POLICY "Blocked users cannot access academy modules"
ON public.academy_modules FOR ALL
USING (NOT is_user_blocked(auth.uid()));

DROP POLICY IF EXISTS "Blocked users cannot access academy lessons" ON public.academy_lessons;
CREATE POLICY "Blocked users cannot access academy lessons"
ON public.academy_lessons FOR ALL
USING (NOT is_user_blocked(auth.uid()));

DROP POLICY IF EXISTS "Blocked users cannot submit questions" ON public.lesson_questions;
CREATE POLICY "Blocked users cannot submit questions"
ON public.lesson_questions FOR ALL
USING (NOT is_user_blocked(auth.uid()));

DROP POLICY IF EXISTS "Blocked users cannot access campaigns" ON public.campaigns;
CREATE POLICY "Blocked users cannot access campaigns"
ON public.campaigns FOR ALL
USING (NOT is_user_blocked(auth.uid()));

-- Priority 3: Allow users to delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);
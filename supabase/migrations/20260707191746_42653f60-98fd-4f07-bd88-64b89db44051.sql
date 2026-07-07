-- academy_lessons
DROP POLICY IF EXISTS "Blocked users cannot access academy lessons" ON public.academy_lessons;
CREATE POLICY "Blocked users cannot access academy lessons"
ON public.academy_lessons AS RESTRICTIVE FOR ALL TO authenticated
USING (NOT public.is_user_blocked(auth.uid()))
WITH CHECK (NOT public.is_user_blocked(auth.uid()));

-- academy_modules
DROP POLICY IF EXISTS "Blocked users cannot access academy modules" ON public.academy_modules;
CREATE POLICY "Blocked users cannot access academy modules"
ON public.academy_modules AS RESTRICTIVE FOR ALL TO authenticated
USING (NOT public.is_user_blocked(auth.uid()))
WITH CHECK (NOT public.is_user_blocked(auth.uid()));

-- campaigns
DROP POLICY IF EXISTS "Blocked users cannot modify campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Blocked users cannot modify campaigns delete" ON public.campaigns;
DROP POLICY IF EXISTS "Blocked users cannot modify campaigns update" ON public.campaigns;
CREATE POLICY "Blocked users cannot modify campaigns"
ON public.campaigns AS RESTRICTIVE FOR ALL TO authenticated
USING (NOT public.is_user_blocked(auth.uid()))
WITH CHECK (NOT public.is_user_blocked(auth.uid()));

-- lesson_questions
DROP POLICY IF EXISTS "Blocked users cannot submit questions" ON public.lesson_questions;
CREATE POLICY "Blocked users cannot submit questions"
ON public.lesson_questions AS RESTRICTIVE FOR ALL TO authenticated
USING (NOT public.is_user_blocked(auth.uid()))
WITH CHECK (NOT public.is_user_blocked(auth.uid()));

-- Allow users to update their own questions (author) — currently missing
CREATE POLICY "Users can update own questions"
ON public.lesson_questions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- messages
DROP POLICY IF EXISTS "Blocked users cannot access messages" ON public.messages;
CREATE POLICY "Blocked users cannot access messages"
ON public.messages AS RESTRICTIVE FOR ALL TO authenticated
USING (NOT public.is_user_blocked(auth.uid()))
WITH CHECK (NOT public.is_user_blocked(auth.uid()));

-- resources
DROP POLICY IF EXISTS "Blocked users cannot access resources" ON public.resources;
CREATE POLICY "Blocked users cannot access resources"
ON public.resources AS RESTRICTIVE FOR ALL TO authenticated
USING (NOT public.is_user_blocked(auth.uid()))
WITH CHECK (NOT public.is_user_blocked(auth.uid()));
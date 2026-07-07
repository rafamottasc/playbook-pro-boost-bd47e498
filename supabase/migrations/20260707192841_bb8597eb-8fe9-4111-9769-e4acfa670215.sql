-- 1) theme_settings: restringir SELECT a autenticados
DROP POLICY IF EXISTS "Anyone can read theme settings" ON public.theme_settings;
CREATE POLICY "Authenticated users can read theme settings"
ON public.theme_settings FOR SELECT TO authenticated
USING (true);

-- 2) storage: restringir 'resources' a autenticados
DROP POLICY IF EXISTS "Anyone can view resources" ON storage.objects;
CREATE POLICY "Authenticated users can view resources"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resources');

-- 3) storage: bloquear usuários bloqueados em lesson-materials
CREATE POLICY "Blocked users cannot access lesson materials (select)"
ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
USING (bucket_id <> 'lesson-materials' OR NOT public.is_user_blocked(auth.uid()));

CREATE POLICY "Blocked users cannot upload lesson materials"
ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (bucket_id <> 'lesson-materials' OR NOT public.is_user_blocked(auth.uid()));

CREATE POLICY "Blocked users cannot update lesson materials"
ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING (bucket_id <> 'lesson-materials' OR NOT public.is_user_blocked(auth.uid()))
WITH CHECK (bucket_id <> 'lesson-materials' OR NOT public.is_user_blocked(auth.uid()));

CREATE POLICY "Blocked users cannot delete lesson materials"
ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
USING (bucket_id <> 'lesson-materials' OR NOT public.is_user_blocked(auth.uid()));

-- 4) Restringir INSERT policies "always true" a service_role
DROP POLICY IF EXISTS "System can insert cleanup logs" ON public.storage_cleanup_logs;
CREATE POLICY "Service role can insert cleanup logs"
ON public.storage_cleanup_logs FOR INSERT TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.meeting_audit_logs;
CREATE POLICY "Service role can insert audit logs"
ON public.meeting_audit_logs FOR INSERT TO service_role
WITH CHECK (true);

-- 5) Revogar EXECUTE em SECURITY DEFINER internos de anon/authenticated
DO $$
DECLARE
  fname text;
  keep_list text[] := ARRAY[
    'has_role', 'is_user_blocked', 'is_first_admin',
    'get_public_profiles', 'get_active_announcements', 'get_mood_metrics',
    'increment_question_likes', 'decrement_question_likes',
    'extract_storage_path'
  ];
BEGIN
  FOR fname IN
    SELECT DISTINCT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname <> ALL(keep_list)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM PUBLIC, anon, authenticated', fname);
  END LOOP;
END $$;
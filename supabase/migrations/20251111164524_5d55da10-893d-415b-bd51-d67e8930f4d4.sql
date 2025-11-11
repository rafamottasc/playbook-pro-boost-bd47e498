-- Corrigir foreign key constraints que impedem deleção de usuários
-- Focando nas tabelas que realmente existem

-- 1. Corrigir meeting_audit_logs.performed_by (SET NULL para preservar histórico)
ALTER TABLE public.meeting_audit_logs 
DROP CONSTRAINT IF EXISTS meeting_audit_logs_performed_by_fkey;

ALTER TABLE public.meeting_audit_logs 
ADD CONSTRAINT meeting_audit_logs_performed_by_fkey 
FOREIGN KEY (performed_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 2. Corrigir meeting_audit_logs.created_by (SET NULL para preservar histórico)
ALTER TABLE public.meeting_audit_logs 
DROP CONSTRAINT IF EXISTS meeting_audit_logs_created_by_fkey;

ALTER TABLE public.meeting_audit_logs 
ADD CONSTRAINT meeting_audit_logs_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 3. Corrigir meetings.created_by (SET NULL para preservar registro)
ALTER TABLE public.meetings 
DROP CONSTRAINT IF EXISTS meetings_created_by_fkey;

ALTER TABLE public.meetings 
ADD CONSTRAINT meetings_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 4. Corrigir daily_mood.user_id (CASCADE - dados pessoais)
ALTER TABLE public.daily_mood 
DROP CONSTRAINT IF EXISTS daily_mood_user_id_fkey;

ALTER TABLE public.daily_mood 
ADD CONSTRAINT daily_mood_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 5. Corrigir notifications.user_id (CASCADE - dados pessoais)
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 6. Corrigir user_roles.user_id (CASCADE - dados de usuário)
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 7. Corrigir user_message_feedback.user_id (CASCADE)
ALTER TABLE public.user_message_feedback 
DROP CONSTRAINT IF EXISTS user_message_feedback_user_id_fkey;

ALTER TABLE public.user_message_feedback 
ADD CONSTRAINT user_message_feedback_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 8. Corrigir poll_responses.user_id (CASCADE)
ALTER TABLE public.poll_responses 
DROP CONSTRAINT IF EXISTS poll_responses_user_id_fkey;

ALTER TABLE public.poll_responses 
ADD CONSTRAINT poll_responses_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 9. Corrigir announcement_views.user_id (CASCADE)
ALTER TABLE public.announcement_views 
DROP CONSTRAINT IF EXISTS announcement_views_user_id_fkey;

ALTER TABLE public.announcement_views 
ADD CONSTRAINT announcement_views_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 10. Corrigir payment_flows.user_id (CASCADE - dados pessoais)
ALTER TABLE public.payment_flows 
DROP CONSTRAINT IF EXISTS payment_flows_user_id_fkey;

ALTER TABLE public.payment_flows 
ADD CONSTRAINT payment_flows_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
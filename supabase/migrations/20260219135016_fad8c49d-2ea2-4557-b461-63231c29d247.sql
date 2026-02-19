
-- 1. announcements.created_by
ALTER TABLE public.announcements DROP CONSTRAINT announcements_created_by_fkey;
ALTER TABLE public.announcements ADD CONSTRAINT announcements_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. lesson_questions.answered_by
ALTER TABLE public.lesson_questions DROP CONSTRAINT lesson_questions_answered_by_fkey;
ALTER TABLE public.lesson_questions ADD CONSTRAINT lesson_questions_answered_by_fkey 
  FOREIGN KEY (answered_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. meetings.cancelled_by
ALTER TABLE public.meetings DROP CONSTRAINT meetings_cancelled_by_fkey;
ALTER TABLE public.meetings ADD CONSTRAINT meetings_cancelled_by_fkey 
  FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. partner_files.uploaded_by
ALTER TABLE public.partner_files DROP CONSTRAINT partner_files_uploaded_by_fkey;
ALTER TABLE public.partner_files ADD CONSTRAINT partner_files_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create academy_modules table
CREATE TABLE public.academy_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create academy_lessons table
CREATE TABLE public.academy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.academy_modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_minutes INTEGER,
  points INTEGER DEFAULT 10,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lesson_attachments table
CREATE TABLE public.lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_lesson_progress table
CREATE TABLE public.user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE NOT NULL,
  watched BOOLEAN DEFAULT false,
  watched_at TIMESTAMP WITH TIME ZONE,
  completed_percentage INTEGER DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);

-- Create lesson_feedback table
CREATE TABLE public.lesson_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  was_useful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create lesson_questions table
CREATE TABLE public.lesson_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES public.profiles(id),
  answered_at TIMESTAMP WITH TIME ZONE,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create question_likes table
CREATE TABLE public.question_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.lesson_questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academy_modules
CREATE POLICY "Authenticated users can view modules"
  ON public.academy_modules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage modules"
  ON public.academy_modules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for academy_lessons
CREATE POLICY "Authenticated users can view lessons"
  ON public.academy_lessons FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage lessons"
  ON public.academy_lessons FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lesson_attachments
CREATE POLICY "Authenticated users can view attachments"
  ON public.lesson_attachments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage attachments"
  ON public.lesson_attachments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_lesson_progress
CREATE POLICY "Users can view own progress"
  ON public.user_lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress"
  ON public.user_lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_lesson_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON public.user_lesson_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lesson_feedback
CREATE POLICY "Users can view own feedback"
  ON public.lesson_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON public.lesson_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.lesson_feedback FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lesson_questions
CREATE POLICY "Authenticated users can view questions"
  ON public.lesson_questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own questions"
  ON public.lesson_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update questions"
  ON public.lesson_questions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete questions"
  ON public.lesson_questions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for question_likes
CREATE POLICY "Authenticated users can view likes"
  ON public.question_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own likes"
  ON public.question_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.question_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_academy_lessons_module_id ON public.academy_lessons(module_id);
CREATE INDEX idx_lesson_attachments_lesson_id ON public.lesson_attachments(lesson_id);
CREATE INDEX idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_lesson_id ON public.user_lesson_progress(lesson_id);
CREATE INDEX idx_lesson_feedback_lesson_id ON public.lesson_feedback(lesson_id);
CREATE INDEX idx_lesson_questions_lesson_id ON public.lesson_questions(lesson_id);
CREATE INDEX idx_question_likes_question_id ON public.question_likes(question_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Create updated_at trigger for academy_modules
CREATE TRIGGER update_academy_modules_updated_at
  BEFORE UPDATE ON public.academy_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create updated_at trigger for academy_lessons
CREATE TRIGGER update_academy_lessons_updated_at
  BEFORE UPDATE ON public.academy_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_questions;
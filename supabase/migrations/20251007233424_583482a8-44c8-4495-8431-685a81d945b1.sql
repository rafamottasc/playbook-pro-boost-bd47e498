-- Fix RPC functions with proper search_path
DROP FUNCTION IF EXISTS increment_question_likes(UUID);
DROP FUNCTION IF EXISTS decrement_question_likes(UUID);

CREATE OR REPLACE FUNCTION increment_question_likes(question_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lesson_questions
  SET likes = likes + 1
  WHERE id = question_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_question_likes(question_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lesson_questions
  SET likes = GREATEST(0, likes - 1)
  WHERE id = question_id;
END;
$$;
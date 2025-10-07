-- Create RPC functions for question likes
CREATE OR REPLACE FUNCTION increment_question_likes(question_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.lesson_questions
  SET likes = likes + 1
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_question_likes(question_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.lesson_questions
  SET likes = GREATEST(0, likes - 1)
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
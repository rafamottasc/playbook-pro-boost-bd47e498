-- Add points column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- Create function to add lesson points automatically
CREATE OR REPLACE FUNCTION public.add_lesson_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lesson_points INTEGER;
BEGIN
  -- Only add points when lesson is newly completed
  IF NEW.watched = true AND (OLD.watched IS NULL OR OLD.watched = false) THEN
    -- Get lesson points
    SELECT points INTO lesson_points
    FROM academy_lessons
    WHERE id = NEW.lesson_id;
    
    -- Add points to user profile
    UPDATE profiles
    SET points = points + COALESCE(lesson_points, 0)
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to execute automatically
CREATE TRIGGER on_lesson_completed
  AFTER INSERT OR UPDATE ON user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION add_lesson_points();
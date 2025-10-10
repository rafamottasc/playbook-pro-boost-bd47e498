-- Create function to update team in daily_mood when profile team changes
CREATE OR REPLACE FUNCTION public.sync_daily_mood_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if team actually changed
  IF (OLD.team IS DISTINCT FROM NEW.team) THEN
    -- Update all daily_mood records for this user with the new team
    UPDATE public.daily_mood
    SET team = NEW.team
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS sync_mood_team_on_profile_update ON public.profiles;

CREATE TRIGGER sync_mood_team_on_profile_update
  AFTER UPDATE OF team ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_daily_mood_team();
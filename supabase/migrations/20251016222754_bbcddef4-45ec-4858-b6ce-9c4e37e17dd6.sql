-- Fix Security Warnings

-- 1. Remove SECURITY DEFINER from view (não é necessário para views)
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.avatar_url,
  p.approved,
  p.blocked,
  p.team,
  p.whatsapp,
  p.gender,
  p.points,
  p.created_at,
  p.last_sign_in_at,
  COALESCE(
    (SELECT json_agg(ur.role) 
     FROM public.user_roles ur 
     WHERE ur.user_id = p.id),
    '[]'::json
  ) as roles,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin')
    THEN true
    ELSE false
  END as is_admin
FROM public.profiles p;

-- 2. Fix search_path for get_mood_metrics function
CREATE OR REPLACE FUNCTION public.get_mood_metrics(
  days_period INTEGER DEFAULT 30,
  limit_records INTEGER DEFAULT 50,
  offset_records INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  total_users INTEGER;
  participation_count INTEGER;
  avg_mood NUMERIC;
  difficult_count INTEGER;
  mood_distribution JSON;
  team_moods JSON;
  recent_moods JSON;
  total_mood_records INTEGER;
BEGIN
  -- Get total approved users
  SELECT COUNT(*) INTO total_users
  FROM public.profiles
  WHERE approved = true;

  -- Get participation today
  SELECT COUNT(DISTINCT user_id) INTO participation_count
  FROM public.daily_mood
  WHERE date = CURRENT_DATE;

  -- Calculate average mood
  SELECT AVG(
    CASE mood
      WHEN 'great' THEN 5
      WHEN 'good' THEN 4
      WHEN 'okay' THEN 3
      WHEN 'bad' THEN 2
      WHEN 'terrible' THEN 1
      ELSE 3
    END
  ) INTO avg_mood
  FROM public.daily_mood
  WHERE created_at >= NOW() - (days_period || ' days')::INTERVAL;

  -- Count difficult moods
  SELECT COUNT(*) INTO difficult_count
  FROM public.daily_mood
  WHERE mood IN ('bad', 'terrible')
    AND created_at >= NOW() - (days_period || ' days')::INTERVAL;

  -- Get mood distribution
  SELECT json_object_agg(mood, count) INTO mood_distribution
  FROM (
    SELECT mood, COUNT(*) as count
    FROM public.daily_mood
    WHERE created_at >= NOW() - (days_period || ' days')::INTERVAL
    GROUP BY mood
  ) t;

  -- Get team moods
  SELECT json_agg(
    json_build_object(
      'team', team,
      'averageMood', avg_mood_value
    )
  ) INTO team_moods
  FROM (
    SELECT 
      team,
      AVG(
        CASE mood
          WHEN 'great' THEN 5
          WHEN 'good' THEN 4
          WHEN 'okay' THEN 3
          WHEN 'bad' THEN 2
          WHEN 'terrible' THEN 1
          ELSE 3
        END
      ) as avg_mood_value
    FROM public.daily_mood
    WHERE created_at >= NOW() - (days_period || ' days')::INTERVAL
      AND team IS NOT NULL
    GROUP BY team
  ) t;

  -- Get total count of mood records for pagination
  SELECT COUNT(*) INTO total_mood_records
  FROM public.daily_mood dm
  WHERE dm.created_at >= NOW() - (days_period || ' days')::INTERVAL;

  -- Get recent moods with user info (paginated)
  SELECT json_agg(
    json_build_object(
      'user_id', dm.user_id,
      'mood', dm.mood,
      'date', dm.date,
      'team', dm.team,
      'created_at', dm.created_at,
      'full_name', p.full_name
    )
  ) INTO recent_moods
  FROM (
    SELECT *
    FROM public.daily_mood
    WHERE created_at >= NOW() - (days_period || ' days')::INTERVAL
    ORDER BY created_at DESC
    LIMIT limit_records
    OFFSET offset_records
  ) dm
  LEFT JOIN public.profiles p ON p.id = dm.user_id;

  -- Build final result
  result := json_build_object(
    'summary', json_build_object(
      'totalUsers', total_users,
      'participationToday', participation_count,
      'averageMood', COALESCE(ROUND(avg_mood, 2), 0),
      'difficultCount', difficult_count,
      'moodDistribution', COALESCE(mood_distribution, '{}'::json),
      'teamMoods', COALESCE(team_moods, '[]'::json)
    ),
    'recentMoods', COALESCE(recent_moods, '[]'::json),
    'totalRecords', total_mood_records
  );

  RETURN result;
END;
$$;
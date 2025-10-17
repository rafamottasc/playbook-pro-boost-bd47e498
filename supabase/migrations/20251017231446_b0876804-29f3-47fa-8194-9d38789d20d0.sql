-- Corrigir ordenação na função get_mood_metrics
CREATE OR REPLACE FUNCTION public.get_mood_metrics(
  days_period integer DEFAULT 30, 
  limit_records integer DEFAULT 50, 
  offset_records integer DEFAULT 0,
  filter_user_id uuid DEFAULT NULL,
  filter_team text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      WHEN 'otimo' THEN 5
      WHEN 'bem' THEN 4
      WHEN 'neutro' THEN 3
      WHEN 'cansado' THEN 2
      WHEN 'dificil' THEN 1
      ELSE 3
    END
  ) INTO avg_mood
  FROM public.daily_mood
  WHERE created_at >= NOW() - (days_period || ' days')::INTERVAL;

  -- Count difficult moods
  SELECT COUNT(*) INTO difficult_count
  FROM public.daily_mood
  WHERE mood IN ('cansado', 'dificil')
    AND created_at >= NOW() - (days_period || ' days')::INTERVAL;

  -- Get mood distribution
  SELECT json_object_agg(mood, count) INTO mood_distribution
  FROM (
    SELECT mood, COUNT(*) as count
    FROM public.daily_mood
    WHERE created_at >= NOW() - (days_period || ' days')::INTERVAL
    GROUP BY mood
  ) t;

  -- Get team moods with vote count (ordenar times alfabeticamente)
  SELECT json_agg(
    json_build_object(
      'team', team,
      'averageMood', avg_mood_value,
      'voteCount', vote_count
    ) ORDER BY team
  ) INTO team_moods
  FROM (
    SELECT 
      team,
      COUNT(*) as vote_count,
      AVG(
        CASE mood
          WHEN 'otimo' THEN 5
          WHEN 'bem' THEN 4
          WHEN 'neutro' THEN 3
          WHEN 'cansado' THEN 2
          WHEN 'dificil' THEN 1
          ELSE 3
        END
      ) as avg_mood_value
    FROM public.daily_mood
    WHERE created_at >= NOW() - (days_period || ' days')::INTERVAL
      AND team IS NOT NULL
    GROUP BY team
  ) t;

  -- Get total count of mood records for pagination (WITH FILTERS)
  SELECT COUNT(*) INTO total_mood_records
  FROM public.daily_mood dm
  WHERE dm.created_at >= NOW() - (days_period || ' days')::INTERVAL
    AND (filter_user_id IS NULL OR dm.user_id = filter_user_id)
    AND (filter_team IS NULL OR dm.team = filter_team);

  -- Get recent moods with user info (paginated WITH FILTERS)
  -- CORREÇÃO: ORDER BY dentro do json_agg para garantir ordenação
  SELECT json_agg(
    json_build_object(
      'user_id', dm.user_id,
      'mood', dm.mood,
      'date', dm.date,
      'team', dm.team,
      'created_at', dm.created_at,
      'full_name', p.full_name
    ) ORDER BY dm.created_at DESC
  ) INTO recent_moods
  FROM (
    SELECT *
    FROM public.daily_mood
    WHERE created_at >= NOW() - (days_period || ' days')::INTERVAL
      AND (filter_user_id IS NULL OR user_id = filter_user_id)
      AND (filter_team IS NULL OR team = filter_team)
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
$function$;
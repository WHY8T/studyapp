-- ============================================================
-- Helper Functions / RPCs
-- Run in Supabase SQL Editor
-- ============================================================

-- Increment subject study minutes
CREATE OR REPLACE FUNCTION increment_subject_minutes(sid UUID, mins INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE subjects SET total_minutes = total_minutes + mins WHERE id = sid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get leaderboard with rank
CREATE OR REPLACE FUNCTION get_leaderboard(order_by TEXT DEFAULT 'xp', limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  xp INTEGER,
  level INTEGER,
  streak_current INTEGER,
  total_study_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY
      CASE WHEN order_by = 'xp' THEN p.xp
           WHEN order_by = 'streak' THEN p.streak_current
           ELSE p.total_study_minutes
      END DESC
    ) AS rank,
    p.id, p.username, p.full_name, p.avatar_url,
    p.xp, p.level, p.streak_current, p.total_study_minutes
  FROM profiles p
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user daily stats
CREATE OR REPLACE FUNCTION get_daily_stats(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  study_minutes INTEGER,
  pomodoros_completed INTEGER,
  todos_completed INTEGER,
  xp_earned INTEGER
) AS $$
DECLARE
  day_start TIMESTAMPTZ;
  day_end TIMESTAMPTZ;
BEGIN
  day_start := target_date::TIMESTAMPTZ;
  day_end := (target_date + INTERVAL '1 day')::TIMESTAMPTZ;

  RETURN QUERY
  SELECT
    COALESCE(SUM(ps.duration_minutes), 0)::INTEGER AS study_minutes,
    COUNT(ps.id)::INTEGER AS pomodoros_completed,
    (SELECT COUNT(*)::INTEGER FROM todos t
     WHERE t.user_id = user_uuid AND t.completed = true
     AND t.completed_at >= day_start AND t.completed_at < day_end),
    (SELECT COALESCE(SUM(xt.amount), 0)::INTEGER FROM xp_transactions xt
     WHERE xt.user_id = user_uuid
     AND xt.created_at >= day_start AND xt.created_at < day_end)
  FROM pomodoro_sessions ps
  WHERE ps.user_id = user_uuid
    AND ps.completed = true
    AND ps.started_at >= day_start
    AND ps.started_at < day_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

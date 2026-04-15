-- ============================================================
-- StudyFlow Database Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  level INTEGER DEFAULT 1 NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  total_study_minutes INTEGER DEFAULT 0 NOT NULL,
  streak_current INTEGER DEFAULT 0 NOT NULL,
  streak_longest INTEGER DEFAULT 0 NOT NULL,
  streak_last_study DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#00b7ff',
  icon TEXT DEFAULT 'BookOpen',
  total_minutes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- POMODORO SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  break_minutes INTEGER DEFAULT 5 NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TODOS / TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium' NOT NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  xp_reward INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- STUDY SESSIONS / CALENDAR EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS study_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('study', 'exam', 'assignment', 'reminder')) DEFAULT 'study' NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  pdf_url TEXT,
  pdf_filename TEXT,
  question_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of { text: string, correct: boolean }
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, -- percentage 0-100
  answers JSONB NOT NULL, -- { question_id: selected_option_index }
  time_taken_seconds INTEGER,
  xp_earned INTEGER DEFAULT 0 NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- ACHIEVEMENTS / BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT CHECK (category IN ('study', 'streak', 'social', 'quiz', 'special')) NOT NULL,
  xp_reward INTEGER DEFAULT 50 NOT NULL,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common' NOT NULL,
  requirement_type TEXT NOT NULL, -- e.g. 'total_minutes', 'streak_days', 'quiz_score', etc.
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- DAILY CHALLENGES
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'pomodoro_count', 'study_minutes', 'complete_todos', 'quiz_score'
  target_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 100 NOT NULL,
  active_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0 NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

-- ============================================================
-- SOCIAL - FRIENDSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- ============================================================
-- XP TRANSACTIONS (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT, -- 'pomodoro', 'todo', 'quiz', 'achievement', 'challenge', 'streak'
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pomodoro_user_date ON pomodoro_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON todos(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_study_events_user_date ON study_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(requester_id, addressee_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, only edit their own
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Subjects: own only
CREATE POLICY "subjects_own" ON subjects USING (auth.uid() = user_id);
CREATE POLICY "subjects_insert" ON subjects FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pomodoro sessions: own only
CREATE POLICY "pomodoro_own" ON pomodoro_sessions USING (auth.uid() = user_id);
CREATE POLICY "pomodoro_insert" ON pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Todos: own only
CREATE POLICY "todos_own" ON todos USING (auth.uid() = user_id);
CREATE POLICY "todos_insert" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study events: own only
CREATE POLICY "events_own" ON study_events USING (auth.uid() = user_id);
CREATE POLICY "events_insert" ON study_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quizzes: own only
CREATE POLICY "quizzes_own" ON quizzes USING (auth.uid() = user_id);
CREATE POLICY "quizzes_insert" ON quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quiz questions: accessible via quiz ownership
CREATE POLICY "quiz_questions_select" ON quiz_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid())
);
CREATE POLICY "quiz_questions_insert" ON quiz_questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid())
);

-- Quiz attempts: own only
CREATE POLICY "quiz_attempts_own" ON quiz_attempts USING (auth.uid() = user_id);
CREATE POLICY "quiz_attempts_insert" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements: readable by all, owned by users
CREATE POLICY "achievements_select" ON achievements FOR SELECT USING (true);

-- User achievements: select friends' achievements too
CREATE POLICY "user_achievements_select" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "user_achievements_insert" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenge progress: own only
CREATE POLICY "challenge_progress_own" ON user_challenge_progress USING (auth.uid() = user_id);
CREATE POLICY "challenge_progress_insert" ON user_challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friendships: visible to both parties
CREATE POLICY "friendships_select" ON friendships FOR SELECT USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);
CREATE POLICY "friendships_insert" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_update" ON friendships FOR UPDATE USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);

-- XP transactions: own only
CREATE POLICY "xp_transactions_own" ON xp_transactions USING (auth.uid() = user_id);
CREATE POLICY "xp_transactions_insert" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA - Achievements
-- ============================================================
INSERT INTO achievements (id, name, description, icon, category, xp_reward, rarity, requirement_type, requirement_value) VALUES
  ('first_session', 'First Steps', 'Complete your first study session', 'Zap', 'study', 25, 'common', 'pomodoro_count', 1),
  ('study_hour', 'Hour Scholar', 'Study for 1 hour total', 'Clock', 'study', 50, 'common', 'total_minutes', 60),
  ('study_day', 'Full Day Scholar', 'Study for 8 hours total', 'Sun', 'study', 100, 'rare', 'total_minutes', 480),
  ('study_week', 'Week Warrior', 'Study for 40 hours total', 'Calendar', 'study', 300, 'epic', 'total_minutes', 2400),
  ('streak_3', 'Consistent', 'Maintain a 3-day streak', 'Flame', 'streak', 75, 'common', 'streak_days', 3),
  ('streak_7', 'On Fire', 'Maintain a 7-day streak', 'Flame', 'streak', 200, 'rare', 'streak_days', 7),
  ('streak_30', 'Unstoppable', 'Maintain a 30-day streak', 'Trophy', 'streak', 1000, 'legendary', 'streak_days', 30),
  ('quiz_ace', 'Quiz Ace', 'Score 100% on a quiz', 'Star', 'quiz', 150, 'rare', 'quiz_perfect', 1),
  ('quiz_master', 'Quiz Master', 'Complete 10 quizzes', 'Brain', 'quiz', 500, 'epic', 'quiz_count', 10),
  ('social_butterfly', 'Social Butterfly', 'Add 5 friends', 'Users', 'social', 100, 'rare', 'friend_count', 5),
  ('first_friend', 'Not Alone', 'Add your first friend', 'UserPlus', 'social', 30, 'common', 'friend_count', 1),
  ('todo_100', 'Task Crusher', 'Complete 100 tasks', 'CheckSquare', 'study', 400, 'epic', 'todo_completed', 100),
  ('level_5', 'Rising Star', 'Reach level 5', 'TrendingUp', 'special', 200, 'rare', 'level', 5),
  ('level_10', 'Scholar Elite', 'Reach level 10', 'Crown', 'special', 500, 'epic', 'level', 10),
  ('night_owl', 'Night Owl', 'Study after midnight', 'Moon', 'special', 75, 'common', 'night_session', 1)
ON CONFLICT (id) DO NOTHING;

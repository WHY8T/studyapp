-- ============================================================
-- Work Showcase: students can share their work (papers, reports, etc.)
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS work_showcases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'paper',     -- 'paper' | 'project' | 'research' | 'presentation' | 'other'
  subject TEXT,
  file_url TEXT,
  external_url TEXT,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS work_showcases_user_id_idx ON work_showcases(user_id);
CREATE INDEX IF NOT EXISTS work_showcases_public_idx ON work_showcases(is_public) WHERE is_public = TRUE;

-- RLS
ALTER TABLE work_showcases ENABLE ROW LEVEL SECURITY;

-- Public showcases are visible to everyone (authenticated)
CREATE POLICY "Public showcases visible to authenticated users"
  ON work_showcases FOR SELECT
  TO authenticated
  USING (is_public = TRUE OR auth.uid() = user_id);

-- Users can only insert their own showcases
CREATE POLICY "Users can insert own showcases"
  ON work_showcases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own showcases
CREATE POLICY "Users can update own showcases"
  ON work_showcases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own showcases
CREATE POLICY "Users can delete own showcases"
  ON work_showcases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_work_showcases_updated_at
  BEFORE UPDATE ON work_showcases
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

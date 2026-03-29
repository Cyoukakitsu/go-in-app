-- Create universities table
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ja TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  type TEXT CHECK (type IN ('国立', '公立', '私立')) NOT NULL,
  departments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create university_schedules table
CREATE TABLE university_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  application_start DATE,
  application_end DATE,
  exam_date DATE,
  result_date DATE,
  year INT NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_bookmarks table
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES university_schedules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'applied', 'examined', 'passed', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- universities: Anyone can view
CREATE POLICY "Anyone can view universities"
  ON universities FOR SELECT
  USING (true);

-- university_schedules: Anyone can view
CREATE POLICY "Anyone can view schedules"
  ON university_schedules FOR SELECT
  USING (true);

-- user_bookmarks: Only authenticated users can manage their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON user_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON user_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON user_bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON user_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

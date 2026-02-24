-- Create topic_categories table
CREATE TABLE IF NOT EXISTS topic_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert existing categories
INSERT INTO topic_categories (name) VALUES
  ('الحمل والولادة'),
  ('تربية الأطفال'),
  ('الصحة والتغذية'),
  ('كل ما يخص اطفال التوحد'),
  ('أخرى')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE topic_categories ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read categories
CREATE POLICY "Anyone can read categories" ON topic_categories
  FOR SELECT USING (true);

-- Only admins can insert/update/delete categories
CREATE POLICY "Admins can manage categories" ON topic_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Create topic_subcategories table
CREATE TABLE IF NOT EXISTS topic_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, category_name)
);

-- Add subcategory column to topics table
ALTER TABLE topics ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Enable RLS
ALTER TABLE topic_subcategories ENABLE ROW LEVEL SECURITY;

-- Allow all users to read subcategories
CREATE POLICY "Anyone can read subcategories" ON topic_subcategories
  FOR SELECT USING (true);

-- Only admins can manage subcategories
CREATE POLICY "Admins can manage subcategories" ON topic_subcategories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

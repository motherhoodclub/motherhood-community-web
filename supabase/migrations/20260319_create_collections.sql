-- Create collections table (admin-curated groups of topics)
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for collection <-> topics (many-to-many)
CREATE TABLE IF NOT EXISTS collection_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, topic_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_collection_topics_collection_id ON collection_topics(collection_id);
CREATE INDEX idx_collection_topics_topic_id ON collection_topics(topic_id);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_topics ENABLE ROW LEVEL SECURITY;

-- Collections: public read, admin-only write
CREATE POLICY "Anyone can read collections" ON collections
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage collections" ON collections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Collection topics: public read, admin-only write
CREATE POLICY "Anyone can read collection topics" ON collection_topics
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage collection topics" ON collection_topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

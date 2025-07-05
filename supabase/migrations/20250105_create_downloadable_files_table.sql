-- Create downloadable_files table
CREATE TABLE IF NOT EXISTS downloadable_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    featured_image_url TEXT,
    file_url TEXT,
    file_drive_link TEXT,
    file_type TEXT,
    file_size BIGINT,
    download_count INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE downloadable_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view downloadable files" ON downloadable_files
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert downloadable files" ON downloadable_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND (user_profiles.is_admin = true OR user_profiles.is_admin = 'true' OR user_profiles.is_admin = 1 OR user_profiles.is_admin = '1')
        )
    );

CREATE POLICY "Admins can update downloadable files" ON downloadable_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND (user_profiles.is_admin = true OR user_profiles.is_admin = 'true' OR user_profiles.is_admin = 1 OR user_profiles.is_admin = '1')
        )
    );

CREATE POLICY "Admins can delete downloadable files" ON downloadable_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND (user_profiles.is_admin = true OR user_profiles.is_admin = 'true' OR user_profiles.is_admin = 1 OR user_profiles.is_admin = '1')
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_downloadable_files_updated_at BEFORE UPDATE
    ON downloadable_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

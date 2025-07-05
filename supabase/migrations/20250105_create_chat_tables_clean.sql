-- Drop existing tables if they exist
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_presence CASCADE;

-- Create chat_messages table
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_presence table for tracking online users
CREATE TABLE chat_presence (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_presence_last_seen ON chat_presence(last_seen DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_presence ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_messages
CREATE POLICY "chat_messages_select_policy" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "chat_messages_insert_policy" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_messages_update_policy" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_delete_policy" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for chat_presence
CREATE POLICY "chat_presence_select_policy" ON chat_presence
    FOR SELECT USING (true);

CREATE POLICY "chat_presence_all_policy" ON chat_presence
    FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_presence_updated_at 
    BEFORE UPDATE ON chat_presence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_presence;

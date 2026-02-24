-- Create banned_chat_users table for tracking users banned from chat
CREATE TABLE IF NOT EXISTS banned_chat_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    banned_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for quick lookups
CREATE INDEX idx_banned_chat_users_user_id ON banned_chat_users(user_id);

-- Enable RLS
ALTER TABLE banned_chat_users ENABLE ROW LEVEL SECURITY;

-- Everyone can read banned status (needed to check if user is banned)
CREATE POLICY "banned_chat_users_select_policy" ON banned_chat_users
    FOR SELECT USING (true);

-- Only admins can ban/unban users
CREATE POLICY "banned_chat_users_insert_policy" ON banned_chat_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

CREATE POLICY "banned_chat_users_delete_policy" ON banned_chat_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- Update chat_messages delete policy to allow admins to delete any message
DROP POLICY IF EXISTS "chat_messages_delete_policy" ON chat_messages;
CREATE POLICY "chat_messages_delete_policy" ON chat_messages
    FOR DELETE USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- Update chat_messages insert policy to block banned users
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;
CREATE POLICY "chat_messages_insert_policy" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM banned_chat_users
            WHERE banned_chat_users.user_id = auth.uid()
        )
    );

-- Enable realtime for banned_chat_users
ALTER PUBLICATION supabase_realtime ADD TABLE banned_chat_users;

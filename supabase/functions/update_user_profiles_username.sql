-- Function to update user_profiles username from auth.users metadata
CREATE OR REPLACE FUNCTION update_user_profiles_username()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    display_name_value TEXT;
    fallback_username TEXT;
BEGIN
    -- Loop through all users in auth.users
    FOR user_record IN 
        SELECT 
            au.id,
            au.raw_user_meta_data,
            au.email,
            au.phone,
            up.username as current_username
        FROM auth.users au
        LEFT JOIN public.user_profiles up ON au.id = up.id
        WHERE up.username IS NULL OR up.username = ''
    LOOP
        -- Initialize display_name_value
        display_name_value := NULL;
        
        -- Try to extract display name from raw_user_meta_data
        IF user_record.raw_user_meta_data IS NOT NULL THEN
            -- Try 'full_name' first, then 'name', then 'display_name'
            IF user_record.raw_user_meta_data->>'full_name' IS NOT NULL AND 
               user_record.raw_user_meta_data->>'full_name' != '' THEN
                display_name_value := user_record.raw_user_meta_data->>'full_name';
            ELSIF user_record.raw_user_meta_data->>'name' IS NOT NULL AND 
                  user_record.raw_user_meta_data->>'name' != '' THEN
                display_name_value := user_record.raw_user_meta_data->>'name';
            ELSIF user_record.raw_user_meta_data->>'display_name' IS NOT NULL AND 
                  user_record.raw_user_meta_data->>'display_name' != '' THEN
                display_name_value := user_record.raw_user_meta_data->>'display_name';
            END IF;
        END IF;
        
        -- If no display name found, create a fallback
        IF display_name_value IS NULL OR display_name_value = '' THEN
            IF user_record.email IS NOT NULL THEN
                -- Use part of email before @ as fallback
                fallback_username := split_part(user_record.email, '@', 1);
            ELSIF user_record.phone IS NOT NULL THEN
                -- Use last 8 digits of phone as fallback
                fallback_username := 'user_' || right(user_record.phone, 8);
            ELSE
                -- Use user ID as last resort
                fallback_username := 'user_' || substring(user_record.id::text, 1, 8);
            END IF;
            display_name_value := fallback_username;
        END IF;
        
        -- Update or insert the user profile
        INSERT INTO public.user_profiles (id, username, created_at, updated_at, is_admin)
        VALUES (
            user_record.id,
            display_name_value,
            COALESCE((SELECT created_at FROM public.user_profiles WHERE id = user_record.id), NOW()),
            NOW(),
            COALESCE((SELECT is_admin FROM public.user_profiles WHERE id = user_record.id), false)
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
            username = EXCLUDED.username,
            updated_at = NOW()
        WHERE user_profiles.username IS NULL OR user_profiles.username = '';
        
        RAISE NOTICE 'Updated username for user %: %', user_record.id, display_name_value;
    END LOOP;
END;
$$;

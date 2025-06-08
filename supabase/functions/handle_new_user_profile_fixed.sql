-- Updated function to handle new user profile creation with duplicate username handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    display_name_value TEXT;
    fallback_username TEXT;
    final_username TEXT;
    username_counter INTEGER;
    username_exists BOOLEAN;
BEGIN
    -- Initialize display_name_value
    display_name_value := NULL;
    
    -- Try to extract display name from raw_user_meta_data
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        -- Try 'full_name' first, then 'name', then 'display_name'
        IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL AND 
           NEW.raw_user_meta_data->>'full_name' != '' THEN
            display_name_value := NEW.raw_user_meta_data->>'full_name';
        ELSIF NEW.raw_user_meta_data->>'name' IS NOT NULL AND 
              NEW.raw_user_meta_data->>'name' != '' THEN
            display_name_value := NEW.raw_user_meta_data->>'name';
        ELSIF NEW.raw_user_meta_data->>'display_name' IS NOT NULL AND 
              NEW.raw_user_meta_data->>'display_name' != '' THEN
            display_name_value := NEW.raw_user_meta_data->>'display_name';
        END IF;
    END IF;
    
    -- If no display name found, create a fallback
    IF display_name_value IS NULL OR display_name_value = '' THEN
        IF NEW.email IS NOT NULL THEN
            -- Use part of email before @ as fallback
            fallback_username := split_part(NEW.email, '@', 1);
        ELSIF NEW.phone IS NOT NULL THEN
            -- Use last 8 digits of phone as fallback
            fallback_username := 'user_' || right(NEW.phone, 8);
        ELSE
            -- Use user ID as last resort
            fallback_username := 'user_' || substring(NEW.id::text, 1, 8);
        END IF;
        display_name_value := fallback_username;
    END IF;
    
    -- Handle duplicate usernames by adding a counter
    final_username := display_name_value;
    username_counter := 1;
    
    -- Check if username already exists
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE username = final_username
    ) INTO username_exists;
    
    -- If username exists, add counter until we find a unique one
    WHILE username_exists LOOP
        username_counter := username_counter + 1;
        final_username := display_name_value || '_' || username_counter;
        
        SELECT EXISTS(
            SELECT 1 FROM public.user_profiles 
            WHERE username = final_username
        ) INTO username_exists;
    END LOOP;
    
    -- Insert the user profile with unique username
    INSERT INTO public.user_profiles (id, username, created_at, updated_at, is_admin)
    VALUES (NEW.id, final_username, NOW(), NOW(), false);
    
    RETURN NEW;
END;
$$;

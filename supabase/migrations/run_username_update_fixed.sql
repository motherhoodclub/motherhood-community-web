-- Run the updated function to update existing users' usernames
SELECT update_user_profiles_username();

-- Verify the results
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name_from_auth,
    au.raw_user_meta_data->>'name' as name_from_auth,
    up.username as updated_username
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY up.created_at DESC
LIMIT 10;

-- Check for any remaining NULL usernames
SELECT COUNT(*) as users_with_null_username
FROM public.user_profiles 
WHERE username IS NULL OR username = '';

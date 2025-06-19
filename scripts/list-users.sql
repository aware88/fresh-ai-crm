-- List all users in the auth.users table
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

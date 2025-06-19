-- Check if RLS is enabled on the interactions table
SELECT 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'interactions';

-- Alternative way to check RLS
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'interactions' 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- List all policies on the interactions table
SELECT * FROM pg_policies 
WHERE tablename = 'interactions' 
AND schemaname = 'public';

-- Check if the current user has the necessary permissions
SELECT 
    rolname,
    rolsuper,
    rolcreaterole,
    rolcreatedb,
    rolinherit
FROM pg_roles 
WHERE rolname = current_user;

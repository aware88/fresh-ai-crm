-- Deep RLS Diagnostic Script
-- This script helps diagnose why RLS SELECT policies might not be working

-- 1. Check if RLS is enabled on the interactions table
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as row_security_enabled,
  c.relforcerowsecurity as force_row_security
FROM 
  pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE 
  c.relname = 'interactions';

-- 2. Check the current RLS policies with more details
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  p.polname as policy_name,
  CASE WHEN p.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as policy_type,
  CASE p.polcmd 
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  pg_get_expr(p.polqual, p.polrelid) as using_expression,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expression,
  array_to_string(array(
    SELECT pg_get_userbyid(roleid)
    FROM unnest(p.polroles) as roleid
  ), ', ') as roles
FROM 
  pg_policy p
  JOIN pg_class c ON p.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE 
  c.relname = 'interactions';

-- 3. Check the data types of the created_by column and related columns
SELECT 
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale
FROM 
  information_schema.columns c
WHERE 
  c.table_name = 'interactions' AND
  c.column_name IN ('id', 'created_by', 'contact_id');

-- 4. Check if there are any NULL values in created_by
SELECT 
  COUNT(*) as total_rows,
  COUNT(created_by) as non_null_created_by,
  COUNT(*) - COUNT(created_by) as null_created_by,
  COUNT(DISTINCT created_by) as distinct_created_by_values
FROM 
  interactions;

-- 5. Check the actual values in created_by
SELECT 
  created_by, 
  COUNT(*) as count
FROM 
  interactions
GROUP BY 
  created_by
ORDER BY 
  count DESC
LIMIT 10;

-- 6. Check if the auth.uid() function exists and what it returns
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  l.lanname as language,
  pg_get_functiondef(p.oid) as function_definition
FROM 
  pg_proc p
  JOIN pg_language l ON p.prolang = l.oid
WHERE 
  proname = 'uid';

-- 7. Test the auth.uid() function directly
-- Note: This will only work if you're authenticated as a user
DO $$
DECLARE
  auth_uid_result UUID;
  auth_uid_text TEXT;
  auth_uid_type TEXT;
BEGIN
  BEGIN
    -- Try to get the current user's ID
    SELECT auth.uid() INTO auth_uid_result;
    auth_uid_text := auth_uid_result::TEXT;
    auth_uid_type := 'UUID';
    
    RAISE NOTICE 'auth.uid() returned: % (type: %)', auth_uid_text, auth_uid_type;
    
    -- Check if the user has any interactions
    PERFORM 1 FROM interactions WHERE created_by = auth_uid_result LIMIT 1;
    IF FOUND THEN
      RAISE NOTICE 'User % has interactions in the database', auth_uid_text;
    ELSE
      RAISE NOTICE 'User % has NO interactions in the database', auth_uid_text;
    END IF;
    
    -- Check the type of created_by in the first row (if any)
    BEGIN
      SELECT pg_typeof(created_by)::TEXT 
      INTO auth_uid_type
      FROM interactions 
      LIMIT 1;
      
      RAISE NOTICE 'Type of created_by in interactions table: %', auth_uid_type;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not determine type of created_by: %', SQLERRM;
    END;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error calling auth.uid(): %', SQLERRM;
  END;
END $$;

-- 8. Create a test function to check RLS behavior
CREATE OR REPLACE FUNCTION test_rls_behavior() 
RETURNS TABLE (
  test_name TEXT,
  result TEXT,
  details TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Test 1: Check if we can see any rows without RLS
  RETURN QUERY 
  SELECT 
    'Direct query without RLS' as test_name,
    (SELECT COUNT(*)::TEXT FROM interactions) as result,
    'Should return total count of interactions' as details;
  
  -- Test 2: Check if we can see rows with RLS
  RETURN QUERY 
  SELECT 
    'Query with RLS' as test_name,
    (SELECT COUNT(*)::TEXT FROM (SELECT * FROM interactions) t) as result,
    'Should return count of interactions visible to current user' as details;
  
  -- Test 3: Check if we can see our own rows
  RETURN QUERY 
  SELECT 
    'Query for own interactions' as test_name,
    (SELECT COUNT(*)::TEXT FROM interactions WHERE created_by = auth.uid()) as result,
    'Should return count of interactions for current user' as details;
  
  -- Test 4: Check the type of auth.uid()
  BEGIN
    RETURN QUERY 
    SELECT 
      'Type of auth.uid()' as test_name,
      pg_typeof(auth.uid())::TEXT as result,
      'Should be uuid' as details;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY 
    SELECT 
      'Type of auth.uid()' as test_name,
      'Error: ' || SQLERRM as result,
      'Failed to get type' as details;
  END;
END;
$$;

-- Run the test function
SELECT * FROM test_rls_behavior();

-- 9. Check if there are any triggers that might be affecting the data
SELECT 
  t.tgname as trigger_name,
  n.nspname as schema_name,
  c.relname as table_name,
  pg_get_triggerdef(t.oid) as definition,
  t.tgenabled as is_enabled
FROM 
  pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE 
  c.relname = 'interactions';

-- 10. Check for any row-level security bypass settings
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  c.reloptions as table_options
FROM 
  pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE 
  c.relname = 'interactions' AND
  c.reloptions IS NOT NULL;

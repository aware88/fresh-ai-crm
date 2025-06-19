-- Test RLS policies using SQL functions
-- This approach uses set_config to simulate different authenticated users

-- Step 1: Create a function to test RLS as a specific user
CREATE OR REPLACE FUNCTION test_rls_as_user(user_id uuid)
RETURNS TABLE (
  test_name text,
  result boolean,
  details text
) AS $$
DECLARE
  interaction_id uuid;
  contact_id text;
  row_count int;
  test_result boolean;
  test_details text;
BEGIN
  -- Get an existing contact ID
  SELECT id INTO contact_id FROM contacts LIMIT 1;
  
  -- Create a test interaction with the specified user_id
  interaction_id := gen_random_uuid();
  INSERT INTO interactions (id, contact_id, type, title, content, created_by)
  VALUES (interaction_id, contact_id, 'email', 'RLS Test', 'Testing RLS policies', user_id);
  
  -- Test 1: Anonymous access (should return 0 rows)
  test_name := 'Anonymous access blocked';
  
  -- Reset to anonymous role
  PERFORM set_config('role', 'anon', true);
  
  SELECT COUNT(*) INTO row_count FROM interactions;
  test_result := (row_count = 0);
  test_details := 'Expected 0 rows, got ' || row_count;
  RETURN QUERY SELECT test_name, test_result, test_details;
  
  -- Test 2: Authenticated as the owner (should see own interaction)
  test_name := 'Owner can see own interaction';
  
  -- Set role to authenticated and auth.uid to the user_id
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
  
  SELECT COUNT(*) INTO row_count FROM interactions WHERE id = interaction_id;
  test_result := (row_count = 1);
  test_details := 'Expected 1 row, got ' || row_count;
  RETURN QUERY SELECT test_name, test_result, test_details;
  
  -- Test 3: Authenticated as different user (should not see interaction)
  test_name := 'Other user cannot see interaction';
  
  -- Set auth.uid to a different UUID
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
  
  SELECT COUNT(*) INTO row_count FROM interactions WHERE id = interaction_id;
  test_result := (row_count = 0);
  test_details := 'Expected 0 rows, got ' || row_count;
  RETURN QUERY SELECT test_name, test_result, test_details;
  
  -- Clean up
  DELETE FROM interactions WHERE id = interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Run the test with the valid user ID
SELECT * FROM test_rls_as_user('c636144d-fb35-467a-b626-fb2b07dc97b7'::uuid);

-- Step 3: Check the current RLS policy definitions
SELECT tablename, policyname, cmd, roles, 
       pg_get_expr(qual, oid) as using_expr,
       pg_get_expr(with_check, oid) as with_check_expr
FROM pg_policy
WHERE tablename = 'interactions';

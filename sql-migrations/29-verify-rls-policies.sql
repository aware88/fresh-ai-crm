-- Verify RLS policies on the interactions table

-- Step 1: Check if RLS is enabled on the interactions table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'interactions';

-- Step 2: Check the current RLS policy definitions
SELECT tablename, policyname, cmd, roles, 
       pg_get_expr(qual, oid) as using_expr,
       pg_get_expr(with_check, oid) as with_check_expr
FROM pg_policy
WHERE tablename = 'interactions';

-- Step 3: Check the data types of the created_by column
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'interactions' AND 
  column_name = 'created_by';

-- Step 4: Check if there are any NULL values in created_by
SELECT COUNT(*) FROM interactions WHERE created_by IS NULL;

-- Step 5: Check the type returned by auth.uid()
-- Create a function to check auth.uid() type
CREATE OR REPLACE FUNCTION check_auth_uid_type()
RETURNS TABLE (
  auth_uid_value text,
  auth_uid_type text
) AS $$
BEGIN
  RETURN QUERY SELECT 
    auth.uid()::text AS auth_uid_value,
    pg_typeof(auth.uid())::text AS auth_uid_type;
END;
$$ LANGUAGE plpgsql;

-- Run the function to check auth.uid() type
SELECT * FROM check_auth_uid_type();

-- Step 6: Test a direct comparison between auth.uid() and a UUID
-- Create a function to test the comparison
CREATE OR REPLACE FUNCTION test_uuid_comparison(user_id uuid)
RETURNS TABLE (
  test_name text,
  comparison_result boolean,
  auth_uid_value text,
  auth_uid_type text,
  user_id_value text,
  user_id_type text
) AS $$
BEGIN
  RETURN QUERY SELECT 
    'Direct comparison'::text AS test_name,
    auth.uid()::uuid = user_id AS comparison_result,
    auth.uid()::text AS auth_uid_value,
    pg_typeof(auth.uid())::text AS auth_uid_type,
    user_id::text AS user_id_value,
    pg_typeof(user_id)::text AS user_id_type;
    
  RETURN QUERY SELECT 
    'With explicit casting'::text AS test_name,
    auth.uid()::uuid = user_id::uuid AS comparison_result,
    auth.uid()::text AS auth_uid_value,
    pg_typeof(auth.uid()::uuid)::text AS auth_uid_type,
    user_id::text AS user_id_value,
    pg_typeof(user_id::uuid)::text AS user_id_type;
END;
$$ LANGUAGE plpgsql;

-- Run the function with the valid user ID
SELECT * FROM test_uuid_comparison('c636144d-fb35-467a-b626-fb2b07dc97b7'::uuid);

-- Step 7: Create a modified RLS policy that uses explicit type checking
-- First, drop the existing policies
DROP POLICY IF EXISTS "interactions_select_policy" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_policy" ON interactions;
DROP POLICY IF EXISTS "interactions_update_policy" ON interactions;
DROP POLICY IF EXISTS "interactions_delete_policy" ON interactions;

-- Create new policies with more explicit type handling
CREATE POLICY "interactions_select_policy" 
ON interactions FOR SELECT 
USING ((auth.uid())::uuid = created_by::uuid);

CREATE POLICY "interactions_insert_policy" 
ON interactions FOR INSERT 
WITH CHECK ((auth.uid())::uuid = created_by::uuid);

CREATE POLICY "interactions_update_policy" 
ON interactions FOR UPDATE 
USING ((auth.uid())::uuid = created_by::uuid);

CREATE POLICY "interactions_delete_policy" 
ON interactions FOR DELETE 
USING ((auth.uid())::uuid = created_by::uuid);

-- Step 8: Verify the updated policies
SELECT tablename, policyname, cmd, roles, 
       pg_get_expr(qual, oid) as using_expr,
       pg_get_expr(with_check, oid) as with_check_expr
FROM pg_policy
WHERE tablename = 'interactions';

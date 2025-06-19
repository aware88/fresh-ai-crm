-- Fix created_by values with a valid user ID
-- IMPORTANT: Replace 'YOUR_VALID_USER_ID' with an actual user ID from your auth.users table

-- Step 1: Check if there are NULL created_by values
SELECT COUNT(*) FROM interactions WHERE created_by IS NULL;

-- Step 2: Get a list of valid user IDs from the auth.users table
-- This will help you choose a valid ID to use
SELECT id FROM auth.users LIMIT 10;

-- Step 3: Update NULL values with a valid user ID
-- IMPORTANT: Replace 'YOUR_VALID_USER_ID' with an actual user ID from the previous query
-- UPDATE interactions 
-- SET created_by = 'YOUR_VALID_USER_ID'::uuid 
-- WHERE created_by IS NULL;

-- Step 4: Modify the trigger to handle NULL values safely
-- This trigger will only set created_by if auth.uid() returns a valid value
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set created_by if it's NULL and auth.uid() is not NULL
  IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.created_by = auth.uid()::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_created_by ON interactions;
CREATE TRIGGER ensure_created_by
BEFORE INSERT ON interactions
FOR EACH ROW
EXECUTE FUNCTION set_created_by();

-- Step 5: Verify the changes
SELECT COUNT(*) FROM interactions WHERE created_by IS NULL;

-- Step 6: Ensure RLS policies use proper UUID casting
DROP POLICY IF EXISTS "interactions_select_policy" ON interactions;
CREATE POLICY "interactions_select_policy" 
ON interactions FOR SELECT 
USING (auth.uid()::uuid = created_by);

DROP POLICY IF EXISTS "interactions_insert_policy" ON interactions;
CREATE POLICY "interactions_insert_policy" 
ON interactions FOR INSERT 
WITH CHECK (auth.uid()::uuid = created_by);

DROP POLICY IF EXISTS "interactions_update_policy" ON interactions;
CREATE POLICY "interactions_update_policy" 
ON interactions FOR UPDATE 
USING (auth.uid()::uuid = created_by);

DROP POLICY IF EXISTS "interactions_delete_policy" ON interactions;
CREATE POLICY "interactions_delete_policy" 
ON interactions FOR DELETE 
USING (auth.uid()::uuid = created_by);

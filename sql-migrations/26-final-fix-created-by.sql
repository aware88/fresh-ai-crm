-- Final fix for created_by values and RLS policies
-- This script uses the valid user ID provided by you

-- Step 1: Update NULL values with the valid user ID
UPDATE interactions 
SET created_by = 'c636144d-fb35-467a-b626-fb2b07dc97b7'::uuid 
WHERE created_by IS NULL;

-- Step 2: Modify the trigger to handle NULL values safely
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set created_by if it's NULL and auth.uid() is not NULL
  IF NEW.created_by IS NULL THEN
    -- Use auth.uid() if available, otherwise use the default user ID
    NEW.created_by = COALESCE(
      auth.uid()::uuid, 
      'c636144d-fb35-467a-b626-fb2b07dc97b7'::uuid
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_created_by ON interactions;
CREATE TRIGGER ensure_created_by
BEFORE INSERT ON interactions
FOR EACH ROW
EXECUTE FUNCTION set_created_by();

-- Step 3: Verify the changes
SELECT COUNT(*) FROM interactions WHERE created_by IS NULL;

-- Step 4: Ensure RLS policies use proper UUID casting
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

-- Step 5: Verify the policies
SELECT tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'interactions'
ORDER BY policyname;

-- Fix the created_by column in the interactions table
-- This version drops policies first, then alters the column, then recreates policies

-- First, check the current schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interactions' AND column_name = 'created_by';

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "interactions_select_policy" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_policy" ON interactions;
DROP POLICY IF EXISTS "interactions_update_policy" ON interactions;
DROP POLICY IF EXISTS "interactions_delete_policy" ON interactions;

-- Step 2: Now we can alter the column
ALTER TABLE interactions 
ALTER COLUMN created_by TYPE UUID USING created_by::uuid;

-- Step 3: Check for NULL values
SELECT COUNT(*) FROM interactions WHERE created_by IS NULL;

-- Step 4: Update any NULL values with a default admin UUID
-- Uncomment and replace with a real UUID if needed
-- UPDATE interactions SET created_by = '00000000-0000-0000-0000-000000000000'::uuid WHERE created_by IS NULL;

-- Step 5: Add NOT NULL constraint if desired
-- ALTER TABLE interactions ALTER COLUMN created_by SET NOT NULL;

-- Step 6: Add a trigger to automatically set created_by from auth.uid() if not provided
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
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

-- Step 7: Recreate the policies with explicit UUID casting
-- SELECT policy
CREATE POLICY "interactions_select_policy" 
ON interactions FOR SELECT 
USING (auth.uid()::uuid = created_by);

-- INSERT policy
CREATE POLICY "interactions_insert_policy" 
ON interactions FOR INSERT 
WITH CHECK (auth.uid()::uuid = created_by);

-- UPDATE policy
CREATE POLICY "interactions_update_policy" 
ON interactions FOR UPDATE 
USING (auth.uid()::uuid = created_by);

-- DELETE policy
CREATE POLICY "interactions_delete_policy" 
ON interactions FOR DELETE 
USING (auth.uid()::uuid = created_by);

-- Step 8: Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interactions' AND column_name = 'created_by';

-- Check policies
SELECT tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'interactions'
ORDER BY policyname;

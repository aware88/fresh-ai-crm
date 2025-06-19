-- Fix NULL values in created_by column
-- This is a simplified approach focusing only on the NULL values issue

-- Step 1: Check how many records have NULL created_by
SELECT COUNT(*) FROM interactions WHERE created_by IS NULL;

-- Step 2: Update NULL values with a test user UUID
-- Using a specific UUID for testing purposes
UPDATE interactions 
SET created_by = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE created_by IS NULL;

-- Step 3: Add a trigger to automatically set created_by from auth.uid() if not provided
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    -- Default to a specific UUID if auth.uid() is not available (e.g., in testing)
    NEW.created_by = COALESCE(auth.uid()::uuid, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_created_by ON interactions;
CREATE TRIGGER ensure_created_by
BEFORE INSERT ON interactions
FOR EACH ROW
EXECUTE FUNCTION set_created_by();

-- Step 4: Verify the changes
SELECT COUNT(*) FROM interactions WHERE created_by IS NULL;

-- Step 5: Run a test query to see if RLS works now
-- This will only return results if run as the user with UUID '00000000-0000-0000-0000-000000000000'
-- SELECT * FROM interactions WHERE created_by = '00000000-0000-0000-0000-000000000000'::uuid LIMIT 5;

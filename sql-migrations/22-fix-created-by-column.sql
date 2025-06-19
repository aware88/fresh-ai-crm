-- Fix the created_by column in the interactions table

-- First, check the current schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interactions';

-- Ensure created_by is a UUID type and NOT NULL
ALTER TABLE interactions 
ALTER COLUMN created_by TYPE UUID USING created_by::uuid;

-- Add NOT NULL constraint if it doesn't exist
-- (First check if there are any NULL values)
SELECT COUNT(*) FROM interactions WHERE created_by IS NULL;

-- If the count is 0, you can add the NOT NULL constraint
-- ALTER TABLE interactions ALTER COLUMN created_by SET NOT NULL;

-- Update any existing records with NULL created_by to use a default admin user
-- (Replace 'default-admin-uuid' with an actual UUID if needed)
-- UPDATE interactions SET created_by = 'default-admin-uuid'::uuid WHERE created_by IS NULL;

-- Add a trigger to automatically set created_by from auth.uid() if not provided
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

-- Verify the column definition after changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interactions' AND column_name = 'created_by';

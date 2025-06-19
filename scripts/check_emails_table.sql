-- Check the structure of the emails table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emails';

-- Check existing RLS policies
SELECT * FROM pg_policies WHERE tablename = 'emails';

-- Check if user_id column exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'emails' AND column_name = 'user_id'
) AS user_id_exists;

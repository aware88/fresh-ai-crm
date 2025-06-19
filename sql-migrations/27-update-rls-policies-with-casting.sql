-- Update RLS policies with explicit UUID casting
-- This ensures proper type comparison between auth.uid() and created_by

-- Drop existing policies
DROP POLICY IF EXISTS "interactions_select_policy" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_policy" ON interactions;
DROP POLICY IF EXISTS "interactions_update_policy" ON interactions;
DROP POLICY IF EXISTS "interactions_delete_policy" ON interactions;

-- Recreate policies with explicit UUID casting
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

-- Verify the updated policies
SELECT tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'interactions'
ORDER BY policyname;

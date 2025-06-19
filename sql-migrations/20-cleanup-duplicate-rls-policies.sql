-- Clean up duplicate RLS policies for interactions table

-- First, drop all existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON interactions;
DROP POLICY IF EXISTS "Enable delete for users based on created_by" ON interactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON interactions;
DROP POLICY IF EXISTS "Enable insert for users with matching created_by" ON interactions;
DROP POLICY IF EXISTS "Enable select for users based on created_by" ON interactions;
DROP POLICY IF EXISTS "Enable update for users based on created_by" ON interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can view their own interactions" ON interactions;

-- Make sure RLS is enabled
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Create clean policies with consistent naming and proper conditions
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

-- Verify policies after cleanup
SELECT tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'interactions'
ORDER BY policyname;

-- Fix the SELECT policy for interactions

-- First, drop the existing SELECT policy
DROP POLICY IF EXISTS "interactions_select_policy" ON interactions;

-- Create a new SELECT policy with more explicit type casting
CREATE POLICY "interactions_select_policy" 
ON interactions FOR SELECT 
USING (auth.uid()::text = created_by::text);

-- Verify the updated policy
SELECT 
  p.polname AS policyname, 
  t.relname AS tablename, 
  CASE p.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END AS cmd,
  pg_get_expr(p.polqual, p.polrelid) AS using_expr,
  pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
FROM pg_policy p
JOIN pg_class t ON p.polrelid = t.oid
WHERE t.relname = 'interactions'
ORDER BY p.polname;

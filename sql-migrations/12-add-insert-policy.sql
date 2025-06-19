-- Create a policy to allow users to insert their own interactions
CREATE POLICY "Enable insert for authenticated users"
ON public.interactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Verify the policy was created
SELECT * FROM pg_policies 
WHERE tablename = 'interactions' 
AND schemaname = 'public';

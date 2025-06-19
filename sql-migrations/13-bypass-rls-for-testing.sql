-- Temporarily disable RLS for testing purposes
ALTER TABLE public.interactions DISABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'interactions';

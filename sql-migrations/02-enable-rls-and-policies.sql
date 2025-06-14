-- Migration: Enable Row Level Security and create policies for contacts table
-- This script sets up proper security for the contacts table
-- Run this in your Supabase SQL Editor AFTER running 01-create-contacts-table.sql

-- Enable Row Level Security on the contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (you can restrict this later)
-- This policy allows authenticated users to perform all operations
CREATE POLICY "Enable all operations for authenticated users" ON contacts
    FOR ALL USING (true);

-- Alternative: More restrictive policy (uncomment if you want to use this instead)
-- CREATE POLICY "Enable read access for all users" ON contacts FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users only" ON contacts FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update for authenticated users only" ON contacts FOR UPDATE USING (true);
-- CREATE POLICY "Enable delete for authenticated users only" ON contacts FOR DELETE USING (true);

-- Grant necessary permissions to the authenticated role
GRANT ALL ON contacts TO authenticated;
GRANT ALL ON contacts TO anon;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'contacts';

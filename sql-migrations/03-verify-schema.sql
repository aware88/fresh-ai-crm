-- Migration: Verify contacts table schema
-- This script helps verify that the contacts table was created with the correct structure
-- Run this in your Supabase SQL Editor AFTER running the previous migration scripts

-- Check if the contacts table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' 
ORDER BY ordinal_position;

-- Check indexes on the contacts table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'contacts';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'contacts';

-- Check existing policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'contacts';

-- Test basic operations
-- Insert a test record
INSERT INTO contacts (id, firstname, lastname, email, phone, company, position, notes, personalitytype, status) 
VALUES (gen_random_uuid()::text, 'Test', 'User', 'test.verification@example.com', '555-0000', 'Test Company', 'Tester', 'Verification test', 'Amiable', 'active')
ON CONFLICT (email) DO NOTHING;

-- Select all records to verify
SELECT 
    id,
    firstname,
    lastname, 
    email,
    phone,
    company,
    position,
    status,
    createdat,
    updatedat
FROM contacts 
ORDER BY createdat DESC;

-- Clean up test record
DELETE FROM contacts WHERE email = 'test.verification@example.com';

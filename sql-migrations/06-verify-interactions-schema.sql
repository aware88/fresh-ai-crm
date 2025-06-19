-- Migration: Verify interactions table schema and permissions
-- This script verifies that the interactions table is properly set up
-- Run this in your Supabase SQL Editor AFTER running the previous migrations

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'interactions'
ORDER BY 
    ordinal_position;

-- Check indexes
SELECT 
    indexname, 
    indexdef
FROM 
    pg_indexes 
WHERE 
    tablename = 'interactions';

-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'interactions';

-- Check RLS status
SELECT 
    tablename, 
    rowsecurity 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename = 'interactions';

-- Check policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM 
    pg_policies 
WHERE 
    tablename = 'interactions';

-- Test data insertion (only if you want to verify with test data)
-- Uncomment the following if you want to test with sample data
/*
DO $$
DECLARE
    test_contact_id TEXT;
    test_interaction_id TEXT;
BEGIN
    -- Get a contact ID to use for testing
    SELECT id INTO test_contact_id FROM public.contacts LIMIT 1;
    
    -- If we have a contact, insert a test interaction
    IF test_contact_id IS NOT NULL THEN
        INSERT INTO public.interactions (
            contact_id, 
            type, 
            title, 
            content, 
            metadata
        ) VALUES (
            test_contact_id,
            'email',
            'Test Interaction',
            'This is a test interaction',
            '{"test": true}'
        ) RETURNING id INTO test_interaction_id;
        
        -- Verify the interaction was created
        RAISE NOTICE 'Created test interaction with ID: %', test_interaction_id;
        
        -- Clean up (optional)
        -- DELETE FROM public.interactions WHERE id = test_interaction_id;
    ELSE
        RAISE NOTICE 'No contacts found. Skipping test interaction creation.';
    END IF;
END $$;
*/

-- Script to verify that all 11 migrations were properly imported and set up

\echo '======== Verifying SQL Migrations ========'

-- Check if tables exist
\echo '\n1. Checking if all required tables exist...'
SELECT table_name, 'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'organizations',
  'organization_members',
  'contacts',
  'metakocka_credentials',
  'metakocka_contact_mappings',
  'sales_documents',
  'sales_document_items',
  'metakocka_sales_document_mappings'
);

-- Check columns in metakocka_contact_mappings
\echo '\n2. Checking metakocka_contact_mappings columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'metakocka_contact_mappings'
ORDER BY ordinal_position;

-- Check columns in sales_documents
\echo '\n3. Checking sales_documents columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_documents'
ORDER BY ordinal_position;

-- Check columns in sales_document_items
\echo '\n4. Checking sales_document_items columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_document_items'
ORDER BY ordinal_position;

-- Check columns in metakocka_sales_document_mappings
\echo '\n5. Checking metakocka_sales_document_mappings columns...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'metakocka_sales_document_mappings'
ORDER BY ordinal_position;

-- Check foreign key constraints
\echo '\n6. Checking foreign key constraints...'
SELECT 
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
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN (
  'metakocka_contact_mappings',
  'sales_documents',
  'sales_document_items',
  'metakocka_sales_document_mappings'
);

-- Check RLS policies
\echo '\n7. Checking Row Level Security policies...'
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN (
  'metakocka_contact_mappings',
  'sales_documents',
  'sales_document_items',
  'metakocka_sales_document_mappings'
);

-- Check indexes
\echo '\n8. Checking indexes...'
SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    a.attname AS column_name
FROM
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
WHERE
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname IN (
      'metakocka_contact_mappings',
      'sales_documents',
      'sales_document_items',
      'metakocka_sales_document_mappings'
    )
ORDER BY
    t.relname,
    i.relname;

\echo '\n======== Verification Complete ========'

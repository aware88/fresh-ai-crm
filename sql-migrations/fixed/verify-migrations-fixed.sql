-- Script to verify that all 11 migrations were properly imported and set up

-- Check if tables exist
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
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'metakocka_contact_mappings'
ORDER BY ordinal_position;

-- Check columns in sales_documents
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_documents'
ORDER BY ordinal_position;

-- Check columns in sales_document_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_document_items'
ORDER BY ordinal_position;

-- Check columns in metakocka_sales_document_mappings
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'metakocka_sales_document_mappings'
ORDER BY ordinal_position;

-- Check foreign key constraints
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
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN (
  'metakocka_contact_mappings',
  'sales_documents',
  'sales_document_items',
  'metakocka_sales_document_mappings'
);

-- Check indexes
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

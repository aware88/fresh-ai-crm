#!/bin/bash

# Script to verify that all migrations were properly applied
echo "======== Verifying SQL Migrations ========"

# Function to run SQL and display results
run_sql() {
  echo "\n$1"
  echo "$2" > /tmp/verify_query.sql
  cd /Users/aware/fresh-ai-crm && npx supabase db execute --file /tmp/verify_query.sql
}

# Check if tables exist
run_sql "1. Checking if all required tables exist..." "
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
"

# Check columns in metakocka_contact_mappings
run_sql "2. Checking metakocka_contact_mappings columns..." "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'metakocka_contact_mappings'
  ORDER BY ordinal_position;
"

# Check columns in sales_documents
run_sql "3. Checking sales_documents columns..." "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'sales_documents'
  ORDER BY ordinal_position;
"

# Check columns in sales_document_items
run_sql "4. Checking sales_document_items columns..." "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'sales_document_items'
  ORDER BY ordinal_position;
"

# Check columns in metakocka_sales_document_mappings
run_sql "5. Checking metakocka_sales_document_mappings columns..." "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'metakocka_sales_document_mappings'
  ORDER BY ordinal_position;
"

# Check foreign key constraints
run_sql "6. Checking foreign key constraints..." "
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
"

# Check RLS policies
run_sql "7. Checking Row Level Security policies..." "
  SELECT tablename, policyname, cmd
  FROM pg_policies
  WHERE tablename IN (
    'metakocka_contact_mappings',
    'sales_documents',
    'sales_document_items',
    'metakocka_sales_document_mappings'
  );
"

echo "\n======== Verification Complete ========"

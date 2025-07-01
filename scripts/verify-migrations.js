// Script to verify that all migrations were properly applied

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigrations() {
  console.log('======== Verifying SQL Migrations ========');
  
  try {
    // 1. Check if tables exist
    console.log('\n1. Checking if all required tables exist...');
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      // Create a custom function to get tables
      const { data: customTables, error: customTablesError } = await supabase.from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', [
          'organizations',
          'organization_members',
          'contacts',
          'metakocka_credentials',
          'metakocka_contact_mappings',
          'sales_documents',
          'sales_document_items',
          'metakocka_sales_document_mappings'
        ]);
      
      if (customTablesError) {
        console.error('Error with custom table check:', customTablesError);
      } else {
        console.table(customTables);
      }
    } else {
      console.table(tables);
    }
    
    // 2. Check columns in key tables
    const tablesToCheck = [
      'metakocka_contact_mappings',
      'sales_documents',
      'sales_document_items',
      'metakocka_sales_document_mappings'
    ];
    
    for (const table of tablesToCheck) {
      console.log(`\n2. Checking ${table} columns...`);
      const { data: columns, error: columnsError } = await supabase.rpc('get_columns', { table_name: table });
      
      if (columnsError) {
        console.error(`Error checking columns for ${table}:`, columnsError);
        // Try a direct query
        const { data: customColumns, error: customColumnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', table);
        
        if (customColumnsError) {
          console.error(`Error with custom column check for ${table}:`, customColumnsError);
        } else {
          console.table(customColumns);
        }
      } else {
        console.table(columns);
      }
    }
    
    // 3. Check foreign key constraints
    console.log('\n3. Checking foreign key constraints...');
    const { data: fkConstraints, error: fkError } = await supabase.rpc('get_foreign_keys');
    
    if (fkError) {
      console.error('Error checking foreign keys:', fkError);
      // Try a direct query
      const { data: customFks, error: customFksError } = await supabase.from('pg_catalog.pg_constraint')
        .select('conname, conrelid::regclass as table_name')
        .eq('contype', 'f');
      
      if (customFksError) {
        console.error('Error with custom foreign key check:', customFksError);
      } else {
        console.table(customFks);
      }
    } else {
      console.table(fkConstraints);
    }
    
    // 4. Check RLS policies
    console.log('\n4. Checking Row Level Security policies...');
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies');
    
    if (policiesError) {
      console.error('Error checking policies:', policiesError);
      // Try a direct query
      const { data: customPolicies, error: customPoliciesError } = await supabase.from('pg_catalog.pg_policies')
        .select('tablename, policyname')
        .in('tablename', tablesToCheck);
      
      if (customPoliciesError) {
        console.error('Error with custom policy check:', customPoliciesError);
      } else {
        console.table(customPolicies);
      }
    } else {
      console.table(policies);
    }
    
    console.log('\n======== Verification Complete ========');
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

// Run the verification
verifyMigrations();

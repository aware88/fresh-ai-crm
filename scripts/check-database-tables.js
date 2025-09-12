#!/usr/bin/env node

/**
 * Check Database Tables
 * 
 * This script checks if we can access various database tables
 * using the service role key.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verify environment
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase configuration!');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTables() {
  console.log('🔍 Checking database tables with service role key...');
  console.log(`🌐 URL: ${SUPABASE_URL}`);
  console.log('');
  
  const tables = [
    'organizations',
    'organization_members',
    'user_preferences',
    'email_accounts',
    'email_index',
    'email_content_cache',
    'email_threads'
  ];
  
  for (const table of tables) {
    try {
      console.log(`🔄 Checking table: ${table}...`);
      
      const { data, error, status, statusText } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table}: ${error.message}`);
        console.error(`   Status: ${status} ${statusText}`);
      } else {
        console.log(`✅ Successfully accessed ${table}`);
        console.log(`   Found ${data?.length || 0} records`);
      }
    } catch (error) {
      console.error(`❌ Exception accessing ${table}: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Check if we can access auth.users
  try {
    console.log('🔄 Checking auth.users table...');
    
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    
    if (error) {
      console.error(`❌ Error accessing auth.users: ${error.message}`);
    } else {
      console.log('✅ Successfully accessed auth.users');
      console.log(`   Found ${data?.users?.length || 0} users`);
    }
  } catch (error) {
    console.error(`❌ Exception accessing auth.users: ${error.message}`);
  }
}

// Run the check
checkTables();









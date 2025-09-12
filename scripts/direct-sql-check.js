#!/usr/bin/env node

/**
 * Direct SQL Check
 * 
 * This script uses direct SQL to check the test user and organization.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = 'test@example.com';

// Verify environment
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase configuration!');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runDirectSql() {
  console.log('🔍 Running direct SQL queries...');
  console.log('');
  
  try {
    // Check organizations
    console.log('🔄 Querying organizations...');
    const { data: orgsData, error: orgsError } = await supabase.rpc('exec_sql', {
      sql: `SELECT * FROM public.organizations WHERE name = 'Test Organization' LIMIT 1`
    });
    
    if (orgsError) {
      console.error('❌ Error querying organizations:', orgsError.message);
    } else {
      console.log('✅ Organizations query successful');
      console.log(orgsData);
    }
    
    // Check organization members
    console.log('\n🔄 Querying organization_members...');
    const { data: membersData, error: membersError } = await supabase.rpc('exec_sql', {
      sql: `SELECT * FROM public.organization_members LIMIT 10`
    });
    
    if (membersError) {
      console.error('❌ Error querying organization_members:', membersError.message);
    } else {
      console.log('✅ Organization members query successful');
      console.log(membersData);
    }
    
    // Try direct login
    console.log('\n🔄 Attempting direct login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: 'test123'
    });
    
    if (signInError) {
      console.error('❌ Sign-in failed:', signInError.message);
    } else {
      console.log('✅ Sign-in successful!');
      console.log(`👤 User ID: ${signInData.user.id}`);
      console.log(`📧 Email: ${signInData.user.email}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
runDirectSql();









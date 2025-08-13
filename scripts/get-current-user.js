#!/usr/bin/env node

/**
 * Get Current User ID from the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getCurrentUser() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log('🔍 FINDING CURRENT USER');
  console.log('═'.repeat(40));
  
  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, created_at')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }
  
  console.log(`📊 Found ${users.length} users:`);
  console.log();
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email || user.name || 'Unknown'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
    console.log();
  });
  
  // Try to find the most recent user (likely the current one)
  if (users.length > 0) {
    const currentUser = users[0];
    console.log('🎯 USING MOST RECENT USER:');
    console.log(`   Email: ${currentUser.email || 'N/A'}`);
    console.log(`   ID: ${currentUser.id}`);
    console.log();
    
    return currentUser.id;
  }
  
  return null;
}

getCurrentUser().catch(console.error);


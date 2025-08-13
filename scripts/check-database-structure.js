#!/usr/bin/env node

/**
 * Check Database Structure
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkDatabase() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log('🔍 CHECKING DATABASE STRUCTURE');
  console.log('═'.repeat(50));
  
  // Check for common user-related tables
  const tablesToCheck = [
    'users', 
    'profiles', 
    'user_profiles',
    'accounts',
    'email_accounts',
    'organizations',
    'user_preferences'
  ];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (!error) {
        console.log(`✅ Table "${table}" exists`);
        if (data && data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
        }
      } else {
        console.log(`❌ Table "${table}" does not exist`);
      }
    } catch (err) {
      console.log(`❌ Error checking "${table}": ${err.message}`);
    }
    console.log();
  }
  
  // Try to get current session user from email_accounts if it exists
  try {
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('user_id, email, display_name')
      .limit(5);
      
    if (!error && accounts && accounts.length > 0) {
      console.log('👤 USERS FROM EMAIL ACCOUNTS:');
      console.log('─'.repeat(30));
      accounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.email || account.display_name}`);
        console.log(`   User ID: ${account.user_id}`);
        console.log();
      });
      
      // Return the first user ID
      return accounts[0].user_id;
    }
  } catch (err) {
    console.log('❌ Could not check email_accounts:', err.message);
  }
  
  return null;
}

checkDatabase().then(userId => {
  if (userId) {
    console.log(`🎯 SUGGESTED USER ID: ${userId}`);
  } else {
    console.log('❌ No user ID found');
  }
}).catch(console.error);


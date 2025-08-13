/**
 * Script to fix dashboard email count
 * Run with: node fix-dashboard.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixDashboard() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    return;
  }

  // Create Supabase client with service role key for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔑 Connected to Supabase with admin privileges');

  try {
    // Get all email accounts
    const { data: allAccounts, error: fetchError } = await supabase
      .from('email_accounts')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching accounts:', fetchError);
      return;
    }
    
    console.log(`📧 Found ${allAccounts.length} email accounts in total`);
    
    // Count unique active accounts
    const uniqueEmails = new Set();
    const activeAccounts = allAccounts.filter(account => account.is_active);
    activeAccounts.forEach(account => uniqueEmails.add(account.email));
    
    console.log(`📧 Found ${activeAccounts.length} active email accounts`);
    console.log(`📧 Found ${uniqueEmails.size} unique email addresses`);
    
    // Print all accounts for debugging
    console.log('\n📧 All email accounts:');
    allAccounts.forEach(account => {
      console.log(`   - ${account.email} (${account.is_active ? 'active' : 'inactive'}, user: ${account.user_id}, org: ${account.organization_id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixDashboard();


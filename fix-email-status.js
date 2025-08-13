/**
 * Script to fix email account status and delete demo account
 * Run with: node fix-email-status.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixEmailStatus() {
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
    
    console.log(`📧 Found ${allAccounts.length} email accounts:`);
    allAccounts.forEach(account => {
      console.log(`   - ID: ${account.id}`);
      console.log(`     Email: ${account.email}`);
      console.log(`     Status: ${account.is_active ? 'active' : 'inactive'}`);
      console.log(`     User: ${account.user_id}`);
      console.log(`     Organization: ${account.organization_id}`);
      console.log('');
    });
    
    // 1. Delete demo@example.com account
    const demoAccounts = allAccounts.filter(account => account.email === 'demo@example.com');
    if (demoAccounts.length > 0) {
      console.log(`🗑️ Deleting ${demoAccounts.length} demo accounts...`);
      
      for (const account of demoAccounts) {
        const { error: deleteError } = await supabase
          .from('email_accounts')
          .delete()
          .eq('id', account.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting account ${account.id}:`, deleteError);
        } else {
          console.log(`✅ Successfully deleted account ${account.id}`);
        }
      }
    }
    
    // 2. Update all remaining accounts to active
    console.log('🔄 Setting all remaining accounts to active...');
    
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({ is_active: true })
      .in('email', ['tim.mak@bulknutrition.eu', 'negozio@withcar.it']);
    
    if (updateError) {
      console.error('❌ Error updating accounts:', updateError);
    } else {
      console.log('✅ Successfully updated accounts to active');
    }
    
    // Verify final state
    const { data: finalAccounts } = await supabase
      .from('email_accounts')
      .select('*');
    
    console.log(`\n📧 Final state: ${finalAccounts.length} email accounts:`);
    finalAccounts.forEach(account => {
      console.log(`   - ${account.email} (${account.is_active ? 'active' : 'inactive'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixEmailStatus();


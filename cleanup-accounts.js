/**
 * Script to clean up duplicate email accounts and fix status
 * Run with: node cleanup-accounts.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function cleanupAccounts() {
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
      .select('*')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error fetching accounts:', fetchError);
      return;
    }
    
    console.log(`📧 Found ${allAccounts.length} email accounts`);
    
    // Group by email address
    const accountsByEmail = {};
    allAccounts.forEach(account => {
      if (!accountsByEmail[account.email]) {
        accountsByEmail[account.email] = [];
      }
      accountsByEmail[account.email].push(account);
    });
    
    // Find duplicate demo accounts to delete
    const accountsToDelete = [];
    const accountsToUpdate = [];
    
    for (const email in accountsByEmail) {
      const accounts = accountsByEmail[email];
      
      // Keep the first account, mark others for deletion if they're demo accounts
      if (accounts.length > 1 && email === 'demo@example.com') {
        // Keep the first one, delete the rest
        for (let i = 1; i < accounts.length; i++) {
          accountsToDelete.push(accounts[i].id);
        }
      }
      
      // Mark tim.mak@bulknutrition.eu as active
      if (email === 'tim.mak@bulknutrition.eu' && !accounts[0].is_active) {
        accountsToUpdate.push({
          id: accounts[0].id,
          is_active: true
        });
      }
    }
    
    // Delete duplicate demo accounts
    if (accountsToDelete.length > 0) {
      console.log(`🗑️ Deleting ${accountsToDelete.length} duplicate demo accounts...`);
      const { error: deleteError } = await supabase
        .from('email_accounts')
        .delete()
        .in('id', accountsToDelete);
      
      if (deleteError) {
        console.error('❌ Error deleting accounts:', deleteError);
      } else {
        console.log('✅ Successfully deleted duplicate accounts');
      }
    } else {
      console.log('✅ No duplicate demo accounts to delete');
    }
    
    // Update tim.mak@bulknutrition.eu to active
    if (accountsToUpdate.length > 0) {
      console.log(`🔄 Updating ${accountsToUpdate.length} accounts to active...`);
      
      for (const account of accountsToUpdate) {
        const { error: updateError } = await supabase
          .from('email_accounts')
          .update({ is_active: true })
          .eq('id', account.id);
        
        if (updateError) {
          console.error(`❌ Error updating account ${account.id}:`, updateError);
        } else {
          console.log(`✅ Successfully updated account ${account.id} to active`);
        }
      }
    } else {
      console.log('✅ No accounts need status update');
    }
    
    // Show final state
    const { data: finalAccounts } = await supabase
      .from('email_accounts')
      .select('*')
      .order('created_at', { ascending: true });
    
    console.log('\n📧 Final email accounts:');
    finalAccounts.forEach(account => {
      console.log(`   - ${account.email} (${account.is_active ? 'active' : 'inactive'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupAccounts();


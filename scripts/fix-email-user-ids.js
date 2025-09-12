#!/usr/bin/env node

/**
 * Fix null user_id values in email_index table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixEmailUserIds() {
  try {
    console.log('🔧 Fixing null user_id values in email_index...');
    
    // Get the correct user_id from the email account
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('id, user_id, email')
      .eq('id', '0d91ab34-e7b8-4d09-9351-7f22fca4a975')
      .single();
    
    if (accountError || !account) {
      console.error('❌ Failed to get account info:', accountError);
      return;
    }
    
    console.log(`✅ Account: ${account.email} belongs to user: ${account.user_id}`);
    
    // Find emails with null user_id for this account
    const { data: nullUserEmails, error: nullError } = await supabase
      .from('email_index')
      .select('id, message_id, subject')
      .eq('email_account_id', account.id)
      .is('user_id', null);
    
    if (nullError) {
      console.error('❌ Failed to find null user_id emails:', nullError);
      return;
    }
    
    console.log(`📊 Found ${nullUserEmails?.length || 0} emails with null user_id`);
    
    if (nullUserEmails && nullUserEmails.length > 0) {
      // Update all null user_id values to the correct user_id
      const { data: updateResult, error: updateError } = await supabase
        .from('email_index')
        .update({ user_id: account.user_id })
        .eq('email_account_id', account.id)
        .is('user_id', null);
      
      if (updateError) {
        console.error('❌ Failed to update user_id values:', updateError);
        return;
      }
      
      console.log(`✅ Successfully updated ${nullUserEmails.length} emails with correct user_id`);
      
      // Verify the fix
      const { data: verifyEmails, error: verifyError } = await supabase
        .from('email_index')
        .select('user_id')
        .eq('email_account_id', account.id)
        .is('user_id', null);
      
      if (verifyError) {
        console.error('❌ Failed to verify fix:', verifyError);
      } else {
        console.log(`🔍 Verification: ${verifyEmails?.length || 0} emails still have null user_id`);
      }
    } else {
      console.log('✅ No emails with null user_id found - all good!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixEmailUserIds();
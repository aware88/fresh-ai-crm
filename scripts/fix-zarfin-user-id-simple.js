#!/usr/bin/env node

/**
 * Fix Zarfin's user_id to match auth.users table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixZarfinUserId() {
  console.log('🔧 Fixing Zarfin\'s user_id...\n');
  
  try {
    // We know from the SQL query that the correct user_id is: 2aee7a5b-c7b2-41b4-ae23-dddbc6e37718
    const correctUserId = '2aee7a5b-c7b2-41b4-ae23-dddbc6e37718';
    
    // Get current email_accounts record
    const { data: currentAccount, error: currentError } = await supabase
      .from('email_accounts')
      .select('id, email, user_id')
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .single();
    
    if (currentError || !currentAccount) {
      throw new Error('Could not find Zarfin\'s email account');
    }
    
    console.log('Current account:', {
      id: currentAccount.id,
      email: currentAccount.email,
      user_id: currentAccount.user_id
    });
    
    console.log('\n❌ Current wrong user_id:', currentAccount.user_id);
    console.log('✅ Correct user_id should be:', correctUserId);
    
    // Update the email_accounts table
    const { data: updatedAccount, error: updateError } = await supabase
      .from('email_accounts')
      .update({ user_id: correctUserId })
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update user_id: ${updateError.message}`);
    }
    
    console.log('\n✅ Successfully updated email_accounts:', {
      id: updatedAccount.id,
      email: updatedAccount.email,
      user_id: updatedAccount.user_id
    });
    
    // Verify the update
    const { data: verifyAccount } = await supabase
      .from('email_accounts')
      .select('id, email, user_id')
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .single();
    
    console.log('\n✅ Verification - account now has correct user_id:', verifyAccount.user_id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixZarfinUserId();
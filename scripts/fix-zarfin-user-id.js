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
    // Get the correct user_id from auth.users using raw SQL
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_user_by_email', { 
        user_email: 'zarfin.jakupovic@withcar.si' 
      });
    
    // If RPC doesn't work, try direct auth query
    if (authError || !authUsers || authUsers.length === 0) {
      const { data: { users }, error: authApiError } = await supabase.auth.admin.listUsers();
      
      if (authApiError) {
        throw new Error('Could not list users: ' + authApiError.message);
      }
      
      const authUser = users?.find(u => u.email === 'zarfin.jakupovic@withcar.si');
      if (!authUser) {
        throw new Error('Could not find Zarfin in auth.users');
      }
      
      authUsers = [{ id: authUser.id, email: authUser.email }];
    }
    
    const authUser = authUsers[0];
    
    if (authError || !authUser) {
      throw new Error('Could not find Zarfin in auth.users');
    }
    
    console.log('✅ Found correct user in auth.users:', {
      id: authUser.id,
      email: authUser.email
    });
    
    // Get current email_accounts record
    const { data: currentAccount, error: currentError } = await supabase
      .from('email_accounts')
      .select('id, email, user_id')
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .single();
    
    if (currentError || !currentAccount) {
      throw new Error('Could not find Zarfin\'s email account');
    }
    
    console.log('\n❌ Current wrong user_id:', currentAccount.user_id);
    console.log('✅ Correct user_id should be:', authUser.id);
    
    // Update the email_accounts table
    const { data: updatedAccount, error: updateError } = await supabase
      .from('email_accounts')
      .update({ user_id: authUser.id })
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
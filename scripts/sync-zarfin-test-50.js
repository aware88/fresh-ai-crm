#!/usr/bin/env node

/**
 * Test sync for Zarfin with 50 received + 50 sent emails
 * Run this AFTER applying database constraints
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSync() {
  console.log('🧪 Starting test sync for Zarfin (50+50 emails)...\n');
  
  try {
    // 1. Get Zarfin's account
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .single();
    
    if (accountError || !account) {
      throw new Error('Zarfin account not found');
    }
    
    console.log('✅ Found account:', {
      id: account.id,
      email: account.email,
      user_id: account.user_id,
      provider: account.provider_type
    });
    
    // 2. Verify user_id exists
    if (!account.user_id) {
      throw new Error('Account has no user_id!');
    }
    
    // 3. Call sync API with 100 emails (50+50)
    const baseUrl = 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/email/sync-to-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Manual-Sync-Script'
      },
      body: JSON.stringify({
        accountId: account.id,
        maxEmails: 100 // This will sync 50 INBOX + 50 Sent
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Sync failed');
    }
    
    console.log('\n✅ Sync completed:', result);
    
    // 4. Verify emails were saved with user_id
    const { data: emails, count } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: false })
      .eq('email_account_id', account.id)
      .limit(5);
    
    console.log(`\n📊 Verification:`);
    console.log(`- Total emails synced: ${count}`);
    console.log(`- Sample emails:`);
    
    emails.forEach(email => {
      console.log(`  - ${email.subject.substring(0, 50)}...`);
      console.log(`    user_id: ${email.user_id || '❌ NULL'}`);
      console.log(`    folder: ${email.folder_name}`);
    });
    
    // 5. Check for NULL user_ids
    const { count: nullCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', account.id)
      .is('user_id', null);
    
    if (nullCount > 0) {
      console.error(`\n❌ WARNING: ${nullCount} emails have NULL user_id!`);
    } else {
      console.log('\n✅ All emails have valid user_id!');
    }
    
  } catch (error) {
    console.error('❌ Test sync failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSync();
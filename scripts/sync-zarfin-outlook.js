#!/usr/bin/env node

/**
 * Sync Zarfin's Outlook/Microsoft emails
 * First test with 100 (50+50), then scale to 10,000 (5000+5000)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncZarfinOutlook(maxEmails = 100) {
  console.log(`🔷 Starting Outlook sync for Zarfin (${maxEmails} total emails)...\n`);
  
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
      provider: account.provider_type,
      has_token: !!account.access_token,
      has_refresh: !!account.refresh_token
    });
    
    // 2. Verify user_id exists
    if (!account.user_id) {
      throw new Error('Account has no user_id!');
    }
    
    // 3. Clear existing emails (optional)
    if (process.argv.includes('--clear')) {
      console.log('🗑️  Clearing existing emails...');
      const { error: deleteError } = await supabase
        .from('email_index')
        .delete()
        .eq('email_account_id', account.id);
      
      if (!deleteError) {
        console.log('✅ Cleared existing emails');
      }
    }
    
    const baseUrl = 'http://localhost:3000';
    const results = { inbox: null, sent: null };
    
    // 4. Sync INBOX emails
    console.log(`\n📥 Syncing INBOX (${Math.floor(maxEmails/2)} emails)...`);
    
    const inboxResponse = await fetch(`${baseUrl}/api/emails/graph/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-RealTime-Sync' // Mark as internal call
      },
      body: JSON.stringify({
        accountId: account.id,
        folder: 'inbox',
        maxEmails: Math.floor(maxEmails / 2),
        internalCall: true // Bypass auth check
      })
    });
    
    results.inbox = await inboxResponse.json();
    
    if (!inboxResponse.ok) {
      console.error('❌ INBOX sync failed:', results.inbox.error);
    } else {
      console.log('✅ INBOX sync:', results.inbox);
    }
    
    // 5. Sync SENT emails
    console.log(`\n📤 Syncing SENT (${Math.floor(maxEmails/2)} emails)...`);
    
    const sentResponse = await fetch(`${baseUrl}/api/emails/graph/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-RealTime-Sync'
      },
      body: JSON.stringify({
        accountId: account.id,
        folder: 'sent',
        maxEmails: Math.floor(maxEmails / 2),
        internalCall: true
      })
    });
    
    results.sent = await sentResponse.json();
    
    if (!sentResponse.ok) {
      console.error('❌ SENT sync failed:', results.sent.error);
    } else {
      console.log('✅ SENT sync:', results.sent);
    }
    
    // 6. Verify emails were saved with user_id
    const { data: emails, count } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: false })
      .eq('email_account_id', account.id)
      .limit(5);
    
    console.log(`\n📊 Verification:`);
    console.log(`- Total emails synced: ${count}`);
    
    if (emails && emails.length > 0) {
      console.log(`- Sample emails:`);
      emails.forEach(email => {
        console.log(`  - ${email.subject ? email.subject.substring(0, 50) : 'No subject'}...`);
        console.log(`    user_id: ${email.user_id || '❌ NULL'}`);
        console.log(`    folder: ${email.folder_name}`);
      });
    }
    
    // 7. Check for NULL user_ids
    const { count: nullCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', account.id)
      .is('user_id', null);
    
    if (nullCount > 0) {
      console.error(`\n❌ CRITICAL: ${nullCount} emails have NULL user_id!`);
      process.exit(1);
    } else {
      console.log('\n✅ All emails have valid user_id!');
    }
    
    // 8. Check distribution by folder
    const { data: folderStats } = await supabase
      .from('email_index')
      .select('folder_name')
      .eq('email_account_id', account.id);
    
    if (folderStats) {
      const counts = folderStats.reduce((acc, email) => {
        acc[email.folder_name] = (acc[email.folder_name] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📁 Folder distribution:');
      Object.entries(counts).forEach(([folder, count]) => {
        console.log(`  - ${folder}: ${count} emails`);
      });
    }
    
    console.log('\n🎉 Sync complete!');
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let maxEmails = 100; // Default to test mode (50+50)

if (args.includes('--production')) {
  maxEmails = 10000; // Production mode (5000+5000)
} else if (args.includes('--emails')) {
  const idx = args.indexOf('--emails');
  if (idx !== -1 && args[idx + 1]) {
    maxEmails = parseInt(args[idx + 1]);
  }
}

console.log('Usage:');
console.log('  node sync-zarfin-outlook.js              # Test mode: 100 emails (50+50)');
console.log('  node sync-zarfin-outlook.js --production # Production: 10,000 emails (5000+5000)');
console.log('  node sync-zarfin-outlook.js --emails 200 # Custom count');
console.log('  node sync-zarfin-outlook.js --clear      # Clear existing emails first');
console.log('');

// Run the sync
syncZarfinOutlook(maxEmails);
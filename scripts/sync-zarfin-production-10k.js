#!/usr/bin/env node

/**
 * Production sync for Zarfin with 10,000 emails (5000 received + 5000 sent)
 * Run this ONLY after test sync succeeds
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function productionSync() {
  console.log('🚀 Starting PRODUCTION sync for Zarfin (10,000 emails)...\n');
  console.log('⚠️  This will sync 5000 received + 5000 sent emails');
  console.log('⏱️  This may take several minutes...\n');
  
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
    
    // 2. Clear existing emails (optional)
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      console.log('🗑️  Clearing existing emails...');
      const { error: deleteError } = await supabase
        .from('email_index')
        .delete()
        .eq('email_account_id', account.id);
      
      if (deleteError) {
        console.error('Warning: Could not clear existing emails:', deleteError.message);
      } else {
        console.log('✅ Cleared existing emails');
      }
    }
    
    // 3. Call sync API with 10,000 emails
    console.log('\n📥 Starting sync...');
    const startTime = Date.now();
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/email/sync-to-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Manual-Sync-Script'
      },
      body: JSON.stringify({
        accountId: account.id,
        maxEmails: 10000 // This will sync 5000 INBOX + 5000 Sent
      }),
      timeout: 600000 // 10 minute timeout
    });
    
    const result = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!response.ok) {
      throw new Error(result.error || 'Sync failed');
    }
    
    console.log(`\n✅ Sync completed in ${duration} seconds:`, result);
    
    // 4. Verify emails by folder
    const { data: folderCounts } = await supabase
      .from('email_index')
      .select('folder_name')
      .eq('email_account_id', account.id);
    
    const counts = folderCounts.reduce((acc, email) => {
      acc[email.folder_name] = (acc[email.folder_name] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Email distribution:');
    Object.entries(counts).forEach(([folder, count]) => {
      console.log(`  - ${folder}: ${count} emails`);
    });
    
    // 5. Check for NULL user_ids
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
    
    // 6. Check date ranges
    const { data: dateRange } = await supabase
      .from('email_index')
      .select('sent_at, received_at')
      .eq('email_account_id', account.id)
      .order('sent_at', { ascending: true })
      .limit(1);
    
    const { data: latestEmail } = await supabase
      .from('email_index')
      .select('sent_at, received_at')
      .eq('email_account_id', account.id)
      .order('sent_at', { ascending: false })
      .limit(1);
    
    if (dateRange && latestEmail) {
      console.log('\n📅 Date range:');
      console.log(`  - Oldest: ${dateRange[0].sent_at || dateRange[0].received_at}`);
      console.log(`  - Newest: ${latestEmail[0].sent_at || latestEmail[0].received_at}`);
    }
    
    console.log('\n🎉 Production sync successful!');
    
  } catch (error) {
    console.error('❌ Production sync failed:', error.message);
    process.exit(1);
  }
}

// Run the sync
productionSync();
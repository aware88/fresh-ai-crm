/**
 * TEST CONTROLLED SYNC - ZARFIN
 * 
 * Tests the new controlled sync endpoint with exactly 50 received + 50 sent emails
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testControlledSync() {
  console.log('🧪 TEST CONTROLLED SYNC - Zarfin Account');
  console.log('📊 Target: 50 received + 50 sent emails');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Get Zarfin's account ID
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      throw new Error('Zarfin account not found or not active');
    }

    console.log(`📧 Found account: ${account.email} (ID: ${account.id})`);

    // 2. Verify database is clean
    const { count: currentCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Current emails in database: ${currentCount || 0}`);
    
    if (currentCount && currentCount > 0) {
      console.log('⚠️  Database is not clean! Please run clean-slate script first.');
      return;
    }

    // 3. Make the controlled sync API call
    console.log('\n🚀 Starting controlled sync...');
    
    const port = process.env.PORT || '3000';
    const baseUrl = `http://localhost:${port}`;
    
    const response = await fetch(`${baseUrl}/api/email/controlled-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // For testing, we'll need to add session handling
        'User-Agent': 'Test-Controlled-Sync'
      },
      body: JSON.stringify({
        accountId: account.id,
        receivedCount: 50,
        sentCount: 50,
        testMode: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sync API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Sync completed successfully!');
    console.log('📊 Results:', result);

    // 4. Verify results in database
    console.log('\n🔍 Verifying results...');
    
    const { data: emails, error: emailsError } = await supabase
      .from('email_index')
      .select('email_type, folder_name, sender_email, subject, received_at, sent_at')
      .eq('email_account_id', account.id)
      .order('received_at', { ascending: false });

    if (emailsError) {
      throw new Error('Failed to verify results: ' + emailsError.message);
    }

    console.log(`📧 Total emails synced: ${emails.length}`);
    
    const receivedEmails = emails.filter(e => e.email_type === 'received');
    const sentEmails = emails.filter(e => e.email_type === 'sent');
    
    console.log(`📥 Received emails: ${receivedEmails.length}`);
    console.log(`📤 Sent emails: ${sentEmails.length}`);

    // Show sample data
    console.log('\n📋 Sample received emails:');
    receivedEmails.slice(0, 3).forEach((email, i) => {
      console.log(`  ${i + 1}. From: ${email.sender_email}`);
      console.log(`     Subject: ${email.subject?.substring(0, 50)}...`);
      console.log(`     Date: ${email.received_at}`);
    });

    console.log('\n📋 Sample sent emails:');
    sentEmails.slice(0, 3).forEach((email, i) => {
      console.log(`  ${i + 1}. From: ${email.sender_email}`);
      console.log(`     Subject: ${email.subject?.substring(0, 50)}...`);
      console.log(`     Date: ${email.sent_at || email.received_at}`);
    });

    // Check for duplicates
    const messageIds = emails.map(e => e.message_id);
    const uniqueMessageIds = new Set(messageIds);
    const duplicateCount = messageIds.length - uniqueMessageIds.size;
    
    console.log(`\n🔍 Duplicate check: ${duplicateCount} duplicates found`);
    
    if (duplicateCount === 0) {
      console.log('✅ No duplicates - perfect!');
    } else {
      console.log('❌ Duplicates found - needs investigation');
    }

    // Final verification
    const expectedTotal = 100; // 50 received + 50 sent
    const actualTotal = emails.length;
    
    console.log(`\n🎯 FINAL VERIFICATION:`);
    console.log(`Expected: ${expectedTotal} emails (50 received + 50 sent)`);
    console.log(`Actual: ${actualTotal} emails (${receivedEmails.length} received + ${sentEmails.length} sent)`);
    
    if (actualTotal === expectedTotal && receivedEmails.length > 0 && sentEmails.length > 0) {
      console.log('🎉 TEST PASSED - Controlled sync working perfectly!');
      return {
        success: true,
        total: actualTotal,
        received: receivedEmails.length,
        sent: sentEmails.length,
        duplicates: duplicateCount
      };
    } else {
      console.log('⚠️  TEST NEEDS ATTENTION - Numbers don\'t match expected values');
      return {
        success: false,
        total: actualTotal,
        received: receivedEmails.length,
        sent: sentEmails.length,
        duplicates: duplicateCount,
        issue: 'Count mismatch'
      };
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testControlledSync()
  .then(result => {
    if (result.success) {
      console.log('\n🎯 READY FOR SCALE TEST (5000 + 5000)');
    } else {
      console.log('\n🔧 FIX REQUIRED BEFORE SCALING');
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  });
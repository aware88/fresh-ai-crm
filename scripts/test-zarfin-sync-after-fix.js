#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEmailSync() {
  console.log('🔍 Testing Zarfin email sync after RPC fix...\n');
  
  const accountId = '0d91ab34-e7b8-4d09-9351-7f22fca4a975';
  const userId = '2aee7a5b-c7b2-41b4-ae23-dddbc6e37718';
  
  try {
    // First, check current email count
    const { data: beforeCount } = await supabase
      .from('email_index')
      .select('message_id', { count: 'exact', head: true })
      .eq('email_account_id', accountId);
    
    console.log(`📊 Current email count: ${beforeCount || 0}\n`);
    
    // Test RPC function directly
    console.log('🧪 Testing RPC function with a test email...');
    const testEmail = {
      message_id: `test-${Date.now()}`,
      email_account_id: accountId,
      user_id: userId,
      sender_email: 'test@example.com',
      recipient_email: 'zarfin.jakupovic@withcar.si',
      subject: 'Test Email After Fix',
      preview_text: 'Testing RPC function',
      email_type: 'received',
      folder_name: 'INBOX',
      thread_id: crypto.randomUUID(),
      received_at: new Date().toISOString(),
      has_attachments: false,
      is_read: false
    };
    
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('insert_email_index_batch', {
        p_emails: [testEmail]
      });
    
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError);
    } else {
      console.log('✅ RPC Result:', rpcResult);
      if (rpcResult.error_details) {
        console.log('⚠️  Error details:', rpcResult.error_details);
      }
    }
    
    // Now trigger actual email sync
    console.log('\n📨 Triggering Microsoft Graph sync for Zarfin...');
    
    const response = await fetch('http://localhost:3002/api/emails/graph/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-RealTime-Sync'
      },
      body: JSON.stringify({
        accountId: accountId,
        folder: 'inbox',
        maxEmails: 50,
        internalCall: true
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Sync failed:', result.error);
      if (result.details) {
        console.error('   Details:', result.details);
      }
    } else {
      console.log('✅ Sync successful!');
      console.log(`   - Total saved: ${result.totalSaved}`);
      console.log(`   - Import count: ${result.importCount}`);
      if (result.breakdown) {
        console.log('   - Breakdown:', result.breakdown);
      }
    }
    
    // Check final email count
    const { data: afterCount } = await supabase
      .from('email_index')
      .select('message_id', { count: 'exact', head: true })
      .eq('email_account_id', accountId);
    
    console.log(`\n📊 Final email count: ${afterCount || 0}`);
    console.log(`📈 New emails added: ${(afterCount || 0) - (beforeCount || 0)}`);
    
    // Show latest emails
    const { data: latestEmails } = await supabase
      .from('email_index')
      .select('message_id, subject, created_at, received_at')
      .eq('email_account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (latestEmails && latestEmails.length > 0) {
      console.log('\n📧 Latest 5 emails:');
      latestEmails.forEach(email => {
        console.log(`   - ${email.subject || 'No subject'}`);
        console.log(`     Created: ${email.created_at}`);
        console.log(`     Received: ${email.received_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailSync();
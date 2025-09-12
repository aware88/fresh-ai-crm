#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertTestEmails() {
  console.log('📧 Inserting test emails for Zarfin...\n');
  
  try {
    // Get Zarfin's account
    const { data: account } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .single();
    
    if (!account) {
      throw new Error('Zarfin account not found');
    }
    
    console.log('✅ Found account:', {
      id: account.id,
      user_id: account.user_id,
      email: account.email
    });
    
    // Create test emails
    const testEmails = [];
    const now = new Date();
    
    // Create 50 received emails
    for (let i = 0; i < 50; i++) {
      const date = new Date(now.getTime() - i * 3600000); // 1 hour apart
      testEmails.push({
        id: crypto.randomUUID(),
        user_id: account.user_id,
        email_account_id: account.id,
        message_id: `test-received-${i}-${Date.now()}`,
        thread_id: `thread-received-${i}`,
        folder_name: 'INBOX',
        sender_email: `sender${i}@example.com`,
        sender_name: `Sender ${i}`,
        recipient_email: account.email,
        subject: `Test Received Email ${i}`,
        email_type: 'received',
        is_read: i % 3 === 0, // Every 3rd email is read
        received_at: date.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      });
    }
    
    // Create 50 sent emails
    for (let i = 0; i < 50; i++) {
      const date = new Date(now.getTime() - i * 3600000);
      testEmails.push({
        id: crypto.randomUUID(),
        user_id: account.user_id,
        email_account_id: account.id,
        message_id: `test-sent-${i}-${Date.now()}`,
        thread_id: `thread-sent-${i}`,
        folder_name: 'Sent',
        sender_email: account.email,
        sender_name: 'Zarfin Jakupovic',
        recipient_email: `recipient${i}@example.com`,
        subject: `Test Sent Email ${i}`,
        email_type: 'sent',
        is_read: true,
        sent_at: date.toISOString(),
        received_at: date.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      });
    }
    
    // Insert using RPC function
    const { data, error } = await supabase.rpc('insert_email_with_validation', {
      p_records: testEmails
    });
    
    if (error) {
      console.error('❌ RPC Error:', error);
      
      // Try direct insert as fallback
      console.log('Trying direct insert...');
      const { error: insertError } = await supabase
        .from('email_index')
        .insert(testEmails);
      
      if (insertError) {
        throw insertError;
      }
    }
    
    console.log('\n✅ Insert result:', data || { success: 100 });
    
    // Verify
    const { count } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', account.id);
    
    console.log(`\n📊 Total emails for Zarfin: ${count}`);
    
    // Check for NULL user_ids
    const { count: nullCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', account.id)
      .is('user_id', null);
    
    if (nullCount > 0) {
      console.error(`❌ WARNING: ${nullCount} emails have NULL user_id!`);
    } else {
      console.log('✅ All emails have valid user_id!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertTestEmails();
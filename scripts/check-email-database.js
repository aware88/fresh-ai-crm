#!/usr/bin/env node

/**
 * Check if emails were properly stored in the database after sync
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmailDatabase() {
  try {
    console.log('🔍 Checking email database...');
    
    // Check email_index table
    const { data: indexEmails, error: indexError } = await supabase
      .from('email_index')
      .select('message_id, subject, sender_email, received_at')
      .eq('email_account_id', '0d91ab34-e7b8-4d09-9351-7f22fca4a975') // Zarfin's account
      .order('received_at', { ascending: false })
      .limit(10);
      
    if (indexError) {
      console.error('❌ Error querying email_index:', indexError);
    } else {
      console.log(`✅ Found ${indexEmails?.length || 0} emails in email_index table`);
      if (indexEmails?.length > 0) {
        console.log('📧 Sample emails:');
        indexEmails.slice(0, 3).forEach((email, i) => {
          console.log(`  ${i + 1}. ${email.subject} (from: ${email.sender_email})`);
        });
      }
    }
    
    // Check email_content_cache table
    const { data: contentEmails, error: contentError } = await supabase
      .from('email_content_cache')
      .select('message_id, html_content')
      .limit(5);
      
    if (contentError) {
      console.error('❌ Error querying email_content_cache:', contentError);
    } else {
      console.log(`✅ Found ${contentEmails?.length || 0} emails in email_content_cache table`);
    }
    
    // Check email_accounts table
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('id, email, last_sync_at')
      .eq('id', '0d91ab34-e7b8-4d09-9351-7f22fca4a975');
      
    if (accountsError) {
      console.error('❌ Error querying email_accounts:', accountsError);
    } else if (accounts?.length > 0) {
      const account = accounts[0];
      console.log(`✅ Account ${account.email} last synced: ${account.last_sync_at}`);
    }
    
    // Check for the specific email that failed in AI cache
    const failedEmailId = 'AAMkAGQyYTlmNzNiLWJlMzMtNGIxMy04ZDc4LTM1NTMzOTU0OTAzOQBGAAAAAACA2cA14uuRR56XFaoM8tObBwBnw1LxIWESTpoE9YCUqWS_AAAAAAEMAABnw1LxIWESTpoE9YcUqWS_AATRs9F5AAA=';
    
    const { data: specificEmail, error: specificError } = await supabase
      .from('email_index')
      .select('*')
      .eq('message_id', failedEmailId)
      .single();
      
    if (specificError) {
      console.log(`❌ Specific email not found in database: ${specificError.message}`);
    } else {
      console.log(`✅ Found specific email: ${specificEmail.subject}`);
      console.log(`📋 Email details: user_id=${specificEmail.user_id}, account_id=${specificEmail.email_account_id}`);
    }
    
    // Check user_id consistency  
    console.log('\n🔍 Checking user_id consistency...');
    const expectedUserId = '2aee7a5b-c7b2-41b4-ae23-dddbc6e37718';
    
    const { data: userEmails, error: userError } = await supabase
      .from('email_index')
      .select('message_id, user_id, subject')
      .eq('email_account_id', '0d91ab34-e7b8-4d09-9351-7f22fca4a975')
      .limit(5);
      
    if (userEmails?.length > 0) {
      console.log(`📧 Sample user_id values:`);
      userEmails.forEach((email, i) => {
        const matches = email.user_id === expectedUserId;
        console.log(`  ${i + 1}. ${matches ? '✅' : '❌'} user_id: ${email.user_id} (expected: ${expectedUserId})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkEmailDatabase();
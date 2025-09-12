#!/usr/bin/env node

/**
 * Check email_index table schema and constraints
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking email_index table schema...\n');

  try {
    // First, let's see if we can query the table at all
    const { data: sampleData, error: sampleError } = await supabase
      .from('email_index')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Cannot query email_index table:', sampleError.message);
      return;
    }

    console.log('✅ email_index table exists and is accessible');
    if (sampleData && sampleData.length > 0) {
      console.log('📝 Sample row columns:', Object.keys(sampleData[0]));
    }

    // Check for primary key - try to insert duplicate data to see what fails
    const testMessageId = 'test-duplicate-' + Date.now();
    const testData = {
      message_id: testMessageId,
      user_id: '00000000-0000-0000-0000-000000000000',
      email_account_id: '00000000-0000-0000-0000-000000000001',
      subject: 'Test email',
      sender_email: 'test@example.com'
    };

    console.log('\n🧪 Testing for unique constraints...');
    
    // Try to insert the same data twice
    const { error: firstInsert } = await supabase
      .from('email_index')
      .insert(testData);

    if (firstInsert) {
      console.log('❌ First insert failed:', firstInsert.message);
    } else {
      console.log('✅ First insert succeeded');
      
      // Try duplicate
      const { error: secondInsert } = await supabase
        .from('email_index')
        .insert(testData);

      if (secondInsert) {
        console.log('❌ Second insert failed (expected):', secondInsert.message);
        if (secondInsert.message.includes('duplicate') || secondInsert.message.includes('unique')) {
          console.log('✅ Unique constraint exists on some column');
        }
      } else {
        console.log('⚠️  Second insert also succeeded - no unique constraint?');
      }

      // Clean up test data
      await supabase
        .from('email_index')
        .delete()
        .eq('message_id', testMessageId);
    }

    // Check what the actual ON CONFLICT code is trying to do
    console.log('\n📊 Checking recent sync attempts...');
    const { data: recentEmails, error: recentError } = await supabase
      .from('email_index')
      .select('message_id, user_id, email_account_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentError && recentEmails) {
      console.log('Recent emails:');
      recentEmails.forEach((email, i) => {
        console.log(`  ${i + 1}. ${email.message_id?.substring(0, 30)}... (user: ${email.user_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchema();
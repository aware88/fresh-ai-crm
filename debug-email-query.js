/**
 * Debug script to test the exact query the frontend uses
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugEmailQuery() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  // Use anon client to simulate frontend query
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('🔍 Testing frontend email query...');
    
    const emailAccountId = '0d91ab34-e7b8-4d09-9351-7f22fca4a975';
    
    // Test the exact query from OptimizedEmailService
    console.log('📧 Simulating loadEmails query...');
    
    let query = supabase
      .from('email_index')
      .select('*')
      .eq('email_account_id', emailAccountId);
    
    // INBOX folder filter (same as OptimizedEmailService)
    query = query.or('folder_name.is.null,folder_name.eq.INBOX,folder_name.eq.Inbox');
    
    const { data: emails, error } = await query
      .order('received_at', { ascending: false })
      .range(0, 49); // First 50 emails
      
    console.log(`🔍 Query result: ${emails?.length || 0} emails found`);
    
    if (error) {
      console.error('❌ Query error:', error);
      console.error('Full error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
    }
    
    if (emails && emails.length > 0) {
      console.log('✅ Found emails:');
      emails.slice(0, 5).forEach((email, i) => {
        console.log(`   ${i+1}. ${email.subject || 'No Subject'}`);
        console.log(`      From: ${email.sender_email}`);
        console.log(`      Folder: ${email.folder_name}`);
        console.log(`      Received: ${email.received_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugEmailQuery();
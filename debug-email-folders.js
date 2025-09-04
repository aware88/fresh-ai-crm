/**
 * Debug script to check email folder names in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugEmailFolders() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Checking email folder names for account: zarfin.jakupovic@withcar.si');
    
    // First get the account ID
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('id, email')
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .single();

    if (accountError || !account) {
      console.error('❌ Account not found:', accountError);
      return;
    }

    console.log(`✅ Found account: ${account.email} (ID: ${account.id})`);

    // Check folder names and counts
    const { data: folderStats, error: folderError } = await supabase
      .from('email_index')
      .select('folder_name')
      .eq('email_account_id', account.id);

    if (folderError) {
      console.error('❌ Error getting folder stats:', folderError);
      return;
    }

    console.log(`📊 Total emails found: ${folderStats.length}`);

    // Group by folder name
    const folderCounts = {};
    folderStats.forEach(email => {
      const folder = email.folder_name || 'NULL';
      folderCounts[folder] = (folderCounts[folder] || 0) + 1;
    });

    console.log('📁 Folder breakdown:');
    Object.entries(folderCounts).forEach(([folder, count]) => {
      console.log(`   ${folder}: ${count} emails`);
    });

    // Sample a few emails to see their details
    console.log('\n📧 Sample emails:');
    const { data: samples, error: sampleError } = await supabase
      .from('email_index')
      .select('message_id, subject, folder_name, email_type, sender_email')
      .eq('email_account_id', account.id)
      .limit(5);

    if (!sampleError && samples) {
      samples.forEach((email, i) => {
        console.log(`   ${i+1}. ${email.subject || 'No Subject'}`);
        console.log(`      From: ${email.sender_email}`);
        console.log(`      Folder: ${email.folder_name || 'NULL'}`);
        console.log(`      Type: ${email.email_type}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugEmailFolders();
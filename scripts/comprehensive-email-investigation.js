const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensiveEmailInvestigation() {
  console.log('🔍 COMPREHENSIVE EMAIL INVESTIGATION');
  console.log('=====================================');
  
  const userId = '2aee7a5b-c7b2-41b4-ae23-dddbc6e37718';
  
  try {
    // 1. Check for duplicate emails by message_id
    console.log('\n1️⃣ CHECKING FOR DUPLICATE EMAILS BY MESSAGE_ID');
    console.log('-----------------------------------------------');
    
    const { data: duplicateCheck } = await supabase
      .from('email_index')
      .select('message_id, count')
      .eq('user_id', userId);
    
    if (duplicateCheck) {
      const messageIds = {};
      duplicateCheck.forEach(email => {
        if (messageIds[email.message_id]) {
          messageIds[email.message_id]++;
        } else {
          messageIds[email.message_id] = 1;
        }
      });
      
      const duplicates = Object.keys(messageIds).filter(id => messageIds[id] > 1);
      console.log(`📧 Total unique message IDs: ${Object.keys(messageIds).length}`);
      console.log(`🔄 Duplicate message IDs found: ${duplicates.length}`);
      
      if (duplicates.length > 0) {
        console.log('⚠️ DUPLICATES DETECTED:');
        duplicates.slice(0, 5).forEach(msgId => {
          console.log(`  - ${msgId}: ${messageIds[msgId]} copies`);
        });
      }
    }
    
    // 2. Detailed sent emails analysis
    console.log('\n2️⃣ DETAILED SENT EMAILS ANALYSIS');
    console.log('--------------------------------');
    
    const { data: sentEmails } = await supabase
      .from('email_index')
      .select('*')
      .eq('user_id', userId)
      .eq('email_type', 'sent')
      .order('created_at', { ascending: false });
    
    if (sentEmails) {
      console.log(`📤 Total sent emails in database: ${sentEmails.length}`);
      
      console.log('\nDETAILED SENT EMAIL LIST:');
      sentEmails.forEach((email, i) => {
        console.log(`\n📧 SENT EMAIL #${i + 1}:`);
        console.log(`   Message ID: ${email.message_id}`);
        console.log(`   Subject: ${email.subject || 'No subject'}`);
        console.log(`   Sent At: ${email.sent_at}`);
        console.log(`   Created At: ${email.created_at}`);
        console.log(`   Recipient: ${email.recipient_email || 'N/A'}`);
        console.log(`   Folder: ${email.folder_name || 'N/A'}`);
      });
      
      // Check for duplicates in sent emails by subject/timestamp
      console.log('\n🔍 CHECKING SENT EMAIL DUPLICATES:');
      const sentBySubject = {};
      sentEmails.forEach(email => {
        const key = `${email.subject}_${email.sent_at}`;
        if (sentBySubject[key]) {
          sentBySubject[key]++;
        } else {
          sentBySubject[key] = 1;
        }
      });
      
      const sentDuplicates = Object.keys(sentBySubject).filter(key => sentBySubject[key] > 1);
      if (sentDuplicates.length > 0) {
        console.log('⚠️ SENT EMAIL DUPLICATES FOUND:');
        sentDuplicates.forEach(key => {
          console.log(`  - ${key}: ${sentBySubject[key]} copies`);
        });
      } else {
        console.log('✅ No sent email duplicates found by subject+timestamp');
      }
    }
    
    // 3. Check email account configuration for sent folder access
    console.log('\n3️⃣ EMAIL ACCOUNT CONFIGURATION CHECK');
    console.log('------------------------------------');
    
    const { data: account } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (account) {
      console.log(`📧 Account: ${account.email}`);
      console.log(`🔑 Provider: ${account.provider || 'Not set'}`);
      console.log(`🔑 Has Access Token: ${!!account.access_token}`);
      console.log(`⏰ Token Expires: ${account.token_expires_at}`);
      console.log(`📂 Account Type: ${account.account_type || 'Not set'}`);
      console.log(`🔧 Sync Settings: Active=${account.is_active}, Real-time=${account.real_time_sync_active}`);
    }
    
    // 4. Check Microsoft Graph folder structure
    console.log('\n4️⃣ CHECKING ALL EMAIL FOLDERS');
    console.log('------------------------------');
    
    const { data: folderStats } = await supabase
      .from('email_index')
      .select('folder_name, email_type')
      .eq('user_id', userId);
    
    if (folderStats) {
      const folders = {};
      folderStats.forEach(email => {
        const key = `${email.folder_name || 'Unknown'}_${email.email_type}`;
        if (folders[key]) {
          folders[key]++;
        } else {
          folders[key] = 1;
        }
      });
      
      console.log('📁 EMAIL DISTRIBUTION BY FOLDER:');
      Object.keys(folders).forEach(folder => {
        console.log(`  ${folder}: ${folders[folder]} emails`);
      });
    }
    
    // 5. Timeline analysis
    console.log('\n5️⃣ TIMELINE ANALYSIS');
    console.log('--------------------');
    
    const { data: timeline } = await supabase
      .from('email_index')
      .select('email_type, created_at, received_at, sent_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (timeline) {
      console.log('📅 RECENT EMAIL ACTIVITY (Last 20 emails):');
      timeline.forEach((email, i) => {
        const timestamp = email.sent_at || email.received_at || email.created_at;
        console.log(`  ${i + 1}. ${email.email_type.toUpperCase()}: ${timestamp}`);
      });
    }
    
    // 6. Final summary and recommendations
    console.log('\n🎯 INVESTIGATION SUMMARY');
    console.log('=======================');
    
    const totalEmails = duplicateCheck ? duplicateCheck.length : 0;
    const sentCount = sentEmails ? sentEmails.length : 0;
    const receivedCount = totalEmails - sentCount;
    
    console.log(`📊 Total emails: ${totalEmails}`);
    console.log(`📥 Received: ${receivedCount}`);
    console.log(`📤 Sent: ${sentCount}`);
    console.log(`📈 Sent/Total ratio: ${((sentCount/totalEmails)*100).toFixed(1)}%`);
    
    if (sentCount < 10) {
      console.log('\n🤔 ANALYSIS: Very low sent email count detected');
      console.log('   Possible reasons:');
      console.log('   1. Account primarily receives emails (supplier/vendor relationship)');
      console.log('   2. Microsoft Graph API permission issues for Sent folder');
      console.log('   3. User sends emails from different account/client');
      console.log('   4. Sent folder sync not working properly');
      console.log('   5. Email retention policies removing old sent emails');
    }
    
  } catch (error) {
    console.error('❌ Investigation error:', error);
  }
}

comprehensiveEmailInvestigation();
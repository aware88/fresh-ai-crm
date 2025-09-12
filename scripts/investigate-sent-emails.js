const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateSentEmails() {
  console.log('🔍 Investigating the missing sent emails mystery...');
  
  try {
    // Get Zarfin's account details
    const { data: account, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .single();
    
    if (error || !account) {
      console.error('❌ Cannot find account:', error);
      return;
    }
    
    console.log('📧 Account found:', account.email);
    console.log('🔑 Has access token:', !!account.access_token);
    console.log('🔑 Token expires:', account.token_expires_at);
    console.log('📂 Account provider:', account.provider);
    
    // Check recent sync activity
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    console.log('\n📊 Recent email additions (last 2 hours):');
    const { data: recentEmails } = await supabase
      .from('email_index')
      .select('email_type, created_at, subject')
      .eq('user_id', account.user_id)
      .gte('created_at', twoHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (recentEmails && recentEmails.length > 0) {
      const received = recentEmails.filter(e => e.email_type === 'received').length;
      const sent = recentEmails.filter(e => e.email_type === 'sent').length;
      console.log('📥 Recent received:', received);
      console.log('📤 Recent sent:', sent);
      
      console.log('\n📤 Sent emails found:');
      const sentEmails = recentEmails.filter(e => e.email_type === 'sent');
      sentEmails.forEach(email => {
        console.log(`  - ${email.created_at}: ${email.subject || 'No subject'}`);
      });
    } else {
      console.log('📭 No recent emails found');
    }
    
    // Check all sent emails ever
    console.log('\n📤 All sent emails in database:');
    const { data: allSentEmails } = await supabase
      .from('email_index')
      .select('created_at, subject, sent_at')
      .eq('user_id', account.user_id)
      .eq('email_type', 'sent')
      .order('created_at', { ascending: false });
    
    if (allSentEmails) {
      console.log(`Total sent emails: ${allSentEmails.length}`);
      allSentEmails.forEach((email, i) => {
        console.log(`  ${i+1}. ${email.sent_at || email.created_at}: ${email.subject || 'No subject'}`);
      });
    }
    
    console.log('\n🤔 Analysis:');
    if (allSentEmails && allSentEmails.length < 10) {
      console.log('💡 Possible reasons for low sent email count:');
      console.log('  1. Zarfin\'s Microsoft account genuinely has few sent emails');
      console.log('  2. Microsoft Graph API failed to access Sent Items folder');
      console.log('  3. Force sync script encountered an error during sent email processing');
      console.log('  4. Microsoft permissions don\'t include sent items access');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

investigateSentEmails();
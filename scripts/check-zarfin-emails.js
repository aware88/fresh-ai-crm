/**
 * Check Zarfin's current email status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmails() {
  console.log('📧 CHECKING ZARFIN\'S EMAIL STATUS\n');
  
  try {
    // Find Zarfin's account
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('*')
      .ilike('email', '%zarfin%');
    
    if (!accounts?.length) {
      console.error('❌ Cannot find Zarfin\'s account');
      return;
    }
    
    const account = accounts[0];
    console.log(`📧 Account: ${account.email}`);
    console.log(`Provider: ${account.provider_type}`);
    console.log(`Last sync: ${account.last_sync_at}`);
    console.log(`Real-time sync: ${account.real_time_sync_active ? '✅ Active' : '❌ Inactive'}`);
    console.log(`Account ID: ${account.id}\n`);
    
    // Count total emails
    const { count: totalCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', account.id);
    
    console.log(`📊 Total emails in database: ${totalCount || 0}`);
    
    // Get most recent emails
    const { data: recent } = await supabase
      .from('email_index')
      .select('subject, received_at, sender_email')
      .eq('email_account_id', account.id)
      .order('received_at', { ascending: false })
      .limit(10);
    
    if (recent?.length) {
      console.log('\n📧 Most recent emails:');
      recent.forEach((email, idx) => {
        const date = new Date(email.received_at);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        let timeAgo = '';
        if (diffDays > 0) {
          timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
          timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        }
        
        console.log(`\n   ${idx + 1}. "${email.subject}"`);
        console.log(`      From: ${email.sender_email}`);
        console.log(`      Date: ${date.toLocaleString()} (${timeAgo})`);
      });
      
      // Check if emails are old
      const mostRecentDate = new Date(recent[0].received_at);
      const daysSinceLastEmail = Math.floor((new Date() - mostRecentDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastEmail > 1) {
        console.log(`\n⚠️  WARNING: Emails are ${daysSinceLastEmail} days old! Sync may not be working.`);
        console.log('   Please use the "Force Full Sync" button in the email dashboard.');
      } else if (daysSinceLastEmail === 1) {
        console.log(`\n⚠️  Note: Most recent email is 1 day old.`);
      } else {
        console.log(`\n✅ Emails are up to date!`);
      }
    } else {
      console.log('\n❌ No emails found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEmails().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
});
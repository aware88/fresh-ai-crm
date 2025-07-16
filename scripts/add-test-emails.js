const { createClient } = require('@supabase/supabase-js');

async function addTestEmails() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Adding test emails...\n');
    
    // Get the Google email account
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('provider_type', 'google')
      .eq('is_active', true)
      .limit(1);
    
    if (accountsError) {
      console.error('❌ Error fetching email accounts:', accountsError);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('❌ No Google email accounts found');
      return;
    }
    
    const account = accounts[0];
    console.log(`✅ Using account: ${account.email}`);
    
    // Create test emails
    const testEmails = [
      {
        user_id: account.user_id,
        email_account_id: account.id,
        message_id: `test-email-1-${Date.now()}`,
        subject: 'Welcome to Fresh AI CRM!',
        sender: 'support@freshaicrm.com',
        recipient: account.email,
        raw_content: 'Welcome to Fresh AI CRM! We are excited to have you on board. This is a test email to demonstrate the email dashboard functionality.',
        text_content: 'Welcome to Fresh AI CRM! We are excited to have you on board. This is a test email to demonstrate the email dashboard functionality.',
        analysis: 'This is a welcome email with positive sentiment. The sender is introducing the CRM system and expressing excitement about the user joining.',
        received_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        read: false,
        is_processed: true,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: account.user_id,
        email_account_id: account.id,
        message_id: `test-email-2-${Date.now()}`,
        subject: 'Important: Action Required for Your Account',
        sender: 'alerts@freshaicrm.com',
        recipient: account.email,
        raw_content: 'Hello! We noticed some unusual activity on your account. Please review your recent login history and update your password if necessary. If you have any questions, please contact our support team.',
        text_content: 'Hello! We noticed some unusual activity on your account. Please review your recent login history and update your password if necessary. If you have any questions, please contact our support team.',
        analysis: 'This is a security alert email with urgent tone. The sender is informing about unusual activity and requesting action from the user.',
        received_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        read: false,
        is_processed: true,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: account.user_id,
        email_account_id: account.id,
        message_id: `test-email-3-${Date.now()}`,
        subject: 'Your Weekly CRM Report is Ready',
        sender: 'reports@freshaicrm.com',
        recipient: account.email,
        raw_content: 'Your weekly CRM report is now available. This week you processed 15 contacts, sent 8 emails, and closed 3 deals. Great work! You can view the detailed report in your dashboard.',
        text_content: 'Your weekly CRM report is now available. This week you processed 15 contacts, sent 8 emails, and closed 3 deals. Great work! You can view the detailed report in your dashboard.',
        analysis: 'This is a weekly report email with positive business metrics. The sender is providing performance summary and encouraging the user.',
        received_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read: true,
        is_processed: true,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: account.user_id,
        email_account_id: account.id,
        message_id: `test-email-4-${Date.now()}`,
        subject: 'New Feature: AI Email Analysis',
        sender: 'product@freshaicrm.com',
        recipient: account.email,
        raw_content: 'We are excited to announce a new feature: AI-powered email analysis! This feature automatically analyzes your emails for sentiment, priority, and suggested actions. Try it out in your email dashboard.',
        text_content: 'We are excited to announce a new feature: AI-powered email analysis! This feature automatically analyzes your emails for sentiment, priority, and suggested actions. Try it out in your email dashboard.',
        analysis: 'This is a product announcement email with exciting news about AI features. The sender is introducing new functionality and encouraging usage.',
        received_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        read: false,
        is_processed: true,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: account.user_id,
        email_account_id: account.id,
        message_id: `test-email-5-${Date.now()}`,
        subject: 'Meeting Reminder: Team Sync Tomorrow',
        sender: 'team@company.com',
        recipient: account.email,
        raw_content: 'Hi Tim, just a reminder that we have our weekly team sync meeting tomorrow at 10 AM. We will be discussing the Q1 roadmap and reviewing the current project status. Please prepare your updates.',
        text_content: 'Hi Tim, just a reminder that we have our weekly team sync meeting tomorrow at 10 AM. We will be discussing the Q1 roadmap and reviewing the current project status. Please prepare your updates.',
        analysis: 'This is a meeting reminder email with professional tone. The sender is reminding about a scheduled meeting and requesting preparation.',
        received_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        read: false,
        is_processed: true,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Insert test emails
    console.log(`💾 Inserting ${testEmails.length} test emails...`);
    
    const { data: insertedEmails, error: insertError } = await supabase
      .from('emails')
      .insert(testEmails)
      .select('id, subject, sender');
    
    if (insertError) {
      console.error('❌ Error inserting test emails:', insertError);
      return;
    }
    
    console.log(`✅ Successfully inserted ${insertedEmails?.length || 0} test emails:`);
    
    insertedEmails?.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email.subject} (from: ${email.sender})`);
    });
    
    console.log('\n🎉 Test emails added successfully!');
    console.log('💡 You can now refresh your email dashboard to see the test emails.');
    console.log('🔄 To start the development server: npm run dev');
    
  } catch (error) {
    console.error('💥 Exception adding test emails:', error);
  }
}

addTestEmails(); 
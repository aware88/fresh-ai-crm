import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    console.log('🔍 Checking IMAP sync results for sent emails...');
    
    // Check all emails by type and folder
    const { data: allEmails, error: allError } = await supabase
      .from('email_index')
      .select(`
        id, 
        message_id, 
        subject, 
        sender_email, 
        recipient_email, 
        folder_name, 
        email_type, 
        is_read, 
        sent_at, 
        received_at, 
        created_at,
        processing_status
      `)
      .eq('email_account_id', '9c10c0d6-b92b-4581-b81a-db5df168d5ff')
      .order('created_at', { ascending: false })
      .limit(50);

    if (allError) {
      console.error('Error fetching emails:', allError);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    // Group emails by folder and type
    const emailStats = {
      total: allEmails?.length || 0,
      by_folder: {},
      by_type: {},
      by_processing_status: {},
      sent_folder_emails: [],
      inbox_folder_emails: [],
      recent_sync_emails: []
    };

    allEmails?.forEach(email => {
      const folder = email.folder_name || 'unknown';
      const type = email.email_type || 'unknown';
      const status = email.processing_status || 'unknown';
      
      emailStats.by_folder[folder] = (emailStats.by_folder[folder] || 0) + 1;
      emailStats.by_type[type] = (emailStats.by_type[type] || 0) + 1;
      emailStats.by_processing_status[status] = (emailStats.by_processing_status[status] || 0) + 1;
      
      if (folder === 'Sent') {
        emailStats.sent_folder_emails.push({
          subject: email.subject,
          sender_email: email.sender_email,
          recipient_email: email.recipient_email,
          email_type: email.email_type,
          created_at: email.created_at,
          message_id: email.message_id
        });
      }
      
      if (folder === 'INBOX') {
        emailStats.inbox_folder_emails.push({
          subject: email.subject,
          sender_email: email.sender_email,
          email_type: email.email_type,
          created_at: email.created_at
        });
      }
      
      // Check if this was synced recently (within last 24 hours)
      const createdDate = new Date(email.created_at);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (createdDate > yesterday) {
        emailStats.recent_sync_emails.push({
          subject: email.subject,
          folder_name: email.folder_name,
          email_type: email.email_type,
          created_at: email.created_at,
          processing_status: email.processing_status
        });
      }
    });

    console.log('📊 IMAP Sync Analysis:');
    console.log(`- Total emails in DB: ${emailStats.total}`);
    console.log(`- Sent folder emails: ${emailStats.by_folder['Sent'] || 0}`);
    console.log(`- INBOX folder emails: ${emailStats.by_folder['INBOX'] || 0}`);
    console.log(`- Recent sync emails (24h): ${emailStats.recent_sync_emails.length}`);
    
    return NextResponse.json({
      success: true,
      stats: emailStats,
      analysis: {
        total_emails: emailStats.total,
        sent_emails_in_db: emailStats.by_folder['Sent'] || 0,
        inbox_emails_in_db: emailStats.by_folder['INBOX'] || 0,
        recent_synced: emailStats.recent_sync_emails.length,
        missing_sent_emails: emailStats.by_folder['Sent'] < 10 ? 'Likely missing sent emails from IMAP sync' : 'Sent emails present'
      }
    });

  } catch (error) {
    console.error('IMAP sync check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}















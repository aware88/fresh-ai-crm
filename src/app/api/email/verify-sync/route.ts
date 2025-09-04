import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    // Check emails by folder and type
    const { data: allEmails, error } = await supabase
      .from('email_index')
      .select(`
        id, 
        message_id, 
        subject, 
        sender_email, 
        recipient_email, 
        folder_name, 
        email_type, 
        created_at
      `)
      .eq('email_account_id', '9c10c0d6-b92b-4581-b81a-db5df168d5ff')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    // Group by folder and type
    const stats = {
      total: allEmails?.length || 0,
      by_folder: {},
      by_type: {},
      recent_sent_emails: [],
      recent_inbox_emails: []
    };

    allEmails?.forEach(email => {
      const folder = email.folder_name || 'unknown';
      const type = email.email_type || 'unknown';
      
      stats.by_folder[folder] = (stats.by_folder[folder] || 0) + 1;
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;
      
      if (folder === 'Sent') {
        stats.recent_sent_emails.push({
          subject: email.subject,
          sender_email: email.sender_email,
          recipient_email: email.recipient_email,
          created_at: email.created_at
        });
      } else if (folder === 'INBOX') {
        stats.recent_inbox_emails.push({
          subject: email.subject,
          sender_email: email.sender_email,
          created_at: email.created_at
        });
      }
    });

    return NextResponse.json({
      success: true,
      stats,
      message: `Found ${stats.by_folder['Sent'] || 0} sent emails and ${stats.by_folder['INBOX'] || 0} inbox emails`
    });

  } catch (error) {
    console.error('Verify sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}















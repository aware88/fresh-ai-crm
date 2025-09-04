import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    console.log('🔍 Checking sent emails in database...');
    
    // Check all emails for the user
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
        email_account_id
      `)
      .eq('email_account_id', '9c10c0d6-b92b-4581-b81a-db5df168d5ff')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('Error fetching all emails:', allError);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    // Check specifically sent emails
    const { data: sentEmails, error: sentError } = await supabase
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
        created_at
      `)
      .eq('email_account_id', '9c10c0d6-b92b-4581-b81a-db5df168d5ff')
      .eq('folder_name', 'Sent')
      .order('created_at', { ascending: false });

    if (sentError) {
      console.error('Error fetching sent emails:', sentError);
      return NextResponse.json({ error: 'Failed to fetch sent emails' }, { status: 500 });
    }

    // Check email content cache
    const { data: emailContent, error: contentError } = await supabase
      .from('email_content_cache')
      .select('message_id, subject, content_text, content_html')
      .in('message_id', sentEmails?.map(e => e.message_id) || []);

    console.log('📊 Email Statistics:');
    console.log(`- Total emails: ${allEmails?.length || 0}`);
    console.log(`- Sent emails: ${sentEmails?.length || 0}`);
    console.log(`- Email content cached: ${emailContent?.length || 0}`);

    const stats = {
      total_emails: allEmails?.length || 0,
      sent_emails: sentEmails?.length || 0,
      inbox_emails: allEmails?.filter(e => e.folder_name === 'INBOX').length || 0,
      by_folder: {},
      by_type: {}
    };

    // Group by folder and type
    allEmails?.forEach(email => {
      const folder = email.folder_name || 'unknown';
      const type = email.email_type || 'unknown';
      
      stats.by_folder[folder] = (stats.by_folder[folder] || 0) + 1;
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      stats,
      all_emails: allEmails,
      sent_emails: sentEmails,
      email_content: emailContent
    });

  } catch (error) {
    console.error('Debug sent emails error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}















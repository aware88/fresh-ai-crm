import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { randomUUID } from 'crypto';
import { smtpEmailService } from '@/lib/email/smtp-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, cc, bcc, subject, body: emailBody, attachments, priority } = body;

    // Validate required fields
    if (!to || to.length === 0 || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and body are required' },
        { status: 400 }
      );
    }

    // Store the sent email in our database
    // Note: This stores the email as "sent" in the system
    // For actual email delivery, you can integrate with services like:
    // - SMTP server, SendGrid, AWS SES, Microsoft Graph API, Gmail API

    const supabase = createServiceRoleClient();
    
    // Get user's email account (we'll use the first one for sending)
    const { data: emailAccount, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1)
      .single();

    console.log('Email account query result:', { emailAccount, accountError, userId: session.user.id });

    if (!emailAccount) {
      return NextResponse.json(
        { error: 'No email account configured. Please add an email account first.' },
        { status: 400 }
      );
    }

    console.log('Using email account:', {
      id: emailAccount.id,
      email: emailAccount.email,
      email_address: emailAccount.email_address,
      display_name: emailAccount.display_name
    });

    // Generate a unique message ID
    const messageId = `sent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Format recipients as strings
    const formatRecipients = (recipients: any) => {
      if (Array.isArray(recipients)) {
        return recipients.map(r => typeof r === 'string' ? r : r.email || r.address || String(r)).join(', ');
      }
      return typeof recipients === 'string' ? recipients : recipients?.email || recipients?.address || String(recipients);
    };

    // First, actually send the email via SMTP
    const emailRecipients = Array.isArray(to) 
      ? to.map(t => typeof t === 'string' ? { email: t } : t)
      : [typeof to === 'string' ? { email: to } : to];
    
    const ccRecipients = cc && cc.length > 0
      ? (Array.isArray(cc) ? cc.map(c => typeof c === 'string' ? { email: c } : c) : [typeof cc === 'string' ? { email: cc } : cc])
      : undefined;
    
    const bccRecipients = bcc && bcc.length > 0
      ? (Array.isArray(bcc) ? bcc.map(b => typeof b === 'string' ? { email: b } : b) : [typeof bcc === 'string' ? { email: bcc } : bcc])
      : undefined;

    const sendResult = await smtpEmailService.sendEmail(emailAccount, {
      to: emailRecipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject: subject,
      htmlBody: emailBody,
      plainBody: emailBody.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
      attachments: attachments || []
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: `Failed to send email: ${sendResult.error}` },
        { status: 500 }
      );
    }

    console.log('✅ Email sent via SMTP, now storing in database...');

    // Generate a simple thread ID (required by email_index table)
    const threadId = randomUUID();

    // Store the sent email in our database
    const emailIndexData = {
      message_id: messageId,
      thread_id: threadId, // Reference the thread we just created
      email_account_id: emailAccount.id,
      subject: subject,
      sender_email: emailAccount.email || emailAccount.email_address, // Use 'email' field from the account
      sender_name: emailAccount.display_name || emailAccount.email || emailAccount.email_address,
      recipient_email: formatRecipients(to),
      email_type: 'sent',
      folder_name: 'Sent', // Set the folder name for sent emails
      has_attachments: attachments && attachments.length > 0,
      attachment_count: attachments ? attachments.length : 0,
      is_read: true, // Sent emails are considered "read"
      processing_status: 'processed',
      sent_at: new Date().toISOString(),
      received_at: new Date().toISOString(), // For sent emails, use sent time as received time
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into email_index
    const { error: indexError } = await supabase
      .from('email_index')
      .insert([emailIndexData]);

    if (indexError) {
      console.error('Error storing sent email:', indexError);
      return NextResponse.json(
        { error: 'Failed to store sent email' },
        { status: 500 }
      );
    }

    // Store email content
    const contentData = {
      message_id: messageId,
      html_content: emailBody,
      plain_content: emailBody.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
      cached_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      access_count: 1
    };

    const { error: contentError } = await supabase
      .from('email_content_cache')
      .insert([contentData]);

    if (contentError) {
      console.error('Error storing email content:', contentError);
      // Don't fail the request for this
    }

    console.log(`✅ Email "${subject}" sent successfully via SMTP and stored in database`);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: messageId,
      smtpMessageId: sendResult.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId } = await params;
    const supabase = createServiceRoleClient();

    // Get email data from email_index and content cache
    const { data: emailIndex, error: indexError } = await supabase
      .from('email_index')
      .select(`
        *,
        email_accounts!inner(user_id)
      `)
      .eq('message_id', messageId)
      .eq('email_accounts.user_id', session.user.id)
      .single();

    if (indexError || !emailIndex) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Get email content from cache
    const { data: contentData } = await supabase
      .from('email_content_cache')
      .select('html_content, plain_content, raw_content, attachments')
      .eq('message_id', messageId)
      .single();

    // If no cached content, try to fetch from email provider on-demand
    let finalContent = contentData;
    if (!contentData?.html_content && !contentData?.plain_content) {
      console.log('📧 No cached content found, attempting provider fetch for:', messageId);
      
      // Get account provider type to determine which API to use
      const providerType = emailIndex.email_accounts?.provider_type || 'imap';
      console.log(`📧 Account provider type: ${providerType}`);
      
      let fetchEndpoint;
      switch (providerType) {
        case 'google':
        case 'gmail':
          fetchEndpoint = '/api/email/gmail-fetch';
          break;
        case 'microsoft':
        case 'outlook':
          fetchEndpoint = '/api/email/graph-fetch';
          break;
        case 'imap':
        default:
          fetchEndpoint = '/api/email/imap-fetch';
          break;
      }
      
      try {
        console.log(`📧 Using fetch endpoint: ${fetchEndpoint}`);
        const providerResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${fetchEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({
            accountId: emailIndex.email_account_id,
            messageId: messageId,
            folder: emailIndex.folder_name || 'INBOX'
          })
        });
        
        if (providerResponse.ok) {
          const providerData = await providerResponse.json();
          
          if (providerData.success) {
            console.log(`📧 Successfully fetched content via ${providerType} API`);
            
            // Cache the fetched content
            const { error: cacheError } = await supabase
              .from('email_content_cache')
              .upsert({
                message_id: messageId,
                html_content: providerData.html,
                plain_content: providerData.text,
                raw_content: providerData.raw,
                attachments: providerData.attachments || [],
                last_accessed: new Date().toISOString(),
                access_count: 1
              });
              
            if (!cacheError) {
              finalContent = {
                html_content: providerData.html,
                plain_content: providerData.text,
                raw_content: providerData.raw,
                attachments: providerData.attachments || []
              };
            }
          } else {
            console.error(`Failed to fetch via ${providerType}:`, providerData.error);
          }
        } else {
          console.error(`Provider fetch failed with status ${providerResponse.status}`);
        }
      } catch (fetchError) {
        console.error(`Failed to fetch email content via ${providerType}:`, fetchError);
      }
    }

    // Combine the data
    const emailData = {
      ...emailIndex,
      html_content: finalContent?.html_content || null,
      plain_content: finalContent?.plain_content || null,
      raw_content: finalContent?.raw_content || null,
      attachments: finalContent?.attachments || [],
    };

    console.log('📧 Returning email data with content:', {
      messageId,
      hasHtml: !!emailData.html_content,
      htmlLength: emailData.html_content?.length || 0,
      hasPlain: !!emailData.plain_content,
      plainLength: emailData.plain_content?.length || 0,
      hasRaw: !!emailData.raw_content,
      attachmentsCount: emailData.attachments?.length || 0,
      subject: emailData.subject,
      from: emailData.sender_email,
      to: emailData.recipient_email
    });
    
    return NextResponse.json(emailData);
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}















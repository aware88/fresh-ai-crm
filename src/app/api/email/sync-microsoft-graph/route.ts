import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';
import { getValidMicrosoftAccessToken } from '@/lib/services/microsoft-token';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, maxEmails = 100 } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get the Microsoft email account
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', (session.user as any).id)
      .eq('provider_type', 'microsoft')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.log('❌ Microsoft account not found:', { accountId, error: accountError });
      return NextResponse.json(
        { success: false, error: 'Microsoft email account not found or access denied' },
        { status: 404 }
      );
    }

    // Get valid Microsoft access token
    const tokenResult = await getValidMicrosoftAccessToken({ userId: (session.user as any).id });
    
    if (!tokenResult?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Failed to get Microsoft access token. Please reconnect your Microsoft account.' },
        { status: 401 }
      );
    }

    console.log(`📧 Starting Microsoft Graph email sync for ${account.email}...`);

    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(tokenResult.accessToken);
    
    let totalSaved = 0;

    try {
      // Fetch emails from Microsoft Graph
      console.log(`📥 Fetching ${maxEmails} most recent emails from Microsoft Graph...`);
      
      const emails = await graphService.getEmails({ 
        top: maxEmails,
        filter: '' 
      });
      
      console.log(`📧 Fetched ${emails.length} emails from Microsoft Graph`);

      if (emails.length > 0) {
        const saved = await saveGraphEmailsToDatabase(
          supabase, 
          (session.user as any).id, 
          emails, 
          accountId
        );
        
        totalSaved += saved;
        console.log(`💾 Saved ${saved} emails to database`);
      }

      // Update sync metadata
      const { error: updateError } = await supabase
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (updateError) {
        console.error('Warning: Failed to update sync metadata:', updateError);
      }
      
      console.log(`✅ Microsoft Graph email sync complete: ${totalSaved} emails saved`);
      
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${totalSaved} emails from Microsoft Graph`,
        totalSaved,
        syncedAt: new Date().toISOString()
      });
      
    } catch (graphError) {
      console.error('❌ Microsoft Graph API error:', graphError);
      throw graphError;
    }
    
  } catch (error) {
    console.error('❌ Microsoft Graph email sync error:', error);
    
    let errorMessage = 'Failed to sync emails from Microsoft Graph';
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        errorMessage = 'Microsoft authentication failed. Please reconnect your Microsoft account.';
      } else if (error.message.includes('Forbidden') || error.message.includes('403')) {
        errorMessage = 'Microsoft Graph permissions insufficient. Please contact administrator.';
      } else {
        errorMessage = error.message;
      }
    }

    // Save error to email_accounts table
    try {
      const { accountId } = await request.json();
      if (accountId) {
        const supabase = createServiceRoleClient();
        await supabase
          .from('email_accounts')
          .update({
            sync_error: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', accountId);
      }
    } catch (updateError) {
      console.error('Failed to save sync error:', updateError);
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function saveGraphEmailsToDatabase(
  supabase: any, 
  userId: string, 
  emails: any[], 
  accountId: string
) {
  if (emails.length === 0) return 0;
  
  console.log(`💾 Saving ${emails.length} Microsoft Graph emails...`);
  
  let savedCount = 0;
  const batchSize = 10;
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const emailIndexRecords = [];
    const contentCacheRecords = [];
    
    for (const email of batch) {
      if (!email.id) continue;
      
      // Use Microsoft Graph ID as message_id
      const messageId = email.id;
      
      // Check for duplicates in email_index
      const { data: existing } = await supabase
        .from('email_index')
        .select('id')
        .eq('message_id', messageId)
        .eq('email_account_id', accountId)
        .single();
        
      if (existing) {
        console.log(`📧 Email ${messageId} already exists, skipping`);
        continue;
      }
      
      // Determine email type (sent vs received)
      const fromEmail = email.from?.emailAddress?.address?.toLowerCase();
      const accountEmail = await getAccountEmail(supabase, accountId);
      const emailType = fromEmail === accountEmail?.toLowerCase() ? 'sent' : 'received';
      
      // Create email_index record
      const emailIndexRecord = {
        message_id: messageId,
        email_account_id: accountId,
        subject: email.subject || 'No Subject',
        sender_email: email.from?.emailAddress?.address || 'unknown',
        sender_name: email.from?.emailAddress?.name || null,
        recipient_email: email.toRecipients?.[0]?.emailAddress?.address || null,
        email_type: emailType,
        folder_name: emailType === 'sent' ? 'Sent' : 'INBOX',
        thread_id: messageId, // Use message_id as thread_id for simplicity
        sent_at: emailType === 'sent' ? new Date(email.sentDateTime || email.receivedDateTime).toISOString() : null,
        received_at: new Date(email.receivedDateTime).toISOString(),
        has_attachments: email.hasAttachments || false,
        is_read: email.isRead || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Create email_content_cache record
      const contentCacheRecord = {
        message_id: messageId,
        plain_content: email.bodyPreview || null,
        html_content: email.body?.content || null
      };
      
      emailIndexRecords.push(emailIndexRecord);
      contentCacheRecords.push(contentCacheRecord);
    }
    
    if (emailIndexRecords.length > 0) {
      // First, create thread entries for each unique thread_id
      const uniqueThreadIds = [...new Set(emailIndexRecords.map(record => record.message_id))];
      
      for (const threadId of uniqueThreadIds) {
        try {
          await supabase
            .from('email_threads')
            .upsert({ 
              id: threadId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              ignoreDuplicates: true
            });
        } catch (threadError) {
          console.log(`Thread ${threadId} might already exist, continuing...`);
        }
      }
      
      // Insert into email_index
      const { error: indexError } = await supabase
        .from('email_index')
        .insert(emailIndexRecords);
        
      if (indexError) {
        console.error(`❌ Error inserting email_index batch:`, indexError.message);
        continue;
      }
      
      // Insert into email_content_cache
      const { error: contentError } = await supabase
        .from('email_content_cache')
        .insert(contentCacheRecords);
        
      if (contentError) {
        console.error(`❌ Error inserting content_cache batch:`, contentError.message);
        continue;
      }
      
      savedCount += emailIndexRecords.length;
      console.log(`   ✅ Saved batch ${Math.floor(i/batchSize) + 1}: ${emailIndexRecords.length} emails`);
    }
  }
  
  return savedCount;
}

async function getAccountEmail(supabase: any, accountId: string): Promise<string | null> {
  const { data: account } = await supabase
    .from('email_accounts')
    .select('email')
    .eq('id', accountId)
    .single();
    
  return account?.email || null;
}
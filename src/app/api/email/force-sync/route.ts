import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';
import { getValidMicrosoftAccessToken } from '@/lib/services/microsoft-token';

/**
 * CONTROLLED FORCE SYNC ENDPOINT
 * 
 * Uses our new controlled sync approach with precise email counts
 * Perfect for testing and manual sync operations
 */

// Extend timeout for this route to handle large syncs
export const maxDuration = 300; // 5 minutes (Vercel Pro limit)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { 
      accountId, 
      receivedCount = 2500, 
      sentCount = 2500,
      testMode = false 
    } = await request.json();
    
    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 });
    }
    
    console.log(`🎯 CONTROLLED FORCE SYNC: ${receivedCount} received + ${sentCount} sent emails (test=${testMode})`);
    
    const supabase = createServiceRoleClient();

    // Get the Microsoft email account
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
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
    const tokenResult = await getValidMicrosoftAccessToken({ userId: session.user.id });
    
    if (!tokenResult?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Failed to get Microsoft access token. Please reconnect your Microsoft account.' },
        { status: 401 }
      );
    }
    
    console.log(`📧 Starting controlled force sync for ${account.email}...`);

    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(tokenResult.accessToken);
    
    let totalSaved = 0;
    const results = {
      received: 0,
      sent: 0,
      errors: [] as string[]
    };

    try {
      // 1. Fetch received emails (Inbox)
      if (receivedCount > 0) {
        console.log(`📥 Fetching ${receivedCount} received emails...`);
        
        const receivedEmails = await graphService.getEmailsFromFolder('inbox', { 
          top: receivedCount 
        });
        
        console.log(`📧 Fetched ${receivedEmails.length} received emails from Microsoft Graph`);

        if (receivedEmails.length > 0) {
          const saved = await saveControlledEmails(
            supabase, 
            session.user.id, 
            receivedEmails, 
            accountId,
            'received'
          );
          
          results.received = saved;
          totalSaved += saved;
          console.log(`💾 Saved ${saved} received emails to database`);
        }
      }

      // 2. Fetch sent emails (Sent Items)
      if (sentCount > 0) {
        console.log(`📤 Fetching ${sentCount} sent emails...`);
        
        const sentEmails = await graphService.getEmailsFromFolder('sent', { 
          top: sentCount 
        });
        
        console.log(`📧 Fetched ${sentEmails.length} sent emails from Microsoft Graph`);

        if (sentEmails.length > 0) {
          const saved = await saveControlledEmails(
            supabase, 
            session.user.id, 
            sentEmails, 
            accountId,
            'sent'
          );
          
          results.sent = saved;
          totalSaved += saved;
          console.log(`💾 Saved ${saved} sent emails to database`);
        }
      }

    } catch (graphError) {
      console.error('❌ Microsoft Graph API error:', graphError);
      throw graphError;
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
    
    console.log(`✅ Controlled force sync complete: ${totalSaved} emails saved`);
    console.log(`📊 Breakdown: ${results.received} received + ${results.sent} sent`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalSaved} emails (${results.received} received + ${results.sent} sent)`,
      results,
      totalSaved,
      syncedAt: new Date().toISOString(),
      testMode
    });
    
  } catch (error) {
    console.error('❌ Controlled email sync error:', error);
    
    let errorMessage = 'Failed to sync emails';
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        errorMessage = 'Microsoft authentication failed. Please reconnect your Microsoft account.';
      } else if (error.message.includes('Forbidden') || error.message.includes('403')) {
        errorMessage = 'Microsoft Graph permissions insufficient. Please contact administrator.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Save emails with controlled processing and duplicate prevention
 */
async function saveControlledEmails(
  supabase: any, 
  userId: string, 
  emails: any[], 
  accountId: string,
  emailType: 'received' | 'sent'
) {
  if (emails.length === 0) return 0;
  
  console.log(`💾 Saving ${emails.length} ${emailType} emails...`);
  
  let savedCount = 0;
  const batchSize = 10;
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const emailIndexRecords = [];
    const contentCacheRecords = [];
    
    for (const email of batch) {
      if (!email.id) continue;
      
      const messageId = email.id;
      
      // Check for duplicates
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
      
      // Get account email for type detection
      const accountEmail = await getAccountEmail(supabase, accountId);
      
      // Determine email type more accurately
      const fromEmail = email.from?.emailAddress?.address?.toLowerCase();
      const actualEmailType = fromEmail === accountEmail?.toLowerCase() ? 'sent' : 'received';
      
      // Use the determined type, but validate against expected type
      const finalEmailType = emailType === 'sent' ? 'sent' : 'received';
      
      // Create email_index record
      const emailIndexRecord = {
        message_id: messageId,
        email_account_id: accountId,
        user_id: userId,
        organization_id: await getOrganizationId(supabase, accountId),
        subject: email.subject || 'No Subject',
        sender_email: email.from?.emailAddress?.address || 'unknown',
        sender_name: email.from?.emailAddress?.name || null,
        recipient_email: email.toRecipients?.[0]?.emailAddress?.address || null,
        email_type: finalEmailType,
        folder_name: finalEmailType === 'sent' ? 'SentItems' : 'INBOX',
        thread_id: messageId,
        sent_at: finalEmailType === 'sent' ? new Date(email.sentDateTime || email.receivedDateTime).toISOString() : null,
        received_at: new Date(email.receivedDateTime || email.sentDateTime).toISOString(),
        has_attachments: email.hasAttachments || false,
        is_read: email.isRead || false,
        preview_text: email.bodyPreview || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Create email_content_cache record
      const contentCacheRecord = {
        message_id: messageId,
        plain_content: email.bodyPreview || null,
        html_content: email.body?.content || null,
        cached_at: new Date().toISOString()
      };
      
      emailIndexRecords.push(emailIndexRecord);
      contentCacheRecords.push(contentCacheRecord);
    }
    
    if (emailIndexRecords.length > 0) {
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
        // Continue even if content cache fails
      }
      
      savedCount += emailIndexRecords.length;
      console.log(`   ✅ Saved batch ${Math.floor(i/batchSize) + 1}: ${emailIndexRecords.length} ${emailType} emails`);
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

async function getOrganizationId(supabase: any, accountId: string): Promise<string | null> {
  const { data: account } = await supabase
    .from('email_accounts')
    .select('organization_id')
    .eq('id', accountId)
    .single();
    
  return account?.organization_id || null;
}
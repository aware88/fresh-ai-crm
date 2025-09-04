import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getValidMicrosoftAccessToken } from '@/lib/services/microsoft-token';
import { getSyncState, setSyncState } from '@/app/api/emails/sync-state';
import { createHash } from 'crypto';

// Convert Microsoft Graph message ID to valid UUID format
function graphIdToUuid(graphId: string): string {
  const hash = createHash('sha256').update(graphId).digest('hex');
  // Format as UUID v4 (with hyphens in correct positions)
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

// Basic Graph fetch helper
async function graphGet(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    // Avoid caching when running in dev
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId, folder = 'inbox', maxEmails = 200, delta = true } = await req.json();
    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: account, error: accErr } = await supabase
      .from('email_accounts')
      .select('id, user_id, email, access_token, refresh_token')
      .eq('id', accountId)
      .eq('user_id', (session.user as any).id)
      .in('provider_type', ['microsoft', 'outlook'])
      .maybeSingle();

    if (accErr || !account) {
      return NextResponse.json({ error: 'Microsoft account not found or access denied' }, { status: 404 });
    }

    const valid = await getValidMicrosoftAccessToken({ userId: (session.user as any).id, accountId });
    if (!valid) return NextResponse.json({ error: 'Missing Microsoft access token' }, { status: 401 });
    const accessToken = valid.accessToken;

    // Fetch messages from the requested folder
    const folderPath = folder.toLowerCase() === 'sent' ? 'sentitems' : 'inbox';
    const top = Math.min(Math.max(Number(maxEmails) || 50, 1), 500);
    const select = 'id,subject,bodyPreview,receivedDateTime,sentDateTime,from,toRecipients,hasAttachments,isRead';
    const listUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderPath}/messages?$top=${top}&$select=${encodeURIComponent(
      select,
    )}&$orderby=${folderPath === 'sentitems' ? 'sentDateTime desc' : 'receivedDateTime desc'}`;

    let list = await graphGet(listUrl, accessToken);
    let messages: any[] = list.value || [];

    // If delta enabled, use delta link for incremental sync
    if (delta) {
      const state = await getSyncState(account.id, 'microsoft');
      const folderKey = `delta_${folderPath}`;
      const cursor = state?.state?.[folderKey];
      try {
        if (cursor) {
          list = await graphGet(cursor, accessToken);
          messages = list.value || [];
        }
        // Follow @odata.nextLink until @odata.deltaLink appears
        let next = (list as any)['@odata.nextLink'];
        while (next) {
          const page = await graphGet(next, accessToken);
          messages = messages.concat(page.value || []);
          next = (page as any)['@odata.nextLink'];
          if ((page as any)['@odata.deltaLink']) {
            await setSyncState(account.id, 'microsoft', {
              ...(state?.state || {}),
              [folderKey]: (page as any)['@odata.deltaLink'],
            });
          }
        }
        if ((list as any)['@odata.deltaLink']) {
          await setSyncState(account.id, 'microsoft', {
            ...(state?.state || {}),
            [folderKey]: (list as any)['@odata.deltaLink'],
          });
        }
      } catch (e) {
        // Fallback to full fetch on cursor errors
      }
    }

    let totalSaved = 0;
    const emailIndexRecords: any[] = [];
    const contentCacheRecords: any[] = [];

    for (const msg of messages) {
      const messageId = msg.id as string;
      const emailType = folderPath === 'sentitems' ? 'sent' : 'received';
      const senderAddr = msg.from?.emailAddress?.address || null;
      const toAddr = (msg.toRecipients?.[0]?.emailAddress?.address as string) || null;

      // Prepare index record
      const indexRecord = {
        email_account_id: account.id,
        user_id: account.user_id,
        message_id: messageId,
        subject: msg.subject || null,
        preview_text: msg.bodyPreview || null,
        sender_email: senderAddr,
        recipient_email: toAddr,
        email_type: emailType,
        folder_name: folderPath === 'sentitems' ? 'Sent' : 'INBOX',
        thread_id: graphIdToUuid(messageId),
        sent_at: emailType === 'sent' ? msg.sentDateTime || null : null,
        received_at: emailType === 'received' ? msg.receivedDateTime || null : msg.sentDateTime || null,
        has_attachments: !!msg.hasAttachments,
        is_read: !!msg.isRead,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      emailIndexRecords.push(indexRecord);

      // We will fetch full body for a subset to prime cache (first 50)
      if (contentCacheRecords.length < Math.min(50, top)) {
        try {
          const detailUrl = `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=body`;
          const detail = await graphGet(detailUrl, accessToken);
          const body = detail?.body || {};
          const html = body?.contentType === 'html' ? body?.content : null;
          const plain = body?.contentType !== 'html' ? body?.content : null;
          contentCacheRecords.push({
            message_id: messageId,
            html_content: html,
            plain_content: plain,
          });
        } catch (e) {
          // ignore content failures for now
        }
      }
    }

    if (emailIndexRecords.length > 0) {
      // Create thread entries with proper UUID format
      const uniqueThreadIds = [...new Set(emailIndexRecords.map((r) => r.thread_id))];
      for (const threadId of uniqueThreadIds) {
        const { error: threadError } = await supabase
          .from('email_threads')
          .upsert(
            { id: threadId, created_at: new Date().toISOString() },
            { onConflict: 'id', ignoreDuplicates: true },
          );
        
        if (threadError) {
          console.warn('Thread upsert error (non-critical):', threadError);
        }
      }

      // Upsert index records by message_id to avoid duplicates
      const { error: idxErr } = await supabase
        .from('email_index')
        .upsert(emailIndexRecords, { onConflict: 'message_id' });
      if (idxErr) {
        return NextResponse.json({ error: idxErr.message }, { status: 500 });
      }
      totalSaved += emailIndexRecords.length;
    }

    if (contentCacheRecords.length > 0) {
      const { error: cacheError } = await supabase
        .from('email_content_cache')
        .upsert(contentCacheRecords, { onConflict: 'message_id' });
      
      if (cacheError) {
        console.warn('Content cache upsert error (non-critical):', cacheError);
      }
    }

    // Update sync metadata on account
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({ last_sync_at: new Date().toISOString(), sync_error: null })
      .eq('id', account.id);
    
    if (updateError) {
      console.warn('Account sync metadata update error (non-critical):', updateError);
    }

    return NextResponse.json({
      success: true,
      totalSaved,
      importCount: totalSaved, // This is what the email page expects
      breakdown: {
        [folderPath === 'sentitems' ? 'sent' : 'inbox']: totalSaved,
      },
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Graph sync error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync from Microsoft Graph' }, { status: 500 });
  }
}

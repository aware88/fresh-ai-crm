import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getValidGoogleAccessToken } from '@/lib/services/google-token';
import { getSyncState, setSyncState } from '@/app/api/emails/sync-state';

async function gmailGet(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    // Check for internal call (from real-time sync)
    const userAgent = req.headers.get('User-Agent') || '';
    const isInternalCall = userAgent.includes('Internal-IMAP-Setup') || 
                          userAgent.includes('Manual-Sync-Script') ||
                          userAgent.includes('Internal-RealTime-Sync') ||
                          userAgent.includes('BackgroundSyncService') ||
                          userAgent.includes('CronRunner');
    
    let userId = null;
    
    if (!isInternalCall) {
      const session = await getServerSession();
      if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userId = (session.user as any).id;
    }

    const { accountId, folder = 'inbox', maxEmails = 200, pageToken, incremental = true } = await req.json();
    if (!accountId) return NextResponse.json({ error: 'accountId is required' }, { status: 400 });

    const supabase = createServiceRoleClient();
    let accountQuery = supabase
      .from('email_accounts')
      .select('id, user_id, email')
      .eq('id', accountId)
      .eq('provider_type', 'google');
    
    // Add user_id filter only for authenticated calls
    if (userId) {
      accountQuery = accountQuery.eq('user_id', userId);
    }
    
    const { data: account, error } = await accountQuery.maybeSingle();
    if (error || !account) return NextResponse.json({ error: 'Google account not found' }, { status: 404 });

    const valid = await getValidGoogleAccessToken({ userId: userId || account.user_id, accountId });
    if (!valid) return NextResponse.json({ error: 'No valid Google token' }, { status: 401 });
    const accessToken = valid.accessToken;

    // Map folder to query with pagination support
    const label = folder.toLowerCase() === 'sent' ? 'SENT' : 'INBOX';
    const q = label === 'INBOX' ? 'in:inbox' : 'in:sent';
    const targetEmails = Math.min(Math.max(Number(maxEmails) || 50, 1), 10000); // Allow up to 10k emails
    const pageSize = Math.min(500, targetEmails); // Gmail max per page is 500
    
    console.log(`📧 Starting Gmail sync for ${account.email}: target=${targetEmails}, pageSize=${pageSize}`);

    // Pagination loop to fetch all requested emails
    let allMessages: any[] = [];
    let currentPageToken: string | undefined = pageToken;
    let pageCount = 0;
    const maxPages = Math.ceil(targetEmails / pageSize);
    
    // Use historyId for incremental sync (only for first page)
    let nextHistoryId: string | null = null;
    if (incremental && !currentPageToken) {
      const state = await getSyncState(account.id, 'google');
      const key = `history_${folder.toLowerCase()}`;
      const historyId = state?.state?.[key];
      if (historyId) {
        try {
          const history = await gmailGet(
            `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}&labelId=${folder.toLowerCase() === 'sent' ? 'SENT' : 'INBOX'}`,
            accessToken,
          );
          nextHistoryId = String(history.historyId || history.latestHistoryId || historyId);
          const ids: string[] = [];
          (history.history || []).forEach((h: any) => {
            (h.messagesAdded || []).forEach((m: any) => ids.push(m.message.id));
          });
          if (ids.length) {
            // Return incremental messages only for delta sync
            console.log(`📧 Gmail incremental sync found ${ids.length} new messages`);
            allMessages = ids.slice(0, targetEmails).map(id => ({ id }));
          }
        } catch (error) {
          console.warn('Gmail history sync failed, falling back to full sync:', error);
        }
      }
    }

    // If not incremental or no incremental results, do full pagination
    if (allMessages.length === 0) {
      while (allMessages.length < targetEmails && pageCount < maxPages) {
        pageCount++;
        const currentPageSize = Math.min(pageSize, targetEmails - allMessages.length);
        
        console.log(`📄 Fetching Gmail page ${pageCount}/${maxPages} (${allMessages.length}/${targetEmails} emails)...`);
        
        let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${currentPageSize}&q=${encodeURIComponent(q)}`;
        if (currentPageToken) url += `&pageToken=${encodeURIComponent(currentPageToken)}`;
        
        const list = await gmailGet(url, accessToken);
        const pageMessages = list.messages || [];
        allMessages = allMessages.concat(pageMessages);
        
        // Get next page token
        currentPageToken = list.nextPageToken;
        
        // Stop if no more pages or we got fewer results than requested
        if (!currentPageToken || pageMessages.length < currentPageSize) {
          console.log(`📭 Reached end of Gmail data at page ${pageCount}`);
          break;
        }
      }
    }
    
    // Trim to exact target if we fetched more
    if (allMessages.length > targetEmails) {
      allMessages = allMessages.slice(0, targetEmails);
    }
    
    console.log(`✅ Gmail fetch complete: ${allMessages.length} emails from ${pageCount} pages`);
    const messages = allMessages;

    const emailIndexRecords: any[] = [];
    const contentCacheRecords: any[] = [];

    for (const m of messages) {
      const msg = await gmailGet(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
        accessToken,
      );

      const headers = (msg.payload?.headers || []) as Array<{ name: string; value: string }>;
      const get = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || null;
      const subject = get('Subject');
      const from = get('From');
      const to = get('To');
      const dateHeader = get('Date');
      const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

      // Extract body (plain or html)
      function decodeBody(body: any) {
        if (!body?.data) return null;
        const str = Buffer.from(body.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        return str;
      }
      let html: string | null = null;
      let plain: string | null = null;
      const parts = msg.payload?.parts || [];
      if (parts.length) {
        for (const p of parts) {
          if (p.mimeType === 'text/html') html = decodeBody(p.body) || html;
          if (p.mimeType === 'text/plain') plain = decodeBody(p.body) || plain;
        }
      } else {
        // Single-part
        const mime = msg.payload?.mimeType || '';
        const body = decodeBody(msg.payload?.body);
        if (mime === 'text/html') html = body; else plain = body;
      }

      const emailType = label === 'SENT' ? 'sent' : 'received';
      emailIndexRecords.push({
        email_account_id: account.id,
        user_id: account.user_id,
        message_id: msg.id,
        subject,
        preview_text: (plain || html || '').slice(0, 200),
        sender_email: from,
        recipient_email: to,
        email_type: emailType,
        folder_name: label === 'SENT' ? 'Sent' : 'INBOX',
        thread_id: msg.threadId,
        sent_at: emailType === 'sent' ? receivedAt : null,
        received_at: receivedAt,
        has_attachments: !!msg.payload?.parts?.some((p: any) => (p.filename || '').length > 0),
        is_read: !(msg.labelIds || []).includes('UNREAD'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      contentCacheRecords.push({
        message_id: msg.id,
        html_content: html,
        plain_content: plain,
      });
    }

    if (emailIndexRecords.length) {
      // Use RPC function to avoid ON CONFLICT issues
      const { data: insertResult, error: rpcError } = await supabase
        .rpc('insert_email_index_batch', {
          p_emails: emailIndexRecords
        });
      
      if (rpcError) {
        console.error('Gmail RPC batch insert error:', rpcError);
      } else {
        console.log('Gmail batch insert result:', insertResult);
      }
      
      // Insert content cache (less critical, can still use upsert)
      await supabase
        .from('email_content_cache')
        .upsert(contentCacheRecords)
        .catch(() => undefined);
      
      // Update account sync metadata
      await supabase
        .from('email_accounts')
        .update({ last_sync_at: new Date().toISOString(), sync_error: null, updated_at: new Date().toISOString() })
        .eq('id', account.id)
        .catch(() => undefined);
    }

    // Save latest historyId
    if (incremental) {
      try {
        const profile = await gmailGet('https://gmail.googleapis.com/gmail/v1/users/me/profile', accessToken);
        const latest = nextHistoryId || String(profile.historyId || '');
        if (latest) {
          const state = await getSyncState(account.id, 'google');
          const key = `history_${folder.toLowerCase()}`;
          await setSyncState(account.id, 'google', { ...(state?.state || {}), [key]: latest });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      totalSaved: emailIndexRecords.length,
      breakdown: { [label === 'SENT' ? 'sent' : 'inbox']: emailIndexRecords.length },
      syncedAt: new Date().toISOString(),
      nextPageToken: list.nextPageToken || null,
    });
  } catch (error: any) {
    console.error('Gmail sync error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import from Gmail' }, { status: 500 });
  }
}

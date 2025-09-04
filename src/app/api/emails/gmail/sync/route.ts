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
    const session = await getServerSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { accountId, folder = 'inbox', maxEmails = 200, pageToken, incremental = true } = await req.json();
    if (!accountId) return NextResponse.json({ error: 'accountId is required' }, { status: 400 });

    const supabase = createServiceRoleClient();
    const { data: account, error } = await supabase
      .from('email_accounts')
      .select('id, user_id')
      .eq('id', accountId)
      .eq('user_id', (session.user as any).id)
      .eq('provider_type', 'google')
      .maybeSingle();
    if (error || !account) return NextResponse.json({ error: 'Google account not found' }, { status: 404 });

    const valid = await getValidGoogleAccessToken({ userId: (session.user as any).id, accountId });
    if (!valid) return NextResponse.json({ error: 'No valid Google token' }, { status: 401 });
    const accessToken = valid.accessToken;

    // Map folder to query
    const label = folder.toLowerCase() === 'sent' ? 'SENT' : 'INBOX';
    const q = label === 'INBOX' ? 'in:inbox' : 'in:sent';
    const limit = Math.min(Math.max(Number(maxEmails) || 50, 1), 500);

    let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}&q=${encodeURIComponent(q)}`;
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
    // Use historyId for incremental sync
    let nextHistoryId: string | null = null;
    if (incremental) {
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
            // Fetch those messages directly
            const msgs = await Promise.all(
              ids.slice(0, limit).map((id) => gmailGet(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, accessToken)),
            );
            // Attach to flow: reuse below processing by converting to same shape
            const messages = msgs.map((m) => ({ id: m.id }));
            // Overwrite first page messages
            (list as any) = { messages };
          }
        } catch {}
      }
    }

    const list = await gmailGet(url, accessToken);
    const messages = list.messages || [];

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
      await supabase
        .from('email_index')
        .upsert(emailIndexRecords, { onConflict: 'message_id' })
        .catch(() => undefined);
      await supabase
        .from('email_content_cache')
        .upsert(contentCacheRecords, { onConflict: 'message_id' })
        .catch(() => undefined);
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

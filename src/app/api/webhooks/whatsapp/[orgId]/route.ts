import { NextRequest, NextResponse } from 'next/server';
import { OrganizationSettingsService } from '@/lib/services/organization-settings-service';
import { createLazyServiceRoleClient } from '@/lib/supabase/lazy-client';
import { v4 as uuidv4 } from 'uuid';

const SETTINGS_KEY = 'whatsapp_integration';

// GET: Verification for Meta WhatsApp Cloud API per organization
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = await params;
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const challenge = url.searchParams.get('hub.challenge');
    const verifyToken = url.searchParams.get('hub.verify_token');

    if (mode !== 'subscribe' || !challenge || !verifyToken) {
      return NextResponse.json({}, { status: 400 });
    }

    const svc = new OrganizationSettingsService();
    const settings = await svc.getSetting<any>(orgId, SETTINGS_KEY);
    if (!settings?.verifyToken) {
      return NextResponse.json({}, { status: 403 });
    }

    if (verifyToken === settings.verifyToken) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return NextResponse.json({}, { status: 403 });
  } catch (error) {
    console.error('WhatsApp webhook verify error:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

// POST: Message delivery for Meta WhatsApp Cloud API per organization
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = await params;
    const payload = await request.json();

    // Verify signature if app secret is configured (Meta x-hub-signature-256)
    try {
      const appSecret = process.env.WHATSAPP_META_APP_SECRET;
      if (appSecret) {
        const signature = request.headers.get('x-hub-signature-256');
        if (signature) {
          const crypto = await import('crypto');
          const rawBody = JSON.stringify(payload);
          const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
          if (signature !== expected) {
            console.warn('Invalid WhatsApp webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
          }
        }
      }
    } catch (e) {
      console.warn('Signature verification skipped due to error:', e);
    }

    // Basic shape check
    const entries = payload?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        const messages = value.messages || [];
        const contacts = value.contacts || [];
        const metadata = value.metadata || {};

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          // Only handle user messages (type text) for now
          const fromPhone = `+${(msg?.from || '').replace(/^\+?/, '')}`;
          const text = msg?.text?.body || '';
          const waMessageId = msg?.id;
          const waTimestamp = msg?.timestamp ? new Date(parseInt(msg.timestamp, 10) * 1000).toISOString() : new Date().toISOString();

          // Create/find contact and create interaction
          const supabase = await createLazyServiceRoleClient();

          // Try to find contact by phone within organization if column exists
          let contactId: string | null = null;
          try {
            const { data: existing, error: findErr } = await supabase
              .from('contacts')
              .select('id')
              .eq('phone', fromPhone)
              .maybeSingle();

            if (!findErr && existing?.id) {
              contactId = existing.id;
            }
          } catch (e) {
            // ignore lookup errors
          }

          // Create contact if missing
          if (!contactId) {
            const placeholderEmail = `wa-${fromPhone.replace(/[^\d]/g, '')}@whatsapp.local`;
            const newContact = {
              id: uuidv4(),
              firstname: contacts?.[i]?.profile?.name || 'WhatsApp',
              lastname: 'Contact',
              email: placeholderEmail,
              phone: fromPhone,
              status: 'active',
              organization_id: orgId,
              createdat: new Date().toISOString(),
              updatedat: new Date().toISOString(),
            } as any;

            const { data: insertContact, error: insertErr } = await supabase
              .from('contacts')
              .insert(newContact)
              .select('id')
              .single();

            if (insertErr) {
              console.error('Failed to create contact for WhatsApp message:', insertErr);
            } else {
              contactId = insertContact?.id || null;
            }
          }

          // Create interaction (store as "other" with metadata.channel = whatsapp), include status if present
          if (contactId) {
            const interaction = {
              id: uuidv4(),
              contact_id: contactId,
              type: 'other',
              title: 'WhatsApp message',
              content: text,
              subject: undefined,
              interaction_date: waTimestamp,
              createdat: waTimestamp,
              updatedat: waTimestamp,
              metadata: {
                channel: 'whatsapp',
                whatsapp: {
                  message_id: waMessageId,
                  from: fromPhone,
                  phone_number_id: metadata?.phone_number_id || value?.metadata?.phone_number_id,
                  status: msg?.status || undefined,
                },
              },
            } as any;

            const { error: insertInteractionErr } = await supabase
              .from('interactions')
              .insert(interaction);

            if (insertInteractionErr) {
              console.error('Failed to create interaction for WhatsApp message:', insertInteractionErr);
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}



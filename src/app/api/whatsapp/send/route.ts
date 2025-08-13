import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OrganizationSettingsService } from '@/lib/services/organization-settings-service';
import { headers } from 'next/headers';

const SETTINGS_KEY = 'whatsapp_integration';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizationId = (session.user as any)?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const { to, message } = await request.json();
    if (!to || !message) return NextResponse.json({ error: 'Missing to or message' }, { status: 400 });

    const svc = new OrganizationSettingsService();
    const settings = await svc.getSetting<any>(organizationId, SETTINGS_KEY);
    if (!settings || settings.status !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 });
    }

    if (settings.provider === 'meta') {
      const accessToken = settings.accessToken;
      const phoneNumberId = settings.phoneNumberId;
      if (!accessToken || !phoneNumberId) {
        return NextResponse.json({ error: 'Missing Meta credentials' }, { status: 400 });
      }
      const apiUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace(/^\+/, ''),
          type: 'text',
          text: { body: message },
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Meta send error:', errText);
        return NextResponse.json({ error: 'Provider send failed' }, { status: 502 });
      }
      const providerResponse = await resp.json();
      // Optionally persist outbound as interaction with status
      try {
        // Outbound messages can be associated later when contact known; we store lightweight status only here if needed.
      } catch (_) {}
      return NextResponse.json({ queued: true, providerResponse });
    }

    if (settings.provider === 'twilio') {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = settings.phoneNumber || process.env.TWILIO_PHONE_NUMBER;
      if (!sid || !token || !fromNumber) {
        return NextResponse.json({ error: 'Missing Twilio credentials' }, { status: 400 });
      }
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      const body = new URLSearchParams({
        From: `whatsapp:${fromNumber}`,
        To: `whatsapp:${to}`,
        Body: message,
      }).toString();
      const resp = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Twilio send error:', errText);
        return NextResponse.json({ error: 'Provider send failed' }, { status: 502 });
      }
      const providerResponse = await resp.json();
      try {
        // Same note as above for outbound persistence
      } catch (_) {}
      return NextResponse.json({ queued: true, providerResponse });
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}




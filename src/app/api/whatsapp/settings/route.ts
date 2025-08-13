import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OrganizationSettingsService } from '@/lib/services/organization-settings-service';

const SETTINGS_KEY = 'whatsapp_integration';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizationId = (session.user as any)?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const svc = new OrganizationSettingsService();
    const settings = await svc.getSetting<any>(organizationId, SETTINGS_KEY);

    return NextResponse.json({ settings: settings || null });
  } catch (error) {
    console.error('Error loading WhatsApp settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizationId = (session.user as any)?.organizationId;
    const userId = (session.user as any)?.id;
    if (!organizationId || !userId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await request.json();
    const incoming = body?.settings || {};

    // Persist settings using organization settings service (safely stores JSON)
    const svc = new OrganizationSettingsService();
    const saved = {
      provider: incoming.provider || 'meta',
      phoneNumber: incoming.phoneNumber || undefined,
      phoneNumberId: incoming.phoneNumberId || undefined,
      verifyToken: incoming.verifyToken || undefined,
      // Access token is sensitive; we store it but never echo back in responses
      accessToken: incoming.accessToken || undefined,
      status: 'connected',
      updatedAt: new Date().toISOString(),
    };

    await svc.updateSetting(organizationId, SETTINGS_KEY, saved, userId, 'WhatsApp integration settings');

    // Never include accessToken in response
    const responseSettings = { ...saved } as any;
    if ('accessToken' in responseSettings) delete responseSettings.accessToken;

    return NextResponse.json({ settings: responseSettings });
  } catch (error) {
    console.error('Error saving WhatsApp settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}





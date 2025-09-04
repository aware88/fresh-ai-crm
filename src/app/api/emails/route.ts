import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getValidMicrosoftAccessToken } from '@/lib/services/microsoft-token';

/**
 * GET handler for fetching emails from Microsoft Graph API
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    // Try session token first; fall back to stored account token with auto-refresh
    let accessToken: string | null = (session as any)?.accessToken || null;
    if (!accessToken && session?.user?.id) {
      const valid = await getValidMicrosoftAccessToken({ userId: (session.user as any).id });
      accessToken = valid?.accessToken || null;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized or missing Microsoft Graph access token' },
        { status: 401 },
      );
    }
    
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const top = parseInt(searchParams.get('top') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const filter = searchParams.get('filter') || '';
    
    // Create Microsoft Graph service and fetch emails
    const graphService = new MicrosoftGraphService(accessToken);
    const emails = await graphService.getEmails({ top, skip, filter });
    
    return NextResponse.json({ data: emails });
  } catch (error: any) {
    console.error('Error in emails API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails', message: error.message },
      { status: 500 }
    );
  }
}

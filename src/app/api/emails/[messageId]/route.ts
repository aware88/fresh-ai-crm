import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';

/**
 * GET handler for fetching a single email from Microsoft Graph API
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const { messageId } = params;
    
    // Create Microsoft Graph service and fetch the email
    const graphService = new MicrosoftGraphService(session.accessToken);
    const email = await graphService.getEmail(messageId);
    
    return NextResponse.json({ data: email });
  } catch (error: any) {
    console.error('Error in email API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating email properties (e.g., marking as read)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const { messageId } = params;
    const body = await req.json();
    
    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(session.accessToken);
    
    // Handle different update operations
    if (body.isRead !== undefined) {
      await graphService.client
        .api(`/me/messages/${messageId}`)
        .update({ isRead: body.isRead });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Failed to update email', message: error.message },
      { status: 500 }
    );
  }
}

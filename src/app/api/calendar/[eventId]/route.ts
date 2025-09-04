import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';

/**
 * GET handler for fetching a single calendar event from Microsoft Graph API
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const { eventId } = await params;
    
    // Create Microsoft Graph service and fetch the event
    const graphService = new MicrosoftGraphService(session.accessToken);
    const event = await graphService.client
      .api(`/me/events/${eventId}`)
      .get();
    
    return NextResponse.json({ data: event });
  } catch (error: any) {
    console.error('Error in calendar event API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar event', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating calendar event properties
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const { eventId } = await params;
    const body = await req.json();
    
    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(session.accessToken);
    
    // Update the event
    const result = await graphService.client
      .api(`/me/events/${eventId}`)
      .update(body);
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing calendar events
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const { eventId } = await params;
    
    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(session.accessToken);
    
    // Delete the event
    await graphService.client
      .api(`/me/events/${eventId}`)
      .delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event', message: error.message },
      { status: 500 }
    );
  }
}

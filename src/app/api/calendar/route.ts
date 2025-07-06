import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';

/**
 * GET handler for fetching calendar events from Microsoft Graph API
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDateTime = searchParams.get('startDateTime') || undefined;
    const endDateTime = searchParams.get('endDateTime') || undefined;
    const top = parseInt(searchParams.get('top') || '10');
    
    // Create Microsoft Graph service and fetch calendar events
    const graphService = new MicrosoftGraphService(session.accessToken);
    const events = await graphService.getCalendarEvents({ startDateTime, endDateTime, top });
    
    return NextResponse.json({ data: events });
  } catch (error: any) {
    console.error('Error in calendar API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating calendar events
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.subject || !body.start || !body.end) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, start, end' },
        { status: 400 }
      );
    }
    
    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(session.accessToken);
    
    // Format the event for Microsoft Graph API
    const event = {
      subject: body.subject,
      body: {
        contentType: 'HTML',
        content: body.content || '',
      },
      start: {
        dateTime: body.start,
        timeZone: body.timeZone || 'UTC',
      },
      end: {
        dateTime: body.end,
        timeZone: body.timeZone || 'UTC',
      },
      location: body.location ? {
        displayName: body.location,
      } : undefined,
      attendees: body.attendees ? body.attendees.map((attendee: any) => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name,
        },
        type: attendee.type || 'required',
      })) : [],
      isOnlineMeeting: body.isOnlineMeeting || false,
    };
    
    // Create the event
    const result = await graphService.client
      .api('/me/events')
      .post(event);
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event', message: error.message },
      { status: 500 }
    );
  }
}

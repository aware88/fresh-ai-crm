import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { FollowUpService } from '@/lib/email/follow-up-service';

/**
 * GET handler for retrieving pending reminders
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const followUpService = new FollowUpService();
    const reminders = await followUpService.getPendingReminders(session.user.id);
    
    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Error in GET /api/email/followups/reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating reminders
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.followupId || !body.reminderTime || !body.reminderTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: followupId, reminderTime, reminderTitle' },
        { status: 400 }
      );
    }
    
    const followUpService = new FollowUpService();
    
    const reminder = await followUpService.createReminder({
      followupId: body.followupId,
      userId: session.user.id,
      reminderType: body.reminderType || 'dashboard',
      reminderTime: new Date(body.reminderTime),
      reminderTitle: body.reminderTitle,
      reminderMessage: body.reminderMessage
    });
    
    if (!reminder) {
      return NextResponse.json(
        { error: 'Failed to create reminder' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/email/followups/reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

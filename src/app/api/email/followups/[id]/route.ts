import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { FollowUpService } from '@/lib/email/follow-up-service';

/**
 * PUT handler for updating follow-up status
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const followUpService = new FollowUpService();
    
    let success = false;
    
    // Handle specific actions
    if (body.action) {
      switch (body.action) {
        case 'complete':
          success = await followUpService.markFollowupCompleted(
            params.id,
            body.responseReceivedAt ? new Date(body.responseReceivedAt) : undefined
          );
          break;
        case 'sent':
          success = await followUpService.markFollowupSent(
            params.id,
            body.sentAt ? new Date(body.sentAt) : undefined
          );
          break;
        case 'cancel':
          success = await followUpService.cancelFollowup(params.id);
          break;
        case 'snooze':
          if (!body.snoozeUntil) {
            return NextResponse.json(
              { error: 'snoozeUntil is required for snooze action' },
              { status: 400 }
            );
          }
          success = await followUpService.snoozeFollowup(
            params.id,
            new Date(body.snoozeUntil)
          );
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    } else if (body.status) {
      // Direct status update
      success = await followUpService.updateFollowupStatus(
        params.id,
        body.status,
        body.additionalData
      );
    } else {
      return NextResponse.json(
        { error: 'Either action or status is required' },
        { status: 400 }
      );
    }
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update follow-up' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/email/followups/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for cancelling follow-ups
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const followUpService = new FollowUpService();
    const success = await followUpService.cancelFollowup(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel follow-up' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/email/followups/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

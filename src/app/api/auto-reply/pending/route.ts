import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { autoReplyService } from '@/lib/email/auto-reply-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingReplies = await autoReplyService.getPendingReplies(session.user.email);

    return NextResponse.json({
      success: true,
      count: pendingReplies.length,
      replies: pendingReplies
    });

  } catch (error) {
    console.error('Failed to get pending replies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get pending replies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, replyId } = body;

    if (!replyId) {
      return NextResponse.json(
        { error: 'Reply ID is required' },
        { status: 400 }
      );
    }

    let success = false;
    let message = '';

    switch (action) {
      case 'approve':
        success = await autoReplyService.approvePendingReply(replyId);
        message = success ? 'Reply approved and scheduled' : 'Failed to approve reply';
        break;

      case 'cancel':
        success = await autoReplyService.cancelPendingReply(replyId);
        message = success ? 'Reply cancelled' : 'Failed to cancel reply';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve or cancel' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success,
      message
    });

  } catch (error) {
    console.error('Failed to manage pending reply:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to manage pending reply',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}





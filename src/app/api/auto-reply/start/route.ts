import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { autoReplyService } from '@/lib/email/auto-reply-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userEmail = body.userEmail || session.user.email;

    // Initialize auto-reply service for the user
    await autoReplyService.initializeForUser(userEmail);

    return NextResponse.json({
      success: true,
      message: 'Auto-reply service started successfully'
    });

  } catch (error) {
    console.error('Failed to start auto-reply service:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to start auto-reply service',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}





import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * GET /api/email/learning/status
 * 
 * Check the status of background AI learning
 * Returns real-time progress and completion status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get learning session status
    const { data: learningSession, error } = await supabase
      .from('email_learning_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', session.user.id) // Security: only user's own sessions
      .single();

    if (error || !learningSession) {
      console.error('Learning session not found:', error);
      return NextResponse.json({ error: 'Learning session not found' }, { status: 404 });
    }

    // Calculate time information
    const startedAt = new Date(learningSession.started_at);
    const now = new Date();
    const elapsedMs = now.getTime() - startedAt.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    // Estimate remaining time based on progress
    let estimatedRemainingMinutes = null;
    if (learningSession.status === 'processing' && learningSession.progress > 5) {
      const progressPerMinute = learningSession.progress / elapsedMinutes;
      const remainingProgress = 100 - learningSession.progress;
      estimatedRemainingMinutes = Math.ceil(remainingProgress / Math.max(progressPerMinute, 1));
    }

    // Get completion details if finished
    let completionDetails = null;
    if (learningSession.status === 'completed') {
      completionDetails = {
        patterns_found: learningSession.patterns_found,
        quality_score: learningSession.quality_score,
        cost_usd: learningSession.cost_usd,
        tokens_used: learningSession.tokens_used,
        processing_time_ms: learningSession.processing_time_ms,
        completed_at: learningSession.completed_at
      };
    }

    return NextResponse.json({
      success: true,
      session: {
        id: learningSession.id,
        status: learningSession.status, // 'starting', 'processing', 'completed', 'failed'
        progress: learningSession.progress, // 0-100
        status_message: learningSession.status_message,
        max_emails: learningSession.max_emails,
        started_at: learningSession.started_at,
        completed_at: learningSession.completed_at,
        error_message: learningSession.error_message,
        
        // Time information
        elapsed_minutes: elapsedMinutes,
        estimated_remaining_minutes: estimatedRemainingMinutes,
        
        // Completion details
        completion_details: completionDetails,
        
        // User-friendly messages
        user_message: generateUserMessage(learningSession, elapsedMinutes, estimatedRemainingMinutes),
        can_work_meanwhile: learningSession.status === 'processing' || learningSession.status === 'starting'
      }
    });

  } catch (error) {
    console.error('[Learning Status] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check learning status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate user-friendly status message
 */
function generateUserMessage(
  session: any, 
  elapsedMinutes: number, 
  estimatedRemainingMinutes: number | null
): string {
  switch (session.status) {
    case 'starting':
      return `🚀 AI learning is starting... Analyzing your ${session.max_emails} emails to improve draft generation.`;
    
    case 'processing':
      const progressMsg = `🤖 AI learning in progress... ${session.progress}% complete`;
      const timeMsg = estimatedRemainingMinutes 
        ? ` (~${estimatedRemainingMinutes} min remaining)`
        : ` (${elapsedMinutes} min elapsed)`;
      return progressMsg + timeMsg;
    
    case 'completed':
      const patterns = session.patterns_found || 0;
      const quality = session.quality_score ? ` (${Math.round(session.quality_score * 100)}% quality)` : '';
      return `✅ AI learning completed! Found ${patterns} communication patterns${quality}. Your draft generation is now optimized.`;
    
    case 'failed':
      return `❌ AI learning encountered an issue. ${session.error_message || 'Please try again later.'}`;
    
    default:
      return `🔄 AI learning status: ${session.status}`;
  }
}

/**
 * POST /api/email/learning/status
 * 
 * Cancel a running learning session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, action } = await request.json();

    if (!sessionId || action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Cancel the session (mark as cancelled)
    const { data: updatedSession, error } = await supabase
      .from('email_learning_sessions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: 'Cancelled by user'
      })
      .eq('id', sessionId)
      .eq('user_id', session.user.id) // Security: only user's own sessions
      .eq('status', 'processing') // Can only cancel processing sessions
      .select()
      .single();

    if (error || !updatedSession) {
      return NextResponse.json({ 
        error: 'Failed to cancel session - it may not be running' 
      }, { status: 400 });
    }

    console.log(`🛑 [Learning Status] Session ${sessionId} cancelled by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Learning session cancelled',
      session: updatedSession
    });

  } catch (error) {
    console.error('[Learning Status] Cancel error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel learning session' },
      { status: 500 }
    );
  }
}
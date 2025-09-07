import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import EmailLearningService from '@/lib/email/email-learning-service';
import { SmartEmailSelectionService } from '@/lib/email/smart-email-selection-service';

/**
 * POST /api/email/learning/background
 * 
 * Start AI learning in true background mode with progress tracking
 * User can continue working while learning happens
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maxEmails, organizationId, accountId, subscriptionTier } = await request.json();
    const userId = session.user.id;

    console.log(`🤖 [Background Learning] Starting for user ${userId}, ${maxEmails} emails`);

    const supabase = createServiceRoleClient();

    // Get user's subscription tier if not provided
    let finalSubscriptionTier = subscriptionTier;
    if (!finalSubscriptionTier) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('id', organizationId)
        .single();
      
      finalSubscriptionTier = orgData?.subscription_plan || 'starter';
    }

    console.log(`📊 [Background Learning] Subscription tier: ${finalSubscriptionTier}`);

    // Use smart email selection to get optimized email count and strategy
    const smartSelection = new SmartEmailSelectionService(supabase);
    const selectionResult = await smartSelection.selectEmailsForLearning({
      userId,
      organizationId,
      subscriptionTier: finalSubscriptionTier as any,
      maxEmails // Allow override if provided
    });

    console.log(`🎯 [Background Learning] Smart selection: ${selectionResult.total_selected} emails, strategy: ${selectionResult.selection_strategy}`);

    // Create learning session record
    const { data: learningSession, error: sessionError } = await supabase
      .from('email_learning_sessions')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        account_id: accountId,
        max_emails: selectionResult.total_selected,
        status: 'starting',
        progress: 0,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError || !learningSession) {
      console.error('Failed to create learning session:', sessionError);
      return NextResponse.json({ 
        error: 'Failed to start learning session' 
      }, { status: 500 });
    }

    const sessionId = learningSession.id;
    console.log(`📝 [Background Learning] Session ${sessionId} created`);

    // Start background processing (don't await)
    processLearningInBackground(sessionId, userId, organizationId, selectionResult)
      .catch(error => {
        console.error(`❌ [Background Learning] Session ${sessionId} failed:`, error);
        // Update session with error
        supabase
          .from('email_learning_sessions')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)
          .then(() => console.log(`💾 Session ${sessionId} marked as failed`));
      });

    return NextResponse.json({
      success: true,
      message: 'AI learning started in background',
      session_id: sessionId,
      selection_details: {
        total_emails: selectionResult.total_selected,
        sent_emails: selectionResult.sent_emails,
        received_emails: selectionResult.received_emails,
        strategy: selectionResult.selection_strategy,
        tier: finalSubscriptionTier
      },
      estimated_cost_usd: selectionResult.estimated_cost_usd,
      estimated_time_minutes: selectionResult.estimated_time_minutes,
      quality_score: selectionResult.quality_score,
      status_endpoint: `/api/email/learning/status?sessionId=${sessionId}`,
      recommendations: smartSelection.getTierRecommendations(finalSubscriptionTier)
    });

  } catch (error) {
    console.error('[Background Learning] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start background learning',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Background processing function
 */
async function processLearningInBackground(
  sessionId: string, 
  userId: string, 
  organizationId: string | null, 
  selectionResult: any
) {
  console.log(`🚀 [Background Learning] Processing session ${sessionId}`);
  const supabase = createServiceRoleClient();
  
  try {
    // Update status to processing
    await supabase
      .from('email_learning_sessions')
      .update({
        status: 'processing',
        progress: 5,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Initialize learning service
    const learningService = new EmailLearningService();

    // Create progress callback
    const progressCallback = async (progress: number, message?: string) => {
      console.log(`📊 [Background Learning] Session ${sessionId}: ${progress}% - ${message || ''}`);
      
      await supabase
        .from('email_learning_sessions')
        .update({
          progress: Math.max(progress, 5), // Never go below 5%
          status_message: message,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    };

    // Perform learning with progress tracking using pre-selected emails
    const result = await learningService.performInitialLearningWithProgress(
      userId,
      organizationId,
      selectionResult.total_selected,
      progressCallback,
      selectionResult.email_ids // Pass the pre-selected email IDs
    );

    // Mark as completed
    await supabase
      .from('email_learning_sessions')
      .update({
        status: 'completed',
        progress: 100,
        patterns_found: result.patterns_found,
        quality_score: result.quality_score,
        cost_usd: result.cost_usd,
        tokens_used: result.tokens_used,
        processing_time_ms: result.processing_time_ms,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    console.log(`✅ [Background Learning] Session ${sessionId} completed: ${result.patterns_found} patterns found`);

    // Send notification to user (if notification system exists)
    await notifyUserLearningComplete(userId, sessionId, result);

  } catch (error) {
    console.error(`❌ [Background Learning] Session ${sessionId} failed:`, error);
    
    await supabase
      .from('email_learning_sessions')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    throw error;
  }
}

/**
 * Notify user when learning is complete
 */
async function notifyUserLearningComplete(userId: string, sessionId: string, result: any) {
  try {
    // Could integrate with your notification system here
    console.log(`🔔 [Background Learning] Would notify user ${userId} about session ${sessionId} completion`);
    
    // For now, just log the completion
    // In the future, you could:
    // - Send in-app notification
    // - Send email notification
    // - Update user preferences
    // - Show toast/banner in UI
    
  } catch (error) {
    console.error('Failed to notify user:', error);
    // Don't throw - notification failure shouldn't kill the learning process
  }
}

/**
 * GET /api/email/learning/background
 * 
 * Get all background learning sessions for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get user's learning sessions
    const { data: sessions, error } = await supabase
      .from('email_learning_sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch learning sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || []
    });

  } catch (error) {
    console.error('[Background Learning] Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning sessions' },
      { status: 500 }
    );
  }
}
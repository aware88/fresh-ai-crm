import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import EmailLearningService from '@/lib/email/email-learning-service';

/**
 * POST /api/email/learning/initial
 * 
 * Perform initial email learning analysis for a user
 * This analyzes the user's email history to extract communication patterns
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get request parameters
    const body = await request.json();
    const { 
      maxEmails = 5000,
      organizationId 
    } = body;

    // Validate parameters
    if (maxEmails < 1 || maxEmails > 10000) {
      return NextResponse.json(
        { error: 'maxEmails must be between 1 and 10000' },
        { status: 400 }
      );
    }

    console.log(`[API] Starting initial email learning for user ${userId} with ${maxEmails} max emails`);

    // Initialize learning service
    const learningService = new EmailLearningService();

    // Perform initial learning
    const result = await learningService.performInitialLearning(
      userId,
      organizationId,
      maxEmails
    );

    console.log(`[API] Initial learning completed:`, {
      patterns_found: result.patterns_found,
      quality_score: result.quality_score,
      processing_time_ms: result.processing_time_ms,
      cost_usd: result.cost_usd
    });

    return NextResponse.json({
      success: true,
      result: {
        patterns_found: result.patterns_found,
        quality_score: result.quality_score,
        recommendations: result.recommendations,
        processing_time_ms: result.processing_time_ms,
        cost_usd: result.cost_usd,
        tokens_used: result.tokens_used
      }
    });

  } catch (error) {
    console.error('[API] Error in initial email learning:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform initial learning',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/learning/initial
 * 
 * Get the status of initial learning for a user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get Supabase service role client (bypasses RLS)
    const supabase = createServiceRoleClient();

    // Check if user has any learning patterns
    console.log(`[API] Fetching patterns for user: ${userId}`);
    const { data: patterns, error: patternsError } = await supabase
      .from('email_patterns')
      .select('id, created_at, confidence, pattern_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log(`[API] Patterns query result:`, { 
      patterns: patterns?.length || 0, 
      error: patternsError?.message || 'none' 
    });

    if (patternsError) {
      console.error('[API] Error fetching learning patterns:', patternsError);
      return NextResponse.json(
        { error: 'Failed to fetch learning status' },
        { status: 500 }
      );
    }

    // Get latest learning analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('email_learning_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('session_type', 'initial_learning')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const hasInitialLearning = patterns && patterns.length > 0;
    const avgConfidence = hasInitialLearning 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0;

    return NextResponse.json({
      success: true,
      status: {
        has_initial_learning: hasInitialLearning,
        patterns_count: patterns?.length || 0,
        avg_confidence: avgConfidence,
        pattern_types: [...new Set(patterns?.map(p => p.pattern_type) || [])],
        last_learning_session: analytics || null,
        learning_quality: avgConfidence > 0.7 ? 'high' : avgConfidence > 0.5 ? 'medium' : 'low'
      }
    });

  } catch (error) {
    console.error('[API] Error getting initial learning status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get learning status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



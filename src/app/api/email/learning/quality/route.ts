import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import QualityAssuranceService from '@/lib/email/quality-assurance-service';

/**
 * GET /api/email/learning/quality
 * 
 * Get comprehensive quality metrics, alerts, and insights
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
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const includeAlerts = searchParams.get('includeAlerts') === 'true';
    const includeInsights = searchParams.get('includeInsights') === 'true';
    const includePatternHealth = searchParams.get('includePatternHealth') === 'true';

    console.log(`[API] Getting quality metrics for user ${userId} (${timeRange})`);

    const qualityService = new QualityAssuranceService();

    // Get quality metrics
    const metrics = await qualityService.calculateQualityMetrics(userId, timeRange);

    const response: any = {
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    };

    // Add alerts if requested
    if (includeAlerts) {
      const alerts = await qualityService.generateQualityAlerts(userId, metrics);
      response.alerts = alerts;
    }

    // Add insights if requested
    if (includeInsights) {
      const insights = await qualityService.generateQualityInsights(userId, metrics);
      response.insights = insights;
    }

    // Add pattern health if requested
    if (includePatternHealth) {
      const patternHealth = await qualityService.analyzePatternHealth(userId);
      response.pattern_health = patternHealth;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Error in quality endpoint:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get quality metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/learning/quality
 * 
 * Trigger quality improvement actions
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
    const body = await request.json();
    const { action, pattern_id } = body;

    console.log(`[API] Quality action: ${action} for user ${userId}`);

    const qualityService = new QualityAssuranceService();

    switch (action) {
      case 'auto_improve':
        const improvement = await qualityService.autoImprovePatterns(userId);
        return NextResponse.json({
          success: true,
          action: 'auto_improve',
          result: improvement
        });

      case 'analyze_pattern':
        if (!pattern_id) {
          return NextResponse.json(
            { error: 'pattern_id required for pattern analysis' },
            { status: 400 }
          );
        }
        const analysis = await qualityService.analyzePatternHealth(userId, pattern_id);
        return NextResponse.json({
          success: true,
          action: 'analyze_pattern',
          result: analysis
        });

      case 'generate_insights':
        const metrics = await qualityService.calculateQualityMetrics(userId);
        const insights = await qualityService.generateQualityInsights(userId, metrics);
        return NextResponse.json({
          success: true,
          action: 'generate_insights',
          result: insights
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[API] Error in quality action:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to execute quality action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



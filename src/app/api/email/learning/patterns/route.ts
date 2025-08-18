import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * GET /api/email/learning/patterns
 * 
 * Get all learning patterns for a user
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

    console.log('[API] Fetching patterns for user:', userId);

    // Get patterns with enhanced data
    const { data: patterns, error } = await supabase
      .from('email_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('confidence', { ascending: false });

    console.log('[API] Patterns query result:', { 
      patterns: patterns?.length || 0, 
      error: error ? error.message : 'none',
      userId: userId
    });

    if (error) {
      console.error('[API] Full error details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch patterns', details: error.message },
        { status: 500 }
      );
    }

    // Enhance patterns with learning quality classification and map column names
    const enhancedPatterns = patterns.map(pattern => ({
      ...pattern,
      // Map database columns to UI expected names
      trigger_keywords: pattern.tags || [],
      response_template: pattern.pattern_text || '',
      confidence_score: pattern.confidence || 0,
      context_category: pattern.email_category || '',
      // Add missing fields with defaults
      success_rate: 0.8, // Default success rate
      usage_count: pattern.frequency_count || 0,
      last_used_at: pattern.updated_at,
      example_pairs: [],
      learning_quality: classifyPatternQuality(pattern)
    }));

    return NextResponse.json({
      success: true,
      patterns: enhancedPatterns
    });

  } catch (error) {
    console.error('[API] Error in patterns endpoint:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch patterns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/learning/patterns
 * 
 * Create a new custom pattern
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
    const {
      pattern_type,
      context_category,
      trigger_keywords,
      response_template,
      confidence_score
    } = body;

    // Validate required fields
    if (!pattern_type || !context_category || !response_template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Supabase service role client (bypasses RLS)
    const supabase = createServiceRoleClient();

    // Create pattern
    const { data: pattern, error } = await supabase
      .from('email_patterns')
      .insert({
        user_id: userId,
        pattern_type,
        email_category: context_category,
        pattern_text: response_template,
        context: `Manual pattern: ${context_category}`,
        confidence: confidence_score || 0.7,
        frequency_count: 0,
        extracted_from_email_ids: [],
        tags: trigger_keywords || [],
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Error creating pattern:', error);
      return NextResponse.json(
        { error: 'Failed to create pattern' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pattern
    });

  } catch (error) {
    console.error('[API] Error creating pattern:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create pattern',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Classify pattern quality based on various metrics
 */
function classifyPatternQuality(pattern: any): 'high' | 'medium' | 'low' {
  const confidence = pattern.confidence || 0;
  const successRate = 0.8; // Default success rate
  const usageCount = pattern.frequency_count || 0;
  const hasKeywords = pattern.tags && pattern.tags.length > 0;
  const hasTemplate = pattern.pattern_text && pattern.pattern_text.length > 20;
  const hasExamples = false; // No examples in current data

  // Calculate quality score
  let qualityScore = 0;
  
  // Confidence score (30%)
  qualityScore += confidence * 0.3;
  
  // Success rate (25%)
  qualityScore += successRate * 0.25;
  
  // Usage count (20%) - normalized to 0-1 scale
  const normalizedUsage = Math.min(usageCount / 10, 1);
  qualityScore += normalizedUsage * 0.2;
  
  // Content quality (25%)
  let contentScore = 0;
  if (hasKeywords) contentScore += 0.4;
  if (hasTemplate) contentScore += 0.4;
  if (hasExamples) contentScore += 0.2;
  qualityScore += contentScore * 0.25;

  // Classify based on score
  if (qualityScore >= 0.75) return 'high';
  if (qualityScore >= 0.5) return 'medium';
  return 'low';
}



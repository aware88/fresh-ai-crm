import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/emails/ai-cache?emailId=xxx
 * 
 * Instantly returns cached AI analysis and draft results
 * Used by UI to show results immediately when user clicks AI buttons
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (!emailId) {
      return NextResponse.json(
        { error: 'emailId parameter is required' },
        { status: 400 }
      );
    }

    // Get cached results
    const { data: cacheData, error: cacheError } = await supabase
      .from('email_ai_cache')
      .select('*')
      .eq('email_id', emailId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') {
      console.error('Error fetching cache:', cacheError);
      return NextResponse.json(
        { error: 'Failed to fetch cached results' },
        { status: 500 }
      );
    }

    // Check if cache exists and is still fresh
    if (!cacheData) {
      return NextResponse.json({
        cached: false,
        message: 'No cached results found'
      });
    }

    // Check cache expiry (24 hours)
    const cacheAge = Date.now() - new Date(cacheData.created_at).getTime();
    const isExpired = cacheAge > 24 * 60 * 60 * 1000;

    if (isExpired) {
      return NextResponse.json({
        cached: false,
        message: 'Cached results expired'
      });
    }

    return NextResponse.json({
      cached: true,
      emailId,
      analysis: cacheData.analysis_result,
      draft: cacheData.draft_result,
      cachedAt: cacheData.created_at,
      cacheAge: Math.round(cacheAge / 1000) // Age in seconds
    });

  } catch (error) {
    console.error('AI Cache API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails/ai-cache
 * 
 * Manually trigger background processing for an email
 * Used when user wants to force refresh or process a new email
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { emailId, forceReprocess = false, skipDraft = false } = await request.json();

    if (!emailId) {
      return NextResponse.json(
        { error: 'emailId is required' },
        { status: 400 }
      );
    }

    // Verify email exists and belongs to user
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('id, user_id')
      .eq('id', emailId)
      .single();

    if (emailError || !email || email.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Email not found or access denied' },
        { status: 404 }
      );
    }

    // Import and use background processor
    const { getBackgroundProcessor } = await import('@/lib/email/background-ai-processor');
    const OpenAI = (await import('openai')).default;
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: 'AI service not available' },
        { status: 503 }
      );
    }

    const processor = getBackgroundProcessor(supabase, openai);

    // Get user's organization
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', session.user.id)
      .single();

    const organizationId = preferences?.current_organization_id;

    // Process email in background
    const result = await processor.processEmailInBackground({
      emailId,
      userId: session.user.id,
      organizationId,
      priority: 'normal',
      skipDraft,
      forceReprocess
    });

    return NextResponse.json({
      success: result.success,
      emailId: result.emailId,
      analysis: result.analysis,
      draft: result.draft,
      cached: result.cached,
      error: result.error
    });

  } catch (error) {
    console.error('AI Cache POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
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

    // Get cached results - try database first, fall back to background processor cache
    let cacheData = null;
    let cacheError = null;
    
    try {
      const { data, error } = await supabase
        .from('email_ai_cache')
        .select('*')
        .eq('email_id', emailId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      cacheData = data;
      cacheError = error;
    } catch (error) {
      // Table might not exist, try background processor cache
      console.log('Database cache unavailable, checking background processor cache');
    }

    // If database cache failed, try background processor cache
    if (!cacheData || (cacheError && cacheError.code !== 'PGRST116')) {
      try {
        const { getBackgroundProcessor } = await import('@/lib/email/background-ai-processor');
        const OpenAI = (await import('openai')).default;
        
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        if (openai.apiKey) {
          const processor = getBackgroundProcessor(supabase, openai);
          const cachedResults = await processor.getCachedResultsForUI(emailId);
          
          if (cachedResults) {
            return NextResponse.json({
              cached: true,
              emailId,
              analysis: cachedResults.analysis,
              draft: cachedResults.draft,
              cachedAt: new Date().toISOString(),
              cacheAge: 0,
              source: 'memory'
            });
          }
        }
      } catch (memoryError) {
        console.log('Memory cache also unavailable:', memoryError);
      }
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
    // Use service role client to bypass RLS for email lookups
    const supabase = createServiceRoleClient();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { emailId, forceReprocess = false, skipDraft = false, emailContent } = await request.json();

    if (!emailId) {
      return NextResponse.json(
        { error: 'emailId is required' },
        { status: 400 }
      );
    }

    // For virtual/composed emails, we don't need to verify in database
    if (!emailId.startsWith('compose-') && !emailId.startsWith('virtual-')) {
      // Verify email exists and belongs to user - try both email_index and emails tables
      let email = null;
      let emailError = null;
      
      console.log(`[AI Cache POST] Looking up email: ${emailId.substring(0, 50)}... for user: ${session.user.id}`);
      
      // First try email_index (new structure) - try with user filter first
      const { data: indexEmails, error: indexError } = await supabase
        .from('email_index')
        .select('id, user_id, message_id, email_account_id')
        .eq('message_id', emailId)
        .eq('user_id', session.user.id);
      
      let indexEmail = indexEmails?.[0]; // Take the first match
      
      // If not found with user_id filter, try without (emails might not have correct user_id)
      if (!indexEmail && !indexError) {
        const { data: allIndexEmails, error: allIndexError } = await supabase
          .from('email_index')
          .select('id, user_id, message_id, email_account_id')
          .eq('message_id', emailId)
          .limit(1);
          
        indexEmail = allIndexEmails?.[0];
        console.log(`[AI Cache POST] Fallback lookup found:`, { 
          found: !!indexEmail, 
          error: allIndexError?.message, 
          userId: indexEmail?.user_id,
          accountId: indexEmail?.email_account_id
        });
      }
      
      console.log(`[AI Cache POST] Email index lookup:`, { 
        found: !!indexEmail, 
        error: indexError?.message, 
        userId: indexEmail?.user_id 
      });
      
      if (indexEmail && !indexError) {
        email = indexEmail;
        emailError = null; // Reset error since we found it
      } else {
        console.log(`[AI Cache POST] Trying legacy emails table...`);
        // Fallback to emails table (old structure) - search by message_id, not id
        const { data: legacyEmail, error: legacyError } = await supabase
          .from('emails')
          .select('id, user_id, message_id')
          .eq('message_id', emailId)
          .single();
        
        console.log(`[AI Cache POST] Legacy email lookup:`, { 
          found: !!legacyEmail, 
          error: legacyError?.message, 
          userId: legacyEmail?.user_id 
        });
        
        email = legacyEmail;
        emailError = legacyError;
      }

      if (emailError || !email || email.user_id !== session.user.id) {
        console.error(`[AI Cache POST] Email verification failed:`, {
          hasError: !!emailError,
          hasEmail: !!email,
          userIdMatch: email?.user_id === session.user.id,
          emailUserId: email?.user_id,
          sessionUserId: session.user.id
        });
        return NextResponse.json(
          { error: 'Email not found or access denied' },
          { status: 404 }
        );
      }
      
      console.log(`[AI Cache POST] Email verification successful`);
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
      forceReprocess,
      emailContent
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






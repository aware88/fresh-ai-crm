import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UniversalAgentService } from '@/lib/ai/universal-agent-service';
import { TaskComplexity } from '@/lib/ai/model-router-service';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Create service role client for database operations
    const { createClient } = require('@supabase/supabase-js');
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId, rating, modelId, taskType, complexity } = await request.json();

    if (!messageId || !rating || !modelId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    
    // Get organization ID
    const { data: preferences } = await supabaseServiceRole
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', userId)
      .single();
    
    const organizationId = preferences?.current_organization_id || userId;

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: 'AI service is not available at the moment' },
        { status: 500 }
      );
    }

    // Create universal agent service to record feedback
    const universalAgent = new UniversalAgentService(
      supabaseServiceRole,
      openai,
      organizationId,
      userId
    );

    // Record the feedback
    await universalAgent.recordUserFeedback(
      messageId,
      rating,
      modelId,
      taskType || 'general',
      (complexity as TaskComplexity) || TaskComplexity.STANDARD
    );

    return NextResponse.json({ 
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
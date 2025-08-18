import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    const { responseId, rating, modelId, taskType, complexity } = await request.json();

    if (!responseId || !rating || !modelId) {
      return NextResponse.json(
        { error: 'Missing required fields: responseId, rating, modelId' },
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

    // Record the feedback in ai_model_performance table
    const { error: insertError } = await supabaseServiceRole
      .from('ai_model_performance')
      .insert({
        model_id: modelId,
        task_type: taskType || 'email_generation',
        complexity: complexity || 'standard',
        success: rating >= 3, // 3+ is considered success
        response_time: 0, // We don't track response time for feedback
        user_feedback: rating,
        organization_id: organizationId,
        user_id: userId,
      });

    if (insertError) {
      console.error('Database error:', insertError);
      return NextResponse.json(
        { error: 'Failed to record feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    console.error('Model feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


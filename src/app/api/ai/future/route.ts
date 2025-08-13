import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UniversalAgentService } from '@/lib/ai/universal-agent-service';
import OpenAI from 'openai';

// Streaming handler for real-time thinking process
async function handleStreamingRequest(supabaseServiceRole: any, session: any, message: string, modelOverride?: string) {
  const userId = session.user.id;
  
  // Get organization ID
  const { data: preferences } = await supabaseServiceRole
    .from('user_preferences')
    .select('current_organization_id')
    .eq('user_id', userId)
    .single();
  
  const organizationId = preferences?.current_organization_id || userId;
  
  // Check subscription (simplified for streaming)
  try {
    const { data: subscriptionData } = await supabaseServiceRole
      .from('organization_subscriptions')
      .select(`subscription_plans (name, features)`)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    const plan = subscriptionData?.subscription_plans;
    const hasAIFutureAccess = plan?.features?.AI_FUTURE_ACCESS === true;
    const isDevelopmentOrg = organizationId === '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!hasAIFutureAccess && !(isDevelopment && isDevelopmentOrg)) {
      return NextResponse.json(
        { error: 'CRM Assistant requires a Professional or Enterprise subscription' },
        { status: 403 }
      );
    }
  } catch (error) {
    const isDevelopmentOrg = organizationId === '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!(isDevelopment && isDevelopmentOrg)) {
      return NextResponse.json(
        { error: 'Failed to check subscription status' },
        { status: 500 }
      );
    }
  }

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

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create agent with streaming callback
        const agent = new UniversalAgentService(supabaseServiceRole, openai, organizationId, userId);
        
        // Process message with streaming and model override
        await agent.processMessageWithStreaming(message, (update) => {
          const data = `data: ${JSON.stringify(update)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }, modelOverride);
        
        controller.close();
      } catch (error) {
        const errorData = `data: ${JSON.stringify({ type: 'error', message: 'Processing failed' })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

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

    const { message, modelOverride } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Always use streaming for real-time thinking process
    return handleStreamingRequest(supabaseServiceRole, session, message, modelOverride);

  } catch (error) {
    console.error('CRM Assistant API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
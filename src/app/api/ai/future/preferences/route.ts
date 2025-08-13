import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ModelRouterService } from '@/lib/ai/model-router-service';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
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

    // Create model router service
    const modelRouter = new ModelRouterService(supabaseServiceRole, openai, organizationId, userId);
    
    // Get user's preferred models for different contexts
    const generalPreferred = await modelRouter.getUserPreferredModels('general');
    const createPreferred = await modelRouter.getUserPreferredModels('CREATE');
    const searchPreferred = await modelRouter.getUserPreferredModels('SEARCH');

    const userPreferences = {
      defaultModel: generalPreferred[0] || 'auto',
      createModel: createPreferred[0] || 'auto',
      searchModel: searchPreferred[0] || 'auto',
      generalModel: generalPreferred[0] || 'auto'
    };

    return NextResponse.json(userPreferences);

  } catch (error) {
    console.error('Preferences API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    const preferences = await request.json();
    const userId = session.user.id;
    
    // Get organization ID
    const { data: userPrefs } = await supabaseServiceRole
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', userId)
      .single();
    
    const organizationId = userPrefs?.current_organization_id || userId;

    // For now, we'll store preferences as positive feedback for the models
    // This is a simplified approach - in a full implementation, you might have a dedicated preferences table
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: 'AI service is not available at the moment' },
        { status: 500 }
      );
    }

    const modelRouter = new ModelRouterService(supabaseServiceRole, openai, organizationId, userId);

    // Record preferences as high-rated performance entries
    for (const [context, modelId] of Object.entries(preferences)) {
      if (modelId && modelId !== 'auto') {
        await modelRouter.recordModelPerformance(
          modelId as string,
          context === 'defaultModel' ? 'general' : context.replace('Model', '').toUpperCase(),
          'standard' as any, // Default complexity
          true,
          0, // No response time for preferences
          5 // High rating for preferred model
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Preferences saved successfully'
    });

  } catch (error) {
    console.error('Preferences save API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
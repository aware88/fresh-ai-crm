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
    
    // Get all available models
    const models = modelRouter.getAllModels();

    return NextResponse.json(models);

  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
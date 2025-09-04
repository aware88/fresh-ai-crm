/**
 * API endpoints for agent thoughts
 * 
 * GET: List thoughts for a specific activity
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { TransparencyService } from '@/lib/ai/transparency/transparency-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get query parameters
    const activityId = searchParams.get('activityId');
    
    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const organizationId = session.user.user_metadata.organization_id;
    
    // Initialize transparency service
    const transparencyService = new TransparencyService(
      supabase,
      organizationId
    );
    
    // Get thoughts for the activity
    const thoughts = await transparencyService.getActivityThoughts(activityId);
    
    return NextResponse.json({ thoughts });
  } catch (error) {
    console.error('Error in thoughts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * API endpoints for agent activities
 * 
 * GET: List agent activities with filtering options
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
    const agentId = searchParams.get('agentId');
    const activityType = searchParams.get('activityType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
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
    
    // Query activities
    let query = supabase
      .from('ai_agent_activities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }
    
    const { data: activities, error } = await query;
    
    if (error) {
      console.error('Error fetching agent activities:', error);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error in activities API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

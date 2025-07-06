/**
 * Agent Memory Statistics API Route
 * 
 * GET /api/memory/agent-stats/:id - Get memory statistics for an agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET handler - Get memory statistics for an agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user and organization from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const organizationId = user.app_metadata?.org_id;
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Get days from query params or use default
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    // Get agent memory statistics
    const { data, error } = await supabase
      .rpc('get_agent_memory_stats', {
        p_agent_id: agentId,
        p_organization_id: organizationId,
        p_days: days
      });
    
    if (error) {
      console.error('Error fetching agent memory statistics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agent memory statistics' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || {
      total_memories: 0,
      memory_types: [],
      memory_usage: [],
      memory_feedback: {
        average_relevance: 0,
        average_usefulness: 0
      }
    });
  } catch (error) {
    console.error('Unexpected error in agent memory statistics GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

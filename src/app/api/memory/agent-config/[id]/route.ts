/**
 * Agent Memory Configuration API Routes
 * 
 * GET /api/memory/agent-config/:id - Get agent memory configuration
 * PATCH /api/memory/agent-config/:id - Update agent memory configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { AIMemoryType } from '@/lib/ai/memory/ai-memory-service';

// Validation schema for update request
const updateConfigSchema = z.object({
  enableMemoryCreation: z.boolean().optional(),
  enableMemoryRetrieval: z.boolean().optional(),
  maxMemoriesToRetrieve: z.number().min(1).max(50).optional(),
  minRelevanceScore: z.number().min(0).max(1).optional(),
  memoryTypes: z.array(z.string()).optional()
});

// GET handler - Get agent memory configuration
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
    
    // Get agent memory configuration
    const { data, error } = await supabase
      .from('agent_memory_config')
      .select('*')
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .single();
    
    if (error) {
      // If not found, return default configuration
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          id: null,
          agent_id: agentId,
          organization_id: organizationId,
          enable_memory_creation: true,
          enable_memory_retrieval: true,
          max_memories_to_retrieve: 10,
          min_relevance_score: 0.7,
          memory_types: [
            AIMemoryType.PREFERENCE,
            AIMemoryType.FEEDBACK,
            AIMemoryType.INTERACTION,
            AIMemoryType.OBSERVATION,
            AIMemoryType.INSIGHT
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      console.error('Error fetching agent memory config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agent memory configuration' },
        { status: 500 }
      );
    }
    
    // Transform to camelCase for frontend
    return NextResponse.json({
      id: data.id,
      agentId: data.agent_id,
      organizationId: data.organization_id,
      enableMemoryCreation: data.enable_memory_creation,
      enableMemoryRetrieval: data.enable_memory_retrieval,
      maxMemoriesToRetrieve: data.max_memories_to_retrieve,
      minRelevanceScore: data.min_relevance_score,
      memoryTypes: data.memory_types,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Unexpected error in agent memory config GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler - Update agent memory configuration
export async function PATCH(
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
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateConfigSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const updateData = validationResult.data;
    
    // Transform to snake_case for database
    const dbUpdateData: any = {};
    
    if (updateData.enableMemoryCreation !== undefined) {
      dbUpdateData.enable_memory_creation = updateData.enableMemoryCreation;
    }
    
    if (updateData.enableMemoryRetrieval !== undefined) {
      dbUpdateData.enable_memory_retrieval = updateData.enableMemoryRetrieval;
    }
    
    if (updateData.maxMemoriesToRetrieve !== undefined) {
      dbUpdateData.max_memories_to_retrieve = updateData.maxMemoriesToRetrieve;
    }
    
    if (updateData.minRelevanceScore !== undefined) {
      dbUpdateData.min_relevance_score = updateData.minRelevanceScore;
    }
    
    if (updateData.memoryTypes !== undefined) {
      dbUpdateData.memory_types = updateData.memoryTypes;
    }
    
    dbUpdateData.updated_at = new Date().toISOString();
    
    // Update agent memory configuration
    const { data, error } = await supabase
      .from('agent_memory_config')
      .upsert({
        agent_id: agentId,
        organization_id: organizationId,
        ...dbUpdateData
      }, {
        onConflict: 'agent_id,organization_id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating agent memory config:', error);
      return NextResponse.json(
        { error: 'Failed to update agent memory configuration' },
        { status: 500 }
      );
    }
    
    // Transform to camelCase for frontend
    return NextResponse.json({
      id: data.id,
      agentId: data.agent_id,
      organizationId: data.organization_id,
      enableMemoryCreation: data.enable_memory_creation,
      enableMemoryRetrieval: data.enable_memory_retrieval,
      maxMemoriesToRetrieve: data.max_memories_to_retrieve,
      minRelevanceScore: data.min_relevance_score,
      memoryTypes: data.memory_types,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  } catch (error) {
    console.error('Unexpected error in agent memory config PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

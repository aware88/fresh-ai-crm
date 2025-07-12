/**
 * Agent Memory Configuration API Routes
 * 
 * POST /api/memory/agent-config - Create agent memory configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { AIMemoryType } from '@/lib/ai/memory/ai-memory-service';

// Validation schema for create request
const createConfigSchema = z.object({
  agentId: z.string().uuid(),
  enableMemoryCreation: z.boolean().default(true),
  enableMemoryRetrieval: z.boolean().default(true),
  maxMemoriesToRetrieve: z.number().min(1).max(50).default(10),
  minRelevanceScore: z.number().min(0).max(1).default(0.7),
  memoryTypes: z.array(z.string()).default([
    AIMemoryType.PREFERENCE,
    AIMemoryType.FEEDBACK,
    AIMemoryType.INTERACTION,
    AIMemoryType.OBSERVATION,
    AIMemoryType.INSIGHT
  ])
});

// POST handler - Create agent memory configuration
export async function POST(request: NextRequest) {
  // Get cookies using async pattern for Next.js 15+
  const cookieStore = await cookies();
  try {
    const supabase = createRouteHandlerClient({ cookies: cookieStore });
    
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
    const validationResult = createConfigSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const configData = validationResult.data;
    
    // Check if agent exists
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', configData.agentId)
      .eq('organization_id', organizationId)
      .single();
    
    if (agentError && agentError.code !== 'PGRST116') {
      console.error('Error checking agent:', agentError);
      return NextResponse.json(
        { error: 'Failed to check agent existence' },
        { status: 500 }
      );
    }
    
    // If agent doesn't exist, create a placeholder agent
    if (!agentData) {
      const { error: createAgentError } = await supabase
        .from('agents')
        .insert({
          id: configData.agentId,
          name: 'Memory Test Agent',
          organization_id: organizationId
        });
      
      if (createAgentError) {
        console.error('Error creating placeholder agent:', createAgentError);
        return NextResponse.json(
          { error: 'Failed to create placeholder agent' },
          { status: 500 }
        );
      }
    }
    
    // Create agent memory configuration
    const { data, error } = await supabase
      .from('agent_memory_config')
      .upsert({
        agent_id: configData.agentId,
        organization_id: organizationId,
        enable_memory_creation: configData.enableMemoryCreation,
        enable_memory_retrieval: configData.enableMemoryRetrieval,
        max_memories_to_retrieve: configData.maxMemoriesToRetrieve,
        min_relevance_score: configData.minRelevanceScore,
        memory_types: configData.memoryTypes
      }, {
        onConflict: 'agent_id,organization_id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating agent memory config:', error);
      return NextResponse.json(
        { error: 'Failed to create agent memory configuration' },
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
    }, {
      status: 201
    });
  } catch (error) {
    console.error('Unexpected error in agent memory config POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

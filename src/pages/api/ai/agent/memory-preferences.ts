/**
 * API endpoint for managing agent memory preferences
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { AgentMemoryPreferences } from '@/lib/ai/agent/types';
import { AIMemoryType } from '@/lib/ai/memory/ai-memory-service';
import { Database } from '@/types/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Create authenticated Supabase client
  const supabase = createServerSupabaseClient<Database>({ req, res });

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Extract organization context
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('organization_id, active')
    .eq('user_id', session.user.id)
    .single();

  if (!userProfile || !userProfile.active) {
    return res.status(403).json({ error: 'Forbidden: User inactive or not found' });
  }

  const organizationId = userProfile.organization_id;

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return handleGet(req, res, supabase, organizationId);
    case 'PUT':
      return handlePut(req, res, supabase, organizationId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Handle GET requests - Get memory preferences for an agent
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  organizationId: string
) {
  const { agent_id } = req.query;

  if (!agent_id) {
    return res.status(400).json({ error: 'Missing agent ID' });
  }

  try {
    // Verify agent belongs to organization
    const { data: agent, error: agentError } = await supabase
      .from('agent_configs')
      .select('id')
      .eq('id', agent_id)
      .eq('organization_id', organizationId)
      .single();

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get memory preferences
    const { data, error } = await supabase
      .from('agent_memory_preferences')
      .select('*')
      .eq('agent_id', agent_id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      // If no preferences found, return default values
      if (error.code === 'PGRST116') {
        const defaultPreferences = {
          organization_id: organizationId,
          agent_id: agent_id,
          memory_types_to_create: ['INTERACTION', 'DECISION', 'INSIGHT'],
          memory_types_to_access: ['INTERACTION', 'DECISION', 'INSIGHT', 'PREFERENCE', 'FACT'],
          min_confidence_to_store: 0.6,
          min_importance_to_access: 0.5,
          max_memories_per_context: 10,
          recency_weight: 0.3,
          relevance_weight: 0.5,
          importance_weight: 0.2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        return res.status(200).json(defaultPreferences);
      }
      
      return res.status(500).json({ error: 'Failed to fetch memory preferences' });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching memory preferences:', error);
    return res.status(500).json({
      error: 'Failed to fetch memory preferences',
      message: error.message
    });
  }
}

/**
 * Handle PUT requests - Update memory preferences for an agent
 */
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  organizationId: string
) {
  const { agent_id } = req.query;

  if (!agent_id) {
    return res.status(400).json({ error: 'Missing agent ID' });
  }

  try {
    // Verify agent belongs to organization
    const { data: agent, error: agentError } = await supabase
      .from('agent_configs')
      .select('id')
      .eq('id', agent_id)
      .eq('organization_id', organizationId)
      .single();

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Extract fields to update
    const { 
      memory_types_to_create, 
      memory_types_to_access, 
      min_confidence_to_store, 
      min_importance_to_access, 
      max_memories_per_context, 
      recency_weight, 
      relevance_weight, 
      importance_weight 
    } = req.body;

    // Validate memory types
    const validMemoryTypes = Object.values(AIMemoryType);
    
    if (memory_types_to_create && Array.isArray(memory_types_to_create)) {
      for (const type of memory_types_to_create) {
        if (!validMemoryTypes.includes(type)) {
          return res.status(400).json({ error: `Invalid memory type: ${type}` });
        }
      }
    }
    
    if (memory_types_to_access && Array.isArray(memory_types_to_access)) {
      for (const type of memory_types_to_access) {
        if (!validMemoryTypes.includes(type)) {
          return res.status(400).json({ error: `Invalid memory type: ${type}` });
        }
      }
    }

    // Validate numeric fields are between 0 and 1
    if (min_confidence_to_store !== undefined && 
        (min_confidence_to_store < 0 || min_confidence_to_store > 1)) {
      return res.status(400).json({ error: 'Min confidence must be between 0 and 1' });
    }
    
    if (min_importance_to_access !== undefined && 
        (min_importance_to_access < 0 || min_importance_to_access > 1)) {
      return res.status(400).json({ error: 'Min importance must be between 0 and 1' });
    }
    
    if (recency_weight !== undefined && 
        (recency_weight < 0 || recency_weight > 1)) {
      return res.status(400).json({ error: 'Recency weight must be between 0 and 1' });
    }
    
    if (relevance_weight !== undefined && 
        (relevance_weight < 0 || relevance_weight > 1)) {
      return res.status(400).json({ error: 'Relevance weight must be between 0 and 1' });
    }
    
    if (importance_weight !== undefined && 
        (importance_weight < 0 || importance_weight > 1)) {
      return res.status(400).json({ error: 'Importance weight must be between 0 and 1' });
    }
    
    // Check if weights sum to 1
    if (recency_weight !== undefined || relevance_weight !== undefined || importance_weight !== undefined) {
      // Get current values for any weights not being updated
      const { data: currentPrefs } = await supabase
        .from('agent_memory_preferences')
        .select('recency_weight, relevance_weight, importance_weight')
        .eq('agent_id', agent_id)
        .eq('organization_id', organizationId)
        .single();
      
      const finalRecencyWeight = recency_weight !== undefined ? recency_weight : 
        (currentPrefs ? currentPrefs.recency_weight : 0.3);
      
      const finalRelevanceWeight = relevance_weight !== undefined ? relevance_weight : 
        (currentPrefs ? currentPrefs.relevance_weight : 0.5);
      
      const finalImportanceWeight = importance_weight !== undefined ? importance_weight : 
        (currentPrefs ? currentPrefs.importance_weight : 0.2);
      
      const sum = finalRecencyWeight + finalRelevanceWeight + finalImportanceWeight;
      
      if (Math.abs(sum - 1) > 0.001) {
        return res.status(400).json({ 
          error: 'Weights must sum to 1',
          current_sum: sum,
          recency_weight: finalRecencyWeight,
          relevance_weight: finalRelevanceWeight,
          importance_weight: finalImportanceWeight
        });
      }
    }

    // Prepare update object
    const updateData: Partial<AgentMemoryPreferences> = {
      updated_at: new Date().toISOString()
    };
    
    if (memory_types_to_create !== undefined) {
      updateData.memory_types_to_create = memory_types_to_create;
    }
    
    if (memory_types_to_access !== undefined) {
      updateData.memory_types_to_access = memory_types_to_access;
    }
    
    if (min_confidence_to_store !== undefined) {
      updateData.min_confidence_to_store = min_confidence_to_store;
    }
    
    if (min_importance_to_access !== undefined) {
      updateData.min_importance_to_access = min_importance_to_access;
    }
    
    if (max_memories_per_context !== undefined) {
      updateData.max_memories_per_context = max_memories_per_context;
    }
    
    if (recency_weight !== undefined) {
      updateData.recency_weight = recency_weight;
    }
    
    if (relevance_weight !== undefined) {
      updateData.relevance_weight = relevance_weight;
    }
    
    if (importance_weight !== undefined) {
      updateData.importance_weight = importance_weight;
    }

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from('agent_memory_preferences')
      .select('id')
      .eq('agent_id', agent_id)
      .eq('organization_id', organizationId)
      .single();

    let result;
    
    if (existingPrefs) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('agent_memory_preferences')
        .update(updateData)
        .eq('agent_id', agent_id)
        .eq('organization_id', organizationId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating memory preferences:', error);
        return res.status(500).json({ error: 'Failed to update memory preferences' });
      }
      
      result = data;
    } else {
      // Create new preferences
      const newPrefs = {
        organization_id: organizationId,
        agent_id: agent_id,
        memory_types_to_create: memory_types_to_create || ['INTERACTION', 'DECISION', 'INSIGHT'],
        memory_types_to_access: memory_types_to_access || ['INTERACTION', 'DECISION', 'INSIGHT', 'PREFERENCE', 'FACT'],
        min_confidence_to_store: min_confidence_to_store !== undefined ? min_confidence_to_store : 0.6,
        min_importance_to_access: min_importance_to_access !== undefined ? min_importance_to_access : 0.5,
        max_memories_per_context: max_memories_per_context !== undefined ? max_memories_per_context : 10,
        recency_weight: recency_weight !== undefined ? recency_weight : 0.3,
        relevance_weight: relevance_weight !== undefined ? relevance_weight : 0.5,
        importance_weight: importance_weight !== undefined ? importance_weight : 0.2,
        ...updateData
      };
      
      const { data, error } = await supabase
        .from('agent_memory_preferences')
        .insert(newPrefs)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating memory preferences:', error);
        return res.status(500).json({ error: 'Failed to create memory preferences' });
      }
      
      result = data;
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error updating memory preferences:', error);
    return res.status(500).json({
      error: 'Failed to update memory preferences',
      message: error.message
    });
  }
}

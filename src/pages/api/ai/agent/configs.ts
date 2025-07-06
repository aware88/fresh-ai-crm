/**
 * API endpoint for managing agent configurations
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { AgentConfig, MemoryAccessLevel } from '@/lib/ai/agent/types';
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
    case 'POST':
      return handlePost(req, res, supabase, organizationId);
    case 'PUT':
      return handlePut(req, res, supabase, organizationId);
    case 'DELETE':
      return handleDelete(req, res, supabase, organizationId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Handle GET requests - List or get specific agent config
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  organizationId: string
) {
  const { id } = req.query;

  try {
    if (id) {
      // Get specific agent config
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*, agent_personalities(*)')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Agent configuration not found' });
      }

      return res.status(200).json(data);
    } else {
      // List all agent configs for organization
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*, agent_personalities(*)')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch agent configurations' });
      }

      return res.status(200).json(data);
    }
  } catch (error: any) {
    console.error('Error fetching agent configurations:', error);
    return res.status(500).json({
      error: 'Failed to fetch agent configurations',
      message: error.message
    });
  }
}

/**
 * Handle POST requests - Create new agent config
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  organizationId: string
) {
  try {
    const { 
      name, 
      description, 
      personality_id, 
      default_goals, 
      allowed_actions, 
      memory_access_level, 
      decision_confidence_threshold, 
      max_message_length, 
      response_time_target_ms, 
      active 
    } = req.body;

    // Validate required fields
    if (!name || !personality_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate personality exists and belongs to organization
    const { data: personality, error: personalityError } = await supabase
      .from('agent_personalities')
      .select('id')
      .eq('id', personality_id)
      .eq('organization_id', organizationId)
      .single();

    if (personalityError || !personality) {
      return res.status(400).json({ error: 'Invalid personality ID' });
    }

    // Validate memory access level
    if (memory_access_level && !Object.values(MemoryAccessLevel).includes(memory_access_level)) {
      return res.status(400).json({ error: 'Invalid memory access level' });
    }

    // Validate numeric fields
    if (decision_confidence_threshold !== undefined && 
        (decision_confidence_threshold < 0 || decision_confidence_threshold > 1)) {
      return res.status(400).json({ error: 'Decision confidence threshold must be between 0 and 1' });
    }

    // Create new agent config
    const newConfig: Partial<AgentConfig> = {
      organization_id: organizationId,
      name,
      description: description || '',
      personality_id,
      default_goals: Array.isArray(default_goals) ? default_goals : [],
      allowed_actions: Array.isArray(allowed_actions) ? allowed_actions : [],
      memory_access_level: memory_access_level || MemoryAccessLevel.READ_ONLY,
      decision_confidence_threshold: decision_confidence_threshold !== undefined ? decision_confidence_threshold : 0.7,
      max_message_length: max_message_length || 2000,
      response_time_target_ms: response_time_target_ms || 5000,
      active: active !== undefined ? active : true
    };

    const { data, error } = await supabase
      .from('agent_configs')
      .insert(newConfig)
      .select()
      .single();

    if (error) {
      console.error('Error creating agent configuration:', error);
      return res.status(500).json({ error: 'Failed to create agent configuration' });
    }

    // Create default memory preferences for the agent
    const defaultMemoryPreferences = {
      organization_id: organizationId,
      agent_id: data.id,
      memory_types_to_create: ['INTERACTION', 'DECISION', 'INSIGHT'],
      memory_types_to_access: ['INTERACTION', 'DECISION', 'INSIGHT', 'PREFERENCE', 'FACT'],
      min_confidence_to_store: 0.6,
      min_importance_to_access: 0.5,
      max_memories_per_context: 10,
      recency_weight: 0.3,
      relevance_weight: 0.5,
      importance_weight: 0.2
    };

    await supabase
      .from('agent_memory_preferences')
      .insert(defaultMemoryPreferences);

    return res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating agent configuration:', error);
    return res.status(500).json({
      error: 'Failed to create agent configuration',
      message: error.message
    });
  }
}

/**
 * Handle PUT requests - Update existing agent config
 */
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  organizationId: string
) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing agent configuration ID' });
    }

    // Check if agent config exists and belongs to organization
    const { data: existingConfig, error: fetchError } = await supabase
      .from('agent_configs')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !existingConfig) {
      return res.status(404).json({ error: 'Agent configuration not found' });
    }

    // Extract fields to update
    const { 
      name, 
      description, 
      personality_id, 
      default_goals, 
      allowed_actions, 
      memory_access_level, 
      decision_confidence_threshold, 
      max_message_length, 
      response_time_target_ms, 
      active 
    } = req.body;

    // Prepare update object
    const updateData: Partial<AgentConfig> = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    if (personality_id !== undefined) {
      // Validate personality exists and belongs to organization
      const { data: personality, error: personalityError } = await supabase
        .from('agent_personalities')
        .select('id')
        .eq('id', personality_id)
        .eq('organization_id', organizationId)
        .single();

      if (personalityError || !personality) {
        return res.status(400).json({ error: 'Invalid personality ID' });
      }
      
      updateData.personality_id = personality_id;
    }
    
    if (default_goals !== undefined) {
      updateData.default_goals = Array.isArray(default_goals) ? default_goals : [];
    }
    
    if (allowed_actions !== undefined) {
      updateData.allowed_actions = Array.isArray(allowed_actions) ? allowed_actions : [];
    }
    
    if (memory_access_level !== undefined) {
      if (!Object.values(MemoryAccessLevel).includes(memory_access_level)) {
        return res.status(400).json({ error: 'Invalid memory access level' });
      }
      updateData.memory_access_level = memory_access_level;
    }
    
    if (decision_confidence_threshold !== undefined) {
      if (decision_confidence_threshold < 0 || decision_confidence_threshold > 1) {
        return res.status(400).json({ error: 'Decision confidence threshold must be between 0 and 1' });
      }
      updateData.decision_confidence_threshold = decision_confidence_threshold;
    }
    
    if (max_message_length !== undefined) updateData.max_message_length = max_message_length;
    if (response_time_target_ms !== undefined) updateData.response_time_target_ms = response_time_target_ms;
    if (active !== undefined) updateData.active = active;
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Update agent config
    const { data, error } = await supabase
      .from('agent_configs')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent configuration:', error);
      return res.status(500).json({ error: 'Failed to update agent configuration' });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error updating agent configuration:', error);
    return res.status(500).json({
      error: 'Failed to update agent configuration',
      message: error.message
    });
  }
}

/**
 * Handle DELETE requests - Delete existing agent config
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  organizationId: string
) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing agent configuration ID' });
    }

    // Check if agent config exists and belongs to organization
    const { data: existingConfig, error: fetchError } = await supabase
      .from('agent_configs')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !existingConfig) {
      return res.status(404).json({ error: 'Agent configuration not found' });
    }

    // Check if agent is in use in any active conversations
    const { data: activeConversations, error: convError } = await supabase
      .from('conversation_contexts')
      .select('id')
      .eq('agent_id', id)
      .eq('organization_id', organizationId)
      .neq('conversation_state', 'ENDED')
      .limit(1);

    if (!convError && activeConversations && activeConversations.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete agent that is in use in active conversations',
        conversation_ids: activeConversations.map(conv => conv.id)
      });
    }

    // Delete agent memory preferences
    await supabase
      .from('agent_memory_preferences')
      .delete()
      .eq('agent_id', id)
      .eq('organization_id', organizationId);

    // Delete agent config
    const { error } = await supabase
      .from('agent_configs')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting agent configuration:', error);
      return res.status(500).json({ error: 'Failed to delete agent configuration' });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting agent configuration:', error);
    return res.status(500).json({
      error: 'Failed to delete agent configuration',
      message: error.message
    });
  }
}

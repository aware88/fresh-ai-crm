/**
 * API endpoint for managing agent personalities
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { AgentPersonality } from '@/lib/ai/agent/types';
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
 * Handle GET requests - List or get specific personality
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
      // Get specific personality
      const { data, error } = await supabase
        .from('agent_personalities')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Personality not found' });
      }

      return res.status(200).json(data);
    } else {
      // List all personalities for organization
      const { data, error } = await supabase
        .from('agent_personalities')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch personalities' });
      }

      return res.status(200).json(data);
    }
  } catch (error: any) {
    console.error('Error fetching personalities:', error);
    return res.status(500).json({
      error: 'Failed to fetch personalities',
      message: error.message
    });
  }
}

/**
 * Handle POST requests - Create new personality
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  organizationId: string
) {
  try {
    const { name, description, tone, communication_style, empathy_level, 
      assertiveness_level, formality_level, humor_level, expertise_areas, avatar_url } = req.body;

    // Validate required fields
    if (!name || !description || !tone || !communication_style || 
        empathy_level === undefined || assertiveness_level === undefined || 
        formality_level === undefined || humor_level === undefined || 
        !expertise_areas) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate numeric fields are between 0 and 1
    if (empathy_level < 0 || empathy_level > 1 ||
        assertiveness_level < 0 || assertiveness_level > 1 ||
        formality_level < 0 || formality_level > 1 ||
        humor_level < 0 || humor_level > 1) {
      return res.status(400).json({ error: 'Level values must be between 0 and 1' });
    }

    // Create new personality
    const newPersonality: Partial<AgentPersonality> = {
      organization_id: organizationId,
      name,
      description,
      tone: Array.isArray(tone) ? tone : [tone],
      communication_style,
      empathy_level,
      assertiveness_level,
      formality_level,
      humor_level,
      expertise_areas: Array.isArray(expertise_areas) ? expertise_areas : [expertise_areas],
      avatar_url
    };

    const { data, error } = await supabase
      .from('agent_personalities')
      .insert(newPersonality)
      .select()
      .single();

    if (error) {
      console.error('Error creating personality:', error);
      return res.status(500).json({ error: 'Failed to create personality' });
    }

    return res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating personality:', error);
    return res.status(500).json({
      error: 'Failed to create personality',
      message: error.message
    });
  }
}

/**
 * Handle PUT requests - Update existing personality
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
      return res.status(400).json({ error: 'Missing personality ID' });
    }

    // Check if personality exists and belongs to organization
    const { data: existingPersonality, error: fetchError } = await supabase
      .from('agent_personalities')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !existingPersonality) {
      return res.status(404).json({ error: 'Personality not found' });
    }

    // Extract fields to update
    const { name, description, tone, communication_style, empathy_level, 
      assertiveness_level, formality_level, humor_level, expertise_areas, avatar_url } = req.body;

    // Prepare update object
    const updateData: Partial<AgentPersonality> = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (tone !== undefined) updateData.tone = Array.isArray(tone) ? tone : [tone];
    if (communication_style !== undefined) updateData.communication_style = communication_style;
    if (empathy_level !== undefined) {
      if (empathy_level < 0 || empathy_level > 1) {
        return res.status(400).json({ error: 'Empathy level must be between 0 and 1' });
      }
      updateData.empathy_level = empathy_level;
    }
    if (assertiveness_level !== undefined) {
      if (assertiveness_level < 0 || assertiveness_level > 1) {
        return res.status(400).json({ error: 'Assertiveness level must be between 0 and 1' });
      }
      updateData.assertiveness_level = assertiveness_level;
    }
    if (formality_level !== undefined) {
      if (formality_level < 0 || formality_level > 1) {
        return res.status(400).json({ error: 'Formality level must be between 0 and 1' });
      }
      updateData.formality_level = formality_level;
    }
    if (humor_level !== undefined) {
      if (humor_level < 0 || humor_level > 1) {
        return res.status(400).json({ error: 'Humor level must be between 0 and 1' });
      }
      updateData.humor_level = humor_level;
    }
    if (expertise_areas !== undefined) {
      updateData.expertise_areas = Array.isArray(expertise_areas) ? expertise_areas : [expertise_areas];
    }
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Update personality
    const { data, error } = await supabase
      .from('agent_personalities')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating personality:', error);
      return res.status(500).json({ error: 'Failed to update personality' });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error updating personality:', error);
    return res.status(500).json({
      error: 'Failed to update personality',
      message: error.message
    });
  }
}

/**
 * Handle DELETE requests - Delete existing personality
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
      return res.status(400).json({ error: 'Missing personality ID' });
    }

    // Check if personality exists and belongs to organization
    const { data: existingPersonality, error: fetchError } = await supabase
      .from('agent_personalities')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !existingPersonality) {
      return res.status(404).json({ error: 'Personality not found' });
    }

    // Check if personality is in use by any agent configs
    const { data: usingConfigs, error: configError } = await supabase
      .from('agent_configs')
      .select('id')
      .eq('personality_id', id)
      .eq('organization_id', organizationId)
      .limit(1);

    if (!configError && usingConfigs && usingConfigs.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete personality that is in use by agents',
        agent_ids: usingConfigs.map(config => config.id)
      });
    }

    // Delete personality
    const { error } = await supabase
      .from('agent_personalities')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting personality:', error);
      return res.status(500).json({ error: 'Failed to delete personality' });
    }

    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting personality:', error);
    return res.status(500).json({
      error: 'Failed to delete personality',
      message: error.message
    });
  }
}

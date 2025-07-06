/**
 * API Route: /api/ai/memory/connect
 * 
 * Creates a relationship between two memories
 * Requires authentication and organization context
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { AIMemoryService, AIMemoryRelationship } from '@/lib/ai/memory/ai-memory-service';
import { Database } from '@/types/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client with server context
    const supabase = createServerSupabaseClient<Database>({ req, res });
    
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get organization ID from session
    const organizationId = session.user.user_metadata.organization_id;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }
    
    // Get relationship data from request body
    const { source_memory_id, target_memory_id, relationship_type, strength } = req.body;
    
    // Validate required fields
    if (!source_memory_id || !target_memory_id || !relationship_type) {
      return res.status(400).json({ 
        error: 'Source memory ID, target memory ID, and relationship type are required' 
      });
    }
    
    // Create relationship object
    const relationship: AIMemoryRelationship = {
      organization_id: organizationId,
      source_memory_id,
      target_memory_id,
      relationship_type,
      strength: strength || 0.5,
    };
    
    // Initialize AI Memory Service
    const memoryService = new AIMemoryService();
    
    // Connect the memories
    const createdRelationship = await memoryService.connectMemories(relationship);
    
    // Return the created relationship
    return res.status(200).json({ relationship: createdRelationship });
  } catch (error: any) {
    console.error('Error connecting memories:', error);
    return res.status(500).json({ error: 'Failed to connect memories', details: error.message });
  }
}

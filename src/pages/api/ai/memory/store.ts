/**
 * API Route: /api/ai/memory/store
 * 
 * Stores a new AI memory with generated embedding
 * Requires authentication and organization context
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { AIMemoryService, AIMemory } from '@/lib/ai/memory/ai-memory-service';
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
    
    // Get memory data from request body
    const { content, metadata, memory_type, importance_score } = req.body;
    
    // Validate required fields
    if (!content || !memory_type) {
      return res.status(400).json({ error: 'Content and memory_type are required' });
    }
    
    // Create memory object
    const memory: AIMemory = {
      organization_id: organizationId,
      user_id: session.user.id,
      content,
      metadata: metadata || {},
      memory_type,
      importance_score: importance_score || 0.5,
    };
    
    // Initialize AI Memory Service
    const memoryService = new AIMemoryService();
    
    // Store the memory
    const storedMemory = await memoryService.storeMemory(memory);
    
    // Return the stored memory
    return res.status(200).json({ memory: storedMemory });
  } catch (error: any) {
    console.error('Error storing memory:', error);
    return res.status(500).json({ error: 'Failed to store memory', details: error.message });
  }
}

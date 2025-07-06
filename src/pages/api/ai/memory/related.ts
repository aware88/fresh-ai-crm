/**
 * API Route: /api/ai/memory/related
 * 
 * Retrieves memories related to a specific memory
 * Requires authentication and organization context
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { AIMemoryService } from '@/lib/ai/memory/ai-memory-service';
import { Database } from '@/types/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET method
  if (req.method !== 'GET') {
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
    
    // Get memory ID from query parameters
    const { memoryId } = req.query;
    
    // Validate required fields
    if (!memoryId || typeof memoryId !== 'string') {
      return res.status(400).json({ error: 'Memory ID is required' });
    }
    
    // Initialize AI Memory Service
    const memoryService = new AIMemoryService();
    
    // Get related memories
    const relatedMemories = await memoryService.getRelatedMemories(memoryId, organizationId);
    
    // Return the related memories
    return res.status(200).json({ memories: relatedMemories });
  } catch (error: any) {
    console.error('Error getting related memories:', error);
    return res.status(500).json({ error: 'Failed to get related memories', details: error.message });
  }
}

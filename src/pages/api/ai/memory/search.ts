/**
 * API Route: /api/ai/memory/search
 * 
 * Searches AI memories using semantic similarity
 * Requires authentication and organization context
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { AIMemoryService, AIMemorySearchParams } from '@/lib/ai/memory/ai-memory-service';
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
    
    // Get search parameters from request body
    const { query, memory_types, min_importance, max_results, time_range, metadata_filters } = req.body;
    
    // Validate required fields
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Create search params object
    const searchParams: AIMemorySearchParams = {
      query,
      memory_types,
      min_importance,
      max_results,
      time_range,
      metadata_filters,
    };
    
    // Initialize AI Memory Service
    const memoryService = new AIMemoryService();
    
    // Search memories
    const searchResults = await memoryService.searchMemories(searchParams, organizationId);
    
    // Return the search results
    return res.status(200).json({ results: searchResults });
  } catch (error: any) {
    console.error('Error searching memories:', error);
    return res.status(500).json({ error: 'Failed to search memories', details: error.message });
  }
}

/**
 * API Route: /api/ai/memory/record-outcome
 * 
 * Records the outcome of a memory access
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
    
    // Get outcome data from request body
    const { access_id, outcome, outcome_score } = req.body;
    
    // Validate required fields
    if (!access_id || !outcome) {
      return res.status(400).json({ error: 'Access ID and outcome are required' });
    }
    
    // Initialize AI Memory Service
    const memoryService = new AIMemoryService();
    
    // Update memory outcome
    const updatedAccess = await memoryService.updateMemoryOutcome(
      access_id,
      outcome,
      outcome_score || 0.5
    );
    
    // Update memory importance based on this outcome
    await memoryService.updateMemoryImportance(updatedAccess.memory_id, organizationId);
    
    // Return the updated access record
    return res.status(200).json({ access: updatedAccess });
  } catch (error: any) {
    console.error('Error recording memory outcome:', error);
    return res.status(500).json({ error: 'Failed to record memory outcome', details: error.message });
  }
}

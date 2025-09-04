/**
 * Move Opportunity API Route
 * Handle moving opportunities between pipeline stages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PipelineService } from '@/lib/services/pipeline-service';
import { logger } from '@/lib/utils/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { opportunity_id, new_stage_id, note, organization_id } = body;

    if (!opportunity_id || !new_stage_id) {
      return NextResponse.json(
        { success: false, error: 'opportunity_id and new_stage_id are required' },
        { status: 400 }
      );
    }

    logger.apiRequest('POST', '/api/pipeline/opportunities/move', { 
      opportunity_id,
      new_stage_id,
      note,
      organization_id
    });

    const pipelineService = new PipelineService(supabase);
    await pipelineService.moveOpportunityToStage({
      opportunity_id,
      new_stage_id,
      note
    }, organization_id);

    logger.apiResponse('POST', '/api/pipeline/opportunities/move', 200, 0, {
      opportunity_id,
      new_stage_id
    });

    return NextResponse.json({
      success: true,
      message: 'Opportunity moved successfully'
    });

  } catch (error) {
    logger.error('Error in move opportunity API', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
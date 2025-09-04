/**
 * Pipeline Summary API Route
 * Get comprehensive pipeline analytics and summary
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pipelineId = params.id;

    logger.apiRequest('GET', `/api/pipeline/pipelines/${pipelineId}/summary`, { 
      pipeline_id: pipelineId
    });

    const pipelineService = new PipelineService(supabase);
    const summary = await pipelineService.getPipelineSummary(pipelineId);

    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Pipeline summary not found' },
        { status: 404 }
      );
    }

    logger.apiResponse('GET', `/api/pipeline/pipelines/${pipelineId}/summary`, 200, 0, {
      pipeline_id: pipelineId,
      total_opportunities: summary.total_opportunities,
      total_value: summary.total_value
    });

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Error in pipeline summary API', error, { pipelineId: params.id });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
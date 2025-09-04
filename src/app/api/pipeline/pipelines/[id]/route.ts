/**
 * Single Pipeline API Routes
 * Handle operations for specific pipelines
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
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');
    const priority = searchParams.get('priority');

    const pipelineId = params.id;

    logger.apiRequest('GET', `/api/pipeline/pipelines/${pipelineId}`, { 
      organization_id: organizationId,
      filters: { status, assigned_to: assignedTo, priority }
    });

    const pipelineService = new PipelineService(supabase);
    
    // Parse filters
    const filters: any = {};
    if (status) filters.status = status.split(',');
    if (assignedTo) filters.assigned_to = assignedTo;
    if (priority) filters.priority = priority.split(',');

    const pipeline = await pipelineService.getPipelineWithOpportunities(
      pipelineId,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    if (!pipeline) {
      return NextResponse.json(
        { success: false, error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    logger.apiResponse('GET', `/api/pipeline/pipelines/${pipelineId}`, 200, 0, {
      pipeline_id: pipelineId,
      stages_count: pipeline.stages?.length || 0,
      opportunities_count: pipeline.stages_with_opportunities?.reduce(
        (sum, stage) => sum + stage.opportunities_count, 0
      ) || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        pipeline: {
          ...pipeline,
          stages: pipeline.stages
        },
        stages_with_opportunities: pipeline.stages_with_opportunities
      }
    });

  } catch (error) {
    logger.error('Error in pipeline GET API', error, { pipelineId: params.id });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const pipelineId = params.id;

    logger.apiRequest('PUT', `/api/pipeline/pipelines/${pipelineId}`, { 
      pipeline_id: pipelineId
    });

    // Update pipeline logic would go here
    // For now, just return success
    
    logger.apiResponse('PUT', `/api/pipeline/pipelines/${pipelineId}`, 200, 0);

    return NextResponse.json({
      success: true,
      message: 'Pipeline update feature coming soon'
    });

  } catch (error) {
    logger.error('Error in pipeline PUT API', error, { pipelineId: params.id });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pipelineId = params.id;

    logger.apiRequest('DELETE', `/api/pipeline/pipelines/${pipelineId}`, { 
      pipeline_id: pipelineId
    });

    // Delete pipeline logic would go here
    // For now, just return success
    
    logger.apiResponse('DELETE', `/api/pipeline/pipelines/${pipelineId}`, 200, 0);

    return NextResponse.json({
      success: true,
      message: 'Pipeline deletion feature coming soon'
    });

  } catch (error) {
    logger.error('Error in pipeline DELETE API', error, { pipelineId: params.id });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
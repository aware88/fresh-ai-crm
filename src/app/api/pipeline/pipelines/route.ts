/**
 * Pipeline Management API Routes
 * Handle CRUD operations for sales pipelines
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    logger.apiRequest('GET', '/api/pipeline/pipelines', { 
      organization_id: organizationId
    });

    const pipelineService = new PipelineService(supabase);
    const pipelines = await pipelineService.getPipelines(
      organizationId || undefined
    );

    logger.apiResponse('GET', '/api/pipeline/pipelines', 200, 0, {
      pipelines_count: pipelines.length,
      organization_id: organizationId
    });

    return NextResponse.json({
      success: true,
      data: pipelines
    });

  } catch (error) {
    logger.error('Error in pipelines GET API', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, icon, stages, organization_id } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Pipeline name is required' },
        { status: 400 }
      );
    }

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one stage is required' },
        { status: 400 }
      );
    }

    logger.apiRequest('POST', '/api/pipeline/pipelines', { 
      name,
      stages_count: stages.length,
      organization_id
    });

    const pipelineService = new PipelineService(supabase);
    const pipeline = await pipelineService.createPipeline({
      name,
      description,
      color,
      icon,
      stages
    }, organization_id);

    logger.apiResponse('POST', '/api/pipeline/pipelines', 201, 0, {
      pipeline_id: pipeline.id,
      name: pipeline.name
    });

    return NextResponse.json({
      success: true,
      data: pipeline
    }, { status: 201 });

  } catch (error) {
    logger.error('Error in pipelines POST API', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
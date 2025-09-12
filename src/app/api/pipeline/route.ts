import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '@/lib/supabase/server';
import { PipelineService } from '@/lib/services/pipeline-service';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ pipelines: [] }, { status: 200 });
    }

    // Get organization ID from session (may be undefined)
    const organizationId = (session.user as any).organizationId;

    // Initialize Supabase client and pipeline service
    const supabase = await createServerClient();
    const pipelineService = new PipelineService(supabase);

    // Get pipelines with their stages
    const pipelines = await pipelineService.getPipelines(organizationId);

    // Calculate summary metrics for each pipeline
    const pipelinesWithMetrics = await Promise.all(
      pipelines.map(async (pipeline) => {
        try {
          // Get opportunities for this pipeline to calculate metrics
          const pipelineWithOpps = await pipelineService.getPipelineWithOpportunities(pipeline.id);
          
          const opportunities_count = pipelineWithOpps.stages_with_opportunities?.reduce(
            (sum, stage) => sum + stage.opportunities_count, 0
          ) || 0;
          
          const total_value = pipelineWithOpps.stages_with_opportunities?.reduce(
            (sum, stage) => sum + stage.total_value, 0
          ) || 0;
          
          const weighted_value = pipelineWithOpps.stages_with_opportunities?.reduce(
            (sum, stage) => sum + stage.weighted_value, 0
          ) || 0;

          return {
            ...pipeline,
            opportunities_count,
            total_value,
            weighted_value
          };
        } catch (error) {
          logger.error('Failed to get pipeline metrics', error, { pipelineId: pipeline.id });
          // Return pipeline with zero metrics if calculation fails
          return {
            ...pipeline,
            opportunities_count: 0,
            total_value: 0,
            weighted_value: 0
          };
        }
      })
    );

    return NextResponse.json({ pipelines: pipelinesWithMetrics });
  } catch (error) {
    logger.error('Pipeline API error:', error);
    // Return 200 with empty pipelines instead of 500 error
    return NextResponse.json({ 
      pipelines: [],
      message: 'Unable to load pipelines'
    }, { status: 200 });
  }
}

// POST endpoint to create a new pipeline
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const organizationId = (session.user as any).organizationId;

    // Initialize Supabase client and pipeline service
    const supabase = await createServerClient();
    const pipelineService = new PipelineService(supabase);

    // Create pipeline with default stages if none provided
    const pipelineData = {
      name: body.name || 'New Pipeline',
      description: body.description,
      color: body.color || '#3B82F6',
      icon: body.icon || 'pipeline',
      stages: body.stages || [
        { name: 'Lead', probability: 10, color: '#EF4444', description: 'Initial contact' },
        { name: 'Qualified', probability: 25, color: '#F59E0B', description: 'Qualified lead' },
        { name: 'Proposal', probability: 50, color: '#10B981', description: 'Proposal sent' },
        { name: 'Negotiation', probability: 75, color: '#8B5CF6', description: 'In negotiation' },
        { name: 'Closed Won', probability: 100, color: '#059669', description: 'Deal closed' }
      ]
    };

    const pipeline = await pipelineService.createPipeline(pipelineData, organizationId);

    return NextResponse.json({ pipeline });
  } catch (error) {
    logger.error('Failed to create pipeline', error);
    return NextResponse.json({ error: 'Failed to create pipeline' }, { status: 400 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '@/lib/supabase/server';
import { PipelineService } from '@/lib/services/pipeline-service';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ opportunities: [] }, { status: 200 });
    }

    const { id } = await params;
    const organizationId = (session.user as any).organizationId;

    // Initialize Supabase client and pipeline service
    const supabase = await createServerClient();
    const pipelineService = new PipelineService(supabase);

    // Get pipeline with opportunities
    const pipelineWithOpps = await pipelineService.getPipelineWithOpportunities(id);
    
    // Extract all opportunities from all stages
    const opportunities = pipelineWithOpps.stages_with_opportunities?.flatMap(
      stage => stage.opportunities || []
    ) || [];

    return NextResponse.json({ opportunities });
  } catch (error) {
    logger.error('Pipeline opportunities API error:', error);
    // Return 200 with empty opportunities instead of 500 error
    return NextResponse.json({ 
      opportunities: [],
      message: 'Unable to load opportunities'
    }, { status: 200 });
  }
}

// POST endpoint to create a new opportunity
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: pipelineId } = await params;
    const body = await request.json();
    const organizationId = (session.user as any).organizationId;

    // Initialize Supabase client and pipeline service
    const supabase = await createServerClient();
    const pipelineService = new PipelineService(supabase);

    // Get pipeline to get the first stage
    const pipeline = await pipelineService.getPipelineWithOpportunities(pipelineId);
    const firstStage = pipeline.stages?.[0];
    
    if (!firstStage) {
      return NextResponse.json({ error: 'Pipeline has no stages' }, { status: 400 });
    }

    // Create opportunity
    const opportunityData = {
      title: body.title,
      description: body.description,
      value: body.value || 0,
      probability: body.probability || firstStage.probability || 10,
      pipeline_id: pipelineId,
      stage_id: body.stage_id || firstStage.id,
      contact_id: body.contact_id,
      assigned_to: body.assigned_to || session.user.id,
      expected_close_date: body.expected_close_date,
      currency: body.currency || 'USD',
      priority: body.priority || 'medium',
      status: 'active' as const
    };

    const opportunity = await pipelineService.createOpportunity(opportunityData, organizationId);

    return NextResponse.json({ opportunity });
  } catch (error) {
    logger.error('Failed to create opportunity', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 400 });
  }
}
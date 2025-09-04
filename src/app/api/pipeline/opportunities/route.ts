/**
 * Opportunities API Routes
 * Handle CRUD operations for sales opportunities
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
    const { 
      title, 
      description, 
      contact_id, 
      pipeline_id, 
      stage_id, 
      value, 
      currency,
      expected_close_date,
      assigned_to,
      priority,
      source,
      tags,
      organization_id 
    } = body;

    if (!title || !pipeline_id || !stage_id) {
      return NextResponse.json(
        { success: false, error: 'Title, pipeline_id, and stage_id are required' },
        { status: 400 }
      );
    }

    logger.apiRequest('POST', '/api/pipeline/opportunities', { 
      title,
      pipeline_id,
      stage_id,
      organization_id
    });

    const pipelineService = new PipelineService(supabase);
    const opportunity = await pipelineService.createOpportunity({
      title,
      description,
      contact_id,
      pipeline_id,
      stage_id,
      value,
      currency,
      expected_close_date,
      assigned_to,
      priority,
      source,
      tags
    }, organization_id);

    logger.apiResponse('POST', '/api/pipeline/opportunities', 201, 0, {
      opportunity_id: opportunity.id,
      title: opportunity.title
    });

    return NextResponse.json({
      success: true,
      data: opportunity
    }, { status: 201 });

  } catch (error) {
    logger.error('Error in opportunities POST API', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
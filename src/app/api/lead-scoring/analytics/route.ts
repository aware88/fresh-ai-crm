/**
 * Lead Scoring Analytics API
 * Provides insights and analytics for lead scoring performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LeadScoringService } from '@/lib/services/lead-scoring-service';
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

    logger.apiRequest('GET', '/api/lead-scoring/analytics', { 
      organization_id: organizationId
    });

    const leadScoringService = new LeadScoringService(supabase);
    const analytics = await leadScoringService.getLeadScoringAnalytics(
      organizationId || undefined
    );

    logger.apiResponse('GET', '/api/lead-scoring/analytics', 200, 0, {
      organization_id: organizationId,
      total_contacts: analytics.total_contacts,
      scored_contacts: analytics.scored_contacts
    });

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Error in lead scoring analytics API', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
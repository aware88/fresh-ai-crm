/**
 * Lead Scoring API - Calculate scores for contacts
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact_id, contact_ids, organization_id } = body;

    const leadScoringService = new LeadScoringService(supabase);

    // Single contact calculation
    if (contact_id) {
      logger.apiRequest('POST', '/api/lead-scoring/calculate', { 
        type: 'single',
        contact_id 
      });

      const score = await leadScoringService.calculateLeadScore(contact_id);
      
      if (!score) {
        return NextResponse.json(
          { error: 'Failed to calculate lead score' },
          { status: 404 }
        );
      }

      const breakdown = await leadScoringService.getScoreBreakdown(contact_id);

      logger.apiResponse('POST', '/api/lead-scoring/calculate', 200, 0, {
        contact_id,
        score: score.overall_score
      });

      return NextResponse.json({
        success: true,
        data: {
          score,
          breakdown
        }
      });
    }

    // Bulk contact calculation
    if (contact_ids && Array.isArray(contact_ids)) {
      logger.apiRequest('POST', '/api/lead-scoring/calculate', { 
        type: 'bulk',
        count: contact_ids.length,
        organization_id
      });

      const results = await leadScoringService.bulkCalculateScores(
        contact_ids,
        organization_id
      );

      logger.apiResponse('POST', '/api/lead-scoring/calculate', 200, 0, {
        type: 'bulk',
        success: results.success,
        failed: results.failed
      });

      return NextResponse.json({
        success: true,
        data: results
      });
    }

    return NextResponse.json(
      { error: 'Either contact_id or contact_ids array is required' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Error in lead scoring calculation API', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contact_id');
    const organizationId = searchParams.get('organization_id');

    if (!contactId) {
      return NextResponse.json(
        { error: 'contact_id parameter is required' },
        { status: 400 }
      );
    }

    logger.apiRequest('GET', '/api/lead-scoring/calculate', { 
      contact_id: contactId,
      organization_id: organizationId
    });

    const leadScoringService = new LeadScoringService(supabase);
    const score = await leadScoringService.getLeadScore(contactId);
    
    if (!score) {
      // Calculate score if it doesn't exist
      const newScore = await leadScoringService.calculateLeadScore(contactId);
      const breakdown = await leadScoringService.getScoreBreakdown(contactId);
      
      return NextResponse.json({
        success: true,
        data: {
          score: newScore,
          breakdown,
          calculated: true
        }
      });
    }

    const breakdown = await leadScoringService.getScoreBreakdown(contactId);

    logger.apiResponse('GET', '/api/lead-scoring/calculate', 200, 0, {
      contact_id: contactId,
      score_found: !!score
    });

    return NextResponse.json({
      success: true,
      data: {
        score,
        breakdown,
        calculated: false
      }
    });

  } catch (error) {
    logger.error('Error in get lead score API', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
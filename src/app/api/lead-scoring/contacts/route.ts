/**
 * Lead Scoring Contacts API
 * Get contacts with their lead scores and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LeadScoringService } from '@/lib/services/lead-scoring-service';
import { logger } from '@/lib/utils/logger';
import type { QualificationStatus } from '@/types/lead-scoring';

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
    const qualificationStatus = searchParams.get('qualification_status');
    const minScore = searchParams.get('min_score');
    const maxScore = searchParams.get('max_score');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Parse filters
    const filters: any = {};
    
    if (qualificationStatus) {
      filters.qualification_status = qualificationStatus.split(',') as QualificationStatus[];
    }
    
    if (minScore) {
      filters.min_score = parseInt(minScore, 10);
    }
    
    if (maxScore) {
      filters.max_score = parseInt(maxScore, 10);
    }
    
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }
    
    if (offset) {
      filters.offset = parseInt(offset, 10);
    }

    logger.apiRequest('GET', '/api/lead-scoring/contacts', { 
      organization_id: organizationId,
      filters
    });

    const leadScoringService = new LeadScoringService(supabase);
    const contacts = await leadScoringService.getContactsWithScores(
      organizationId || undefined,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    logger.apiResponse('GET', '/api/lead-scoring/contacts', 200, 0, {
      organization_id: organizationId,
      contacts_returned: contacts.length
    });

    return NextResponse.json({
      success: true,
      data: {
        contacts,
        count: contacts.length,
        filters_applied: filters
      }
    });

  } catch (error) {
    logger.error('Error in lead scoring contacts API', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact_id, qualification_status, reason } = body;

    if (!contact_id || !qualification_status) {
      return NextResponse.json(
        { error: 'contact_id and qualification_status are required' },
        { status: 400 }
      );
    }

    const validStatuses: QualificationStatus[] = ['hot', 'warm', 'cold', 'unqualified'];
    if (!validStatuses.includes(qualification_status)) {
      return NextResponse.json(
        { error: 'Invalid qualification_status' },
        { status: 400 }
      );
    }

    logger.apiRequest('PUT', '/api/lead-scoring/contacts', { 
      contact_id,
      qualification_status,
      reason
    });

    const leadScoringService = new LeadScoringService(supabase);
    await leadScoringService.updateQualificationStatus(
      contact_id,
      qualification_status,
      reason
    );

    logger.apiResponse('PUT', '/api/lead-scoring/contacts', 200, 0, {
      contact_id,
      qualification_status
    });

    return NextResponse.json({
      success: true,
      message: 'Qualification status updated successfully'
    });

  } catch (error) {
    logger.error('Error in update qualification status API', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
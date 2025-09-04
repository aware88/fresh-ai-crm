/**
 * Email Queue Review API Route
 * 
 * This file contains the API route for getting emails that require review:
 * - GET: Get emails requiring manual review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getEmailsRequiringReview } from '@/lib/email/emailQueueService';

// GET /api/email-queue/review - Get emails requiring manual review
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    
    // Get emails requiring review
    const emails = await getEmailsRequiringReview(
      user.id,
      organizationId || undefined
    );
    
    return NextResponse.json(emails);
  } catch (error) {
    console.error('Error getting emails requiring review:', error);
    return NextResponse.json(
      { error: 'Failed to get emails requiring review' },
      { status: 500 }
    );
  }
}

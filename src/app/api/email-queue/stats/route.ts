/**
 * Email Queue Statistics API Route
 * 
 * This file contains the API route for getting email queue statistics:
 * - GET: Get statistics about the email queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getQueueStatistics } from '@/lib/email/emailQueueWorker';

// GET /api/email-queue/stats - Get queue statistics
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
    
    // Get queue statistics
    const stats = await getQueueStatistics(
      user.id,
      organizationId || undefined
    );
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting queue statistics:', error);
    return NextResponse.json(
      { error: 'Failed to get queue statistics' },
      { status: 500 }
    );
  }
}

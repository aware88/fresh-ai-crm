/**
 * Email Queue Processing with Recommendations API Route
 * 
 * This file contains the API route for processing emails in the queue with product recommendations:
 * - POST: Process a batch of emails in the queue with product recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { processEmailQueueWithRecommendations } from '@/lib/email/emailQueueWorkerWithRecommendations';

// POST /api/email-queue/process-with-recommendations - Process emails in the queue with product recommendations
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const { batchSize = 10, organizationId } = await request.json();
    
    // Process the queue with recommendations
    const results = await processEmailQueueWithRecommendations(
      batchSize,
      user.id,
      organizationId
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing email queue with recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to process email queue with recommendations' },
      { status: 500 }
    );
  }
}

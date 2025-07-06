/**
 * Email Queue Processing API Route
 * 
 * This file contains the API route for processing emails in the queue:
 * - POST: Process a batch of emails in the queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { processEmailQueue } from '@/lib/email/emailQueueWorker';

// POST /api/email-queue/process - Process emails in the queue
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
    
    // Process the queue
    const results = await processEmailQueue(
      batchSize,
      user.id,
      organizationId
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing email queue:', error);
    return NextResponse.json(
      { error: 'Failed to process email queue' },
      { status: 500 }
    );
  }
}

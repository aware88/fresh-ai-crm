/**
 * Email Queue Review Item API Route
 * 
 * This file contains the API route for reviewing a specific email in the queue:
 * - POST: Approve or reject an email response
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { reviewEmailResponse } from '@/lib/email/emailQueueService';

// POST /api/email-queue/review/[id] - Approve or reject an email response
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the queue item ID from the URL
    const queueItemId = params.id;
    if (!queueItemId) {
      return NextResponse.json(
        { error: 'Missing queue item ID' },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const { approved, feedback } = await request.json();
    
    // Validate required fields
    if (approved === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: approved' },
        { status: 400 }
      );
    }
    
    // Review the email response
    const result = await reviewEmailResponse(
      queueItemId,
      approved,
      user.id,
      feedback
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error reviewing email response:', error);
    return NextResponse.json(
      { error: 'Failed to review email response' },
      { status: 500 }
    );
  }
}

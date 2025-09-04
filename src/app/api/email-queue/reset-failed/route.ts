/**
 * Email Queue Reset Failed Items API Route
 * 
 * This file contains the API route for resetting failed queue items:
 * - POST: Reset failed queue items to pending status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { resetFailedQueueItems } from '@/lib/email/emailQueueWorker';

// POST /api/email-queue/reset-failed - Reset failed queue items
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const { maxAttempts = 3, organizationId } = await request.json();
    
    // Reset failed queue items
    const count = await resetFailedQueueItems(
      user.id,
      organizationId || undefined,
      maxAttempts
    );
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error resetting failed queue items:', error);
    return NextResponse.json(
      { error: 'Failed to reset failed queue items' },
      { status: 500 }
    );
  }
}

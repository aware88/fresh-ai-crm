/**
 * Email Queue Cleanup API Route
 * 
 * This file contains the API route for cleaning up old queue items:
 * - POST: Clean up old completed queue items
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cleanupOldQueueItems } from '@/lib/email/emailQueueWorker';

// POST /api/email-queue/cleanup - Clean up old queue items
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const { olderThanDays = 30, organizationId } = await request.json();
    
    // Clean up old queue items
    const count = await cleanupOldQueueItems(
      user.id,
      organizationId || undefined,
      olderThanDays
    );
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error cleaning up old queue items:', error);
    return NextResponse.json(
      { error: 'Failed to clean up old queue items' },
      { status: 500 }
    );
  }
}

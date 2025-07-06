/**
 * Email Queue Processing API Route
 * 
 * This module provides an API endpoint for processing the email queue.
 * It can be called manually or by a scheduled task.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { processEmailQueue, getQueueStatistics, resetFailedQueueItems } from '@/lib/email/emailQueueWorker';

// POST /api/email/queue/process - Process the email queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batchSize = 10, action } = body;
    
    // Verify service token for automated processing
    const serviceToken = request.headers.get('X-Service-Token');
    const isServiceRequest = serviceToken === process.env.SERVICE_TOKEN;
    
    // If not a service request, require authentication
    let userId: string;
    let organizationId: string | undefined;
    
    if (!isServiceRequest) {
      // Get authenticated user
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      userId = user.id;
      
      // Get organization ID if available
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      organizationId = orgMember?.organization_id;
    } else {
      // For service requests, use a system user ID
      userId = '00000000-0000-0000-0000-000000000000'; // System user ID
    }
    
    // Handle different actions
    if (action === 'reset_failed') {
      const maxAttempts = body.maxAttempts || 3;
      const resetCount = await resetFailedQueueItems(userId, organizationId, maxAttempts);
      return NextResponse.json({ success: true, resetCount });
    } else if (action === 'stats') {
      const stats = await getQueueStatistics(userId, organizationId);
      return NextResponse.json({ stats });
    } else {
      // Default action: process queue
      const results = await processEmailQueue(batchSize, userId, organizationId);
      return NextResponse.json({ results });
    }
  } catch (error) {
    console.error('Error in POST /api/email/queue/process:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Email Queue API Routes
 * 
 * This module provides API endpoints for managing the email processing queue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  addEmailToQueue, 
  getNextEmailToProcess, 
  processQueuedEmail,
  getEmailsRequiringReview,
  reviewEmailResponse,
  EmailQueuePriority,
  EmailQueueStatus
} from '@/lib/email/emailQueueService';

// GET /api/email/queue - Get emails in the queue
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get organization ID if available
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const organizationId = orgMember?.organization_id;
    
    // Handle different status queries
    if (status === 'review') {
      const queueItems = await getEmailsRequiringReview(user.id, organizationId);
      return NextResponse.json({ queueItems });
    } else {
      // Query the database directly for other statuses
      let query = supabase
        .from('email_queue')
        .select('*, emails(*), contacts(*)')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });
      
      // Add status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Add organization filter if available
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data: queueItems, error } = await query;
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ queueItems });
    }
  } catch (error) {
    console.error('Error in GET /api/email/queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/email/queue - Add an email to the queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailId, contactId, priority } = body;
    
    // Validate required fields
    if (!emailId || !contactId) {
      return NextResponse.json(
        { error: 'Email ID and Contact ID are required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get organization ID if available
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const organizationId = orgMember?.organization_id;
    
    // Add email to queue
    const queueItem = await addEmailToQueue(
      emailId,
      contactId,
      priority || EmailQueuePriority.MEDIUM,
      user.id,
      organizationId
    );
    
    return NextResponse.json({ queueItem });
  } catch (error) {
    console.error('Error in POST /api/email/queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/email/queue/:id - Update a queue item (process or review)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const queueItemId = params.id;
    const body = await request.json();
    const { action, approved, feedback } = body;
    
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Handle different actions
    if (action === 'process') {
      const result = await processQueuedEmail(queueItemId, user.id);
      return NextResponse.json({ result });
    } else if (action === 'review') {
      if (approved === undefined) {
        return NextResponse.json(
          { error: 'Approval status is required for review' },
          { status: 400 }
        );
      }
      
      const queueItem = await reviewEmailResponse(queueItemId, approved, user.id, feedback);
      return NextResponse.json({ queueItem });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "process" or "review"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in PUT /api/email/queue/:id:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/email/queue/:id - Remove an item from the queue
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const queueItemId = params.id;
    
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete the queue item
    const { error } = await supabase
      .from('email_queue')
      .delete()
      .eq('id', queueItemId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/email/queue/:id:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

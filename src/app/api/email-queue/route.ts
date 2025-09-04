/**
 * Email Queue API Routes
 * 
 * This file contains API routes for managing the email queue:
 * - POST: Add an email to the queue
 * - GET: Get queue items with optional filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { addEmailToQueue, EmailQueuePriority } from '@/lib/email/emailQueueService';

// POST /api/email-queue - Add an email to the queue
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const { emailId, contactId, priority, organizationId } = await request.json();
    
    // Validate required fields
    if (!emailId || !contactId) {
      return NextResponse.json(
        { error: 'Missing required fields: emailId and contactId are required' },
        { status: 400 }
      );
    }
    
    // Add the email to the queue
    const queueItem = await addEmailToQueue(
      emailId,
      contactId,
      priority as EmailQueuePriority || EmailQueuePriority.MEDIUM,
      user.id,
      organizationId
    );
    
    return NextResponse.json(queueItem);
  } catch (error) {
    console.error('Error adding email to queue:', error);
    return NextResponse.json(
      { error: 'Failed to add email to queue' },
      { status: 500 }
    );
  }
}

// GET /api/email-queue - Get queue items with optional filters
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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build the query
    let query = supabase
      .from('email_queue')
      .select('*, emails(subject, content, from, to)')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // Add filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    // Execute the query
    const { data: queueItems, error } = await query;
    
    if (error) {
      console.error('Error fetching queue items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch queue items' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(queueItems);
  } catch (error) {
    console.error('Error fetching queue items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue items' },
      { status: 500 }
    );
  }
}

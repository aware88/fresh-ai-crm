import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { FollowUpService } from '@/lib/email/follow-up-service';

/**
 * GET handler for retrieving follow-ups
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.split(',');
    const priority = searchParams.get('priority')?.split(',');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const organizationId = searchParams.get('organization_id') || undefined;
    const dueOnly = searchParams.get('due_only') === 'true';
    
    const followUpService = new FollowUpService();
    
    let followups;
    if (dueOnly) {
      followups = await followUpService.getDueFollowups(session.user.id, organizationId);
    } else {
      followups = await followUpService.getFollowups(session.user.id, {
        status,
        priority,
        limit,
        organizationId
      });
    }
    
    return NextResponse.json({ followups });
  } catch (error) {
    console.error('Error in GET /api/email/followups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating follow-ups
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.emailId || !body.originalSubject || !body.originalRecipients) {
      return NextResponse.json(
        { error: 'Missing required fields: emailId, originalSubject, originalRecipients' },
        { status: 400 }
      );
    }
    
    const followUpService = new FollowUpService();
    
    const followup = await followUpService.createFollowup({
      emailId: body.emailId,
      userId: session.user.id,
      organizationId: body.organizationId,
      originalSentAt: new Date(body.originalSentAt || new Date()),
      followUpDays: body.followUpDays || 3,
      priority: body.priority || 'medium',
      followUpType: body.followUpType || 'manual',
      originalSubject: body.originalSubject,
      originalRecipients: body.originalRecipients,
      contextSummary: body.contextSummary,
      followUpReason: body.followUpReason,
      metadata: body.metadata
    });
    
    if (!followup) {
      return NextResponse.json(
        { error: 'Failed to create follow-up' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ followup }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/email/followups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

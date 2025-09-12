import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { emailDraftService } from '@/lib/email/draft-service';

/**
 * POST /api/email/save-draft
 * 
 * Save a user-created email draft
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    
    console.log('[API] Saving user draft for user', userId);
    
    const { 
      to = [], 
      cc = [], 
      bcc = [], 
      subject = '', 
      body: emailBody = '', 
      accountId,
      priority = 'normal'
    } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Use the email draft service to save to the actual email server
    const result = await emailDraftService.saveDraft(accountId, {
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject,
      body: emailBody,
      attachments: [] // TODO: Handle attachments if needed
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save draft' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Draft saved to email server successfully',
      draftId: result.draftId,
      provider: 'email_server'
    });

  } catch (error) {
    console.error('[API] Error saving draft:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/save-draft?accountId=xxx
 * 
 * Get saved drafts for the user from email server
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Use the email draft service to get drafts from the actual email server
    const result = await emailDraftService.getDrafts(accountId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get drafts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      drafts: result.drafts || [],
      provider: 'email_server'
    });

  } catch (error) {
    console.error('[API] Error getting drafts:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get drafts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
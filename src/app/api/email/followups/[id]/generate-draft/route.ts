import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { FollowUpService } from '@/lib/email/follow-up-service';
import { FollowUpAIService } from '@/lib/email/followup-ai-service';

/**
 * POST handler for generating AI follow-up drafts
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to fix Next.js 15 requirement
    const { id } = await params;
    
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const followUpService = new FollowUpService();
    const aiService = new FollowUpAIService();
    
    // Get the follow-up details
    const followups = await followUpService.getFollowups(session.user.id);
    const followup = followups.find(f => f.id === id);
    
    if (!followup) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }
    
    // Get original email details (this would need to be implemented)
    // For now, we'll use the follow-up data
    const originalEmail = {
      id: followup.email_id,
      subject: followup.original_subject,
      content: followup.context_summary || 'Original email content',
      recipients: followup.original_recipients,
      sentAt: new Date(followup.original_sent_at)
    };
    
    // Calculate days since original
    const daysSinceOriginal = Math.floor(
      (new Date().getTime() - new Date(followup.original_sent_at).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    // Build AI context
    const aiContext = {
      followupId: followup.id!,
      originalEmail,
      followUpReason: followup.follow_up_reason || 'No response received',
      priority: followup.priority as 'low' | 'medium' | 'high' | 'urgent',
      daysSinceOriginal,
      organizationId: followup.organization_id,
      userId: session.user.id
    };
    
    // Generate draft options
    const draftOptions = {
      tone: body.tone || 'professional',
      approach: body.approach || 'gentle',
      includeOriginalContext: body.includeOriginalContext !== false,
      maxLength: body.maxLength || 'medium',
      language: body.language || 'English',
      customInstructions: body.customInstructions
    };
    
    let result;
    
    if (body.generateVariations) {
      // Generate multiple variations
      const variations = await aiService.generateFollowUpVariations(aiContext, draftOptions);
      result = {
        success: variations.length > 0,
        variations: variations.map(v => v.draft).filter(Boolean),
        totalCost: variations.reduce((sum, v) => sum + v.costUsd, 0),
        totalTokens: variations.reduce((sum, v) => sum + v.tokensUsed, 0)
      };
    } else {
      // Generate single draft
      result = await aiService.generateFollowUpDraft(aiContext, draftOptions);
    }
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate draft' },
        { status: 500 }
      );
    }
    
    // Update follow-up with AI draft info using correct property names
    await followUpService.updateFollowupStatus(id, followup.status, {
      ai_draft_content: result.draft || (result as any).variations?.[0] || '',
      ai_draft_generated_at: new Date().toISOString()
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in POST /api/email/followups/[id]/generate-draft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
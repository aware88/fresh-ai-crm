import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '../../../../lib/supabase/server';
import { getOpenAIClient } from '../../../../lib/openai/client';
import { UnifiedAIDraftingService } from '../../../../lib/ai/unified-drafting-service';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { emailId, originalEmail, settings } = await req.json();

    if (!emailId || !originalEmail) {
      return NextResponse.json(
        { success: false, message: 'Email ID and original email are required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createServerClient();

    // Get email context and history
    const { data: emailData, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('created_by', userId)
      .single();

    // Handle virtual emails (like sales context emails that don't exist in database)
    let contextEmailData = emailData;
    if (emailError || !emailData) {
      // Check if this is a virtual email ID (starts with 'sales-', 'analysis-', etc.)
      if (emailId.startsWith('sales-') || emailId.startsWith('analysis-') || emailId.startsWith('virtual-')) {
        // Create virtual email data from the originalEmail
        contextEmailData = {
          id: emailId,
          subject: originalEmail.subject,
          raw_content: originalEmail.body,
          from_email: originalEmail.from,
          to_email: originalEmail.to,
          analysis: null,
          metadata: { virtual: true, context: 'sales_agent' },
          created_at: new Date().toISOString(),
          created_by: userId
        };
      } else {
        // Real email ID but not found in database
        return NextResponse.json(
          { success: false, message: 'Email not found' },
          { status: 404 }
        );
      }
    }

    // Get organization ID for user
    let organizationId;
    try {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', userId)
        .single();
      organizationId = userOrg?.organization_id;
    } catch (error) {
      console.log('[AI Draft] No organization found for user');
    }

    // Initialize unified AI drafting service
    const openai = getOpenAIClient();
    const unifiedService = new UnifiedAIDraftingService(supabase, openai, organizationId || '', userId);

    // Prepare drafting context
    const draftingContext = {
      emailId,
      originalEmail,
      userId,
      organizationId,
      settings,
      isVirtual: emailId.startsWith('sales-') || emailId.startsWith('analysis-') || emailId.startsWith('virtual-')
    };

    // Generate draft using unified service
    const result = await unifiedService.generateDraft(draftingContext);

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate draft');
    }

    const parsedResponse = result.draft!;
    
    // Draft is already saved by unified service if not virtual
    console.log(`💾 Draft generated using unified service - v${result.metadata.versionNumber} (${result.metadata.modelUsed}, ${result.metadata.tokensUsed} tokens, $${result.metadata.costUsd.toFixed(4)})`);

    return NextResponse.json({
      success: true,
      id: `unified-${result.metadata.versionNumber}-${Date.now()}`,
      subject: parsedResponse.subject,
      body: parsedResponse.body,
      tone: parsedResponse.tone,
      confidence: parsedResponse.confidence,
      context: parsedResponse.context,
      metadata: result.metadata // Include performance metrics
    });

  } catch (error) {
    console.error('Error generating AI draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      },
      { status: 500 }
    );
  }
}

// Helper functions removed - now handled by UnifiedAIDraftingService 
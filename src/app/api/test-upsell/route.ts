/**
 * Test endpoint for Universal Upsell Agent
 * 
 * This endpoint allows testing the upsell functionality directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { UniversalUpsellAgent, UpsellContext } from '@/lib/agents/universal-upsell-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { email_content, email_subject, organization_id, user_id } = body;
    
    if (!email_content || !organization_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: email_content, organization_id, user_id' },
        { status: 400 }
      );
    }

    const agent = new UniversalUpsellAgent();
    
    const context: UpsellContext = {
      email_content,
      email_subject: email_subject || 'Test Email',
      organization_id,
      user_id,
      conversation_history: body.conversation_history || []
    };

    console.log('[Test Upsell API] Processing request:', {
      email_content: email_content.substring(0, 100) + '...',
      organization_id,
      user_id
    });

    const opportunities = await agent.generateUpsellOpportunities(context);

    return NextResponse.json({
      success: true,
      opportunities_found: opportunities.length,
      opportunities: opportunities.map(opp => ({
        id: opp.id,
        source_product: opp.source_product.name,
        target_product: opp.target_product.name,
        relationship_type: opp.relationship_type,
        confidence_score: opp.confidence_score,
        reasoning: opp.reasoning,
        offer_strategy: opp.offer_strategy,
        discount_percent: opp.discount_percent,
        context: {
          email_context: opp.context.email_context,
          previous_rejections: opp.context.previous_rejections
        }
      }))
    });

  } catch (error) {
    console.error('[Test Upsell API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        opportunities_found: 0,
        opportunities: []
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Universal Upsell Agent Test API',
    usage: 'POST with { email_content, email_subject?, organization_id, user_id, conversation_history? }',
    example: {
      email_content: 'I am interested in buying a phone case for my iPhone',
      email_subject: 'Phone case inquiry',
      organization_id: 'your-org-id',
      user_id: 'your-user-id'
    }
  });
}

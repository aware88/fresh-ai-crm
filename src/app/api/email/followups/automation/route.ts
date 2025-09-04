import { NextRequest, NextResponse } from 'next/server';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { FollowUpAutomationService, AutomationRule } from '@/lib/email/followup-automation-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createLazyServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const automationService = new FollowUpAutomationService();
    const rules = await automationService.getAutomationRules(session.user.id, organizationId || undefined);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createLazyServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const ruleData: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'> = {
      user_id: session.user.id,
      organization_id: organizationId || undefined,
      ...body
    };

    const automationService = new FollowUpAutomationService();
    const rule = await automationService.createAutomationRule(ruleData);

    if (!rule) {
      return NextResponse.json(
        { error: 'Failed to create automation rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return NextResponse.json(
      { error: 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}




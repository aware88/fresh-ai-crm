import { NextRequest, NextResponse } from 'next/server';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { FollowUpAutomationService } from '@/lib/email/followup-automation-service';

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
    const stats = await automationService.getAutomationStats(session.user.id, organizationId || undefined);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching automation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation stats' },
      { status: 500 }
    );
  }
}




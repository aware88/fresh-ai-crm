import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { FollowUpService } from '@/lib/email/follow-up-service';

/**
 * GET handler for retrieving follow-up statistics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const followUpService = new FollowUpService();
    const stats = await followUpService.getFollowupStats(session.user.id);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in GET /api/email/followups/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

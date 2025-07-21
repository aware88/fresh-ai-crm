import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { aiPreferencesService } from '@/lib/ai/ai-preferences-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await aiPreferencesService.getPreferencesStats(session.user.id);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching preferences stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences stats' },
      { status: 500 }
    );
  }
} 
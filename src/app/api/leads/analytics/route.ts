import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock analytics data
    const mockAnalytics = {
      total_contacts: 45,
      scored_contacts: 32,
      qualification_distribution: {
        hot: 8,
        warm: 12,
        cold: 10,
        unqualified: 2
      },
      average_score: 67.5
    };

    return NextResponse.json(mockAnalytics);
  } catch (error) {
    console.error('Lead analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
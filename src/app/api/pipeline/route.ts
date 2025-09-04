import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data for now - replace with actual pipeline service integration
    const mockPipelines = [
      {
        id: '1',
        name: 'Sales Pipeline',
        description: 'Main sales process',
        color: '#3B82F6',
        stages: [
          { id: '1', name: 'Lead', probability: 10, color: '#EF4444', sort_order: 1 },
          { id: '2', name: 'Qualified', probability: 25, color: '#F59E0B', sort_order: 2 },
          { id: '3', name: 'Proposal', probability: 50, color: '#10B981', sort_order: 3 },
          { id: '4', name: 'Negotiation', probability: 75, color: '#8B5CF6', sort_order: 4 },
          { id: '5', name: 'Closed Won', probability: 100, color: '#059669', sort_order: 5 }
        ],
        opportunities_count: 12,
        total_value: 125000,
        weighted_value: 87500,
        is_active: true
      }
    ];

    return NextResponse.json({ pipelines: mockPipelines });
  } catch (error) {
    console.error('Pipeline API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
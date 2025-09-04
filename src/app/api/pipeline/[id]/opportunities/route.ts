import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Mock opportunities data
    const mockOpportunities = [
      {
        id: '1',
        title: 'Enterprise Software License',
        value: 50000,
        probability: 75,
        stage_id: '3',
        contact_id: '1',
        assigned_to: session.user.id,
        status: 'active' as const,
        created_at: '2024-12-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@techcorp.com',
          company: 'Tech Corp'
        }
      },
      {
        id: '2',
        title: 'Consulting Services',
        value: 25000,
        probability: 50,
        stage_id: '2',
        contact_id: '2',
        status: 'active' as const,
        created_at: '2024-12-15T10:00:00Z',
        updated_at: '2025-01-02T10:00:00Z',
        contact: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@business.com',
          company: 'Business Inc'
        }
      }
    ];

    return NextResponse.json({ opportunities: mockOpportunities });
  } catch (error) {
    console.error('Pipeline opportunities API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
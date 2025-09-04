import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data for now - replace with actual lead scoring service integration
    const mockScoredContacts = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        company: 'Tech Corp',
        phone: '+1234567890',
        lastContact: '2025-01-01T10:00:00Z',
        personalityType: 'analytical',
        lead_score: {
          id: '1',
          contact_id: '1',
          overall_score: 85,
          demographic_score: 20,
          behavioral_score: 12,
          engagement_score: 18,
          company_score: 15,
          email_interaction_score: 10,
          recency_score: 10,
          qualification_status: 'hot' as const,
          updated_at: '2025-01-01T10:00:00Z'
        }
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@business.com',
        company: 'Business Inc',
        lead_score: {
          id: '2',
          contact_id: '2',
          overall_score: 65,
          demographic_score: 18,
          behavioral_score: 10,
          engagement_score: 15,
          company_score: 12,
          email_interaction_score: 5,
          recency_score: 5,
          qualification_status: 'warm' as const,
          updated_at: '2025-01-01T09:00:00Z'
        }
      }
    ];

    return NextResponse.json({ contacts: mockScoredContacts });
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
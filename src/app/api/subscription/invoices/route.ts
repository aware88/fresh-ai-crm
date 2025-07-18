import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/subscription/invoices
 * Returns invoices for an organization or individual user
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organizationId or userId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');

    if (!organizationId && !userId) {
      return NextResponse.json({ error: 'Organization ID or User ID is required' }, { status: 400 });
    }

    // Verify user has access to this organization or is the user themselves
    if (organizationId) {
      // Check if user has access to this organization
      // In a real implementation, you would verify the user's access to this organization
    } else if (userId && userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - cannot access another user\'s invoices' }, { status: 403 });
    }

    if (organizationId) {
      // Get organization invoices
      const subscriptionService = new SubscriptionService();
      const { data: invoices, error } = await subscriptionService.getOrganizationInvoices(organizationId);

      if (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
          { error: 'Failed to fetch invoices' },
          { status: 500 }
        );
      }

      return NextResponse.json({ invoices });
    } else if (userId) {
      // Individual users on free beta plans have no invoices
      return NextResponse.json({ invoices: [] });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error in invoices API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

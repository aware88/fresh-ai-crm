import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/subscription/plans
 * Returns all available subscription plans
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionService = new SubscriptionService();
    const { data: plans, error } = await subscriptionService.getSubscriptionPlans();

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error in subscription plans API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

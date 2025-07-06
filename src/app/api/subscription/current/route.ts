import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/subscription/current
 * Returns the current subscription plan for an organization
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organizationId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has access to this organization
    // In a real implementation, you would verify the user's access to this organization

    const subscriptionService = new SubscriptionService();
    
    // Get the current subscription plan
    const { data: plan, error: planError } = await subscriptionService.getOrganizationSubscriptionPlan(organizationId);

    if (planError) {
      console.error('Error fetching current subscription plan:', planError);
      return NextResponse.json(
        { error: 'Failed to fetch current subscription plan' },
        { status: 500 }
      );
    }
    
    // Get the current subscription details
    const { data: subscription, error: subscriptionError } = await subscriptionService.getOrganizationSubscription(organizationId);
    
    if (subscriptionError) {
      console.error('Error fetching current subscription details:', subscriptionError);
      // Don't fail the request if we can't get subscription details
      // Just return the plan without subscription details
      return NextResponse.json({ plan, subscription: null });
    }

    return NextResponse.json({ plan, subscription });
  } catch (error) {
    console.error('Error in current subscription API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

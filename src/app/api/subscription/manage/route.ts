import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/subscription/manage
 * Change or update a subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, planId, action } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has access to this organization
    // In a real implementation, you would verify the user's access to this organization

    const subscriptionService = new SubscriptionService();

    // Handle different subscription actions
    switch (action) {
      case 'create': {
        if (!planId) {
          return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        // Check if organization already has a subscription
        const { data: existingSubscription } = await subscriptionService.getOrganizationSubscription(organizationId);

        if (existingSubscription) {
          return NextResponse.json(
            { error: 'Organization already has an active subscription' },
            { status: 400 }
          );
        }

        // Create a new subscription
        const { data: subscription, error } = await subscriptionService.createSubscription(
          organizationId,
          planId,
          'trialing', // Start with a trial
          new Date(),
          new Date(new Date().setDate(new Date().getDate() + 14)) // 14-day trial
        );

        if (error) {
          console.error('Error creating subscription:', error);
          return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
          );
        }

        return NextResponse.json({ subscription });
      }

      case 'update': {
        if (!planId) {
          return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        // Get the current subscription
        const { data: currentSubscription, error: getError } = await subscriptionService.getOrganizationSubscription(organizationId);

        if (getError || !currentSubscription) {
          return NextResponse.json(
            { error: 'No active subscription found' },
            { status: 404 }
          );
        }

        // Update the subscription plan
        const { data: updatedSubscription, error: updateError } = await subscriptionService.updateSubscription(
          currentSubscription.id,
          { subscription_plan_id: planId }
        );

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        return NextResponse.json({ subscription: updatedSubscription });
      }

      case 'cancel': {
        // Get the current subscription
        const { data: currentSubscription, error: getError } = await subscriptionService.getOrganizationSubscription(organizationId);

        if (getError || !currentSubscription) {
          return NextResponse.json(
            { error: 'No active subscription found' },
            { status: 404 }
          );
        }

        // Cancel the subscription
        const { data: canceledSubscription, error: cancelError } = await subscriptionService.cancelSubscription(
          currentSubscription.id
        );

        if (cancelError) {
          console.error('Error canceling subscription:', cancelError);
          return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
          );
        }

        return NextResponse.json({ subscription: canceledSubscription });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be one of: create, update, cancel' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in subscription management API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

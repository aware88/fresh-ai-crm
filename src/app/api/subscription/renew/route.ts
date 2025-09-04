import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabaseClient';
import { NotificationService } from '@/lib/services/notification-service';

/**
 * POST /api/subscription/renew
 * Renews a previously cancelled subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, organizationId } = body;

    if (!subscriptionId || !organizationId) {
      return NextResponse.json(
        { error: 'Subscription ID and Organization ID are required' },
        { status: 400 }
      );
    }

    // Check if user has permission to manage subscriptions for this organization
    const supabase = await createClient();
    const { data: userRole, error: roleError } = await supabase
      .rpc('user_has_role', {
        p_user_id: session.user.id,
        p_role_name: 'organization_admin'
      });

    if (roleError || !userRole) {
      return NextResponse.json(
        { error: 'You do not have permission to manage subscriptions for this organization' },
        { status: 403 }
      );
    }

    // Get the subscription
    const subscriptionService = new SubscriptionService();
    const { data: subscription, error: getError } = await subscriptionService.getSubscriptionById(subscriptionId);

    if (getError || !subscription) {
      console.error('Error getting subscription:', getError);
      return NextResponse.json(
        { error: 'Failed to get subscription' },
        { status: 500 }
      );
    }

    // Check if the subscription belongs to the specified organization
    if (subscription.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Subscription does not belong to this organization' },
        { status: 403 }
      );
    }

    // Check if the subscription is cancelled
    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not cancelled' },
        { status: 400 }
      );
    }

    // Renew the subscription by setting cancel_at_period_end to false
    const { data: updatedSubscription, error } = await subscriptionService.updateSubscription(
      subscriptionId,
      { cancel_at_period_end: false }
    );

    if (error) {
      console.error('Error renewing subscription:', error);
      return NextResponse.json(
        { error: 'Failed to renew subscription' },
        { status: 500 }
      );
    }

    // Get the subscription plan details
    const { data: plan } = await subscriptionService.getSubscriptionPlanById(subscription.subscription_plan_id);

    // Send a notification about the renewal
    const notificationService = new NotificationService();
    await notificationService.createOrganizationNotification(
      organizationId,
      {
        title: 'Subscription Renewed',
        message: `Your ${plan?.name || 'subscription'} has been renewed and will continue after the current billing period.`,
        type: 'subscription_renewal',
        action_url: `/settings/subscription?org=${organizationId}`,
        metadata: {
          subscription_id: subscription.id,
          plan_name: plan?.name,
          plan_id: plan?.id
        }
      }
    );

    return NextResponse.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error('Error in subscription renew API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

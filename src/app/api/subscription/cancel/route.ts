import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabaseClient';
import { NotificationService } from '@/lib/services/notification-service';

/**
 * POST /api/subscription/cancel
 * Cancels a subscription at the end of the current billing period
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
    const supabase = createClient();
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

    // Cancel the subscription
    const subscriptionService = new SubscriptionService();
    const { data: subscription, error } = await subscriptionService.cancelSubscription(subscriptionId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    // Get the subscription plan details
    const { data: plan } = await subscriptionService.getSubscriptionPlanById(subscription.subscription_plan_id);

    // Send a notification about the cancellation
    const notificationService = new NotificationService();
    await notificationService.createOrganizationNotification(
      organizationId,
      {
        title: 'Subscription Cancelled',
        message: `Your ${plan?.name || 'subscription'} has been cancelled and will end on ${new Date(subscription.current_period_end).toLocaleDateString()}.`,
        type: 'subscription_cancelled',
        action_url: `/settings/subscription?org=${organizationId}`,
        metadata: {
          subscription_id: subscription.id,
          plan_name: plan?.name,
          plan_id: plan?.id,
          end_date: subscription.current_period_end
        }
      }
    );

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Error in subscription cancel API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

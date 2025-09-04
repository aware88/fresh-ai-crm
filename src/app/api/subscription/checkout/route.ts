import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/subscription/checkout
 * Creates a new subscription for an organization
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, planId } = body;

    if (!organizationId || !planId) {
      return NextResponse.json(
        { error: 'Organization ID and Plan ID are required' },
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

    // Get the subscription plan details
    const subscriptionService = new SubscriptionService();
    const { data: plan, error: planError } = await subscriptionService.getSubscriptionPlanById(planId);

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    // Create the subscription
    const { data: subscription, error } = await subscriptionService.createSubscription(
      organizationId,
      planId,
      'active', // or 'trialing' if you want to offer a trial
      new Date(),
      new Date(new Date().setMonth(new Date().getMonth() + 1))
    );

    if (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Assign the appropriate role based on the subscription plan
    let roleName = 'subscription_free';
    
    switch (plan.name.toLowerCase()) {
      case 'starter':
        roleName = 'subscription_starter';
        break;
      case 'pro':
        roleName = 'subscription_pro';
        break;
      case 'business':
        roleName = 'subscription_business';
        break;
      case 'enterprise':
        roleName = 'subscription_enterprise';
        break;
    }

    // Assign the role to the organization
    const { error: roleAssignError } = await supabase
      .from('organization_roles')
      .insert({
        organization_id: organizationId,
        role_name: roleName
      });

    if (roleAssignError) {
      console.error('Error assigning role:', roleAssignError);
      // We don't want to fail the whole request if just the role assignment fails
      // The subscription is already created
    }

    // Send a notification about the new subscription
    const notificationService = new NotificationService();
    await notificationService.createOrganizationNotification(
      organizationId,
      {
        title: 'Subscription Created',
        message: `Your subscription to the ${plan.name} plan has been created successfully.`,
        type: 'subscription_created',
        action_url: `/settings/subscription?org=${organizationId}`,
        metadata: {
          subscription_id: subscription.id,
          plan_name: plan.name,
          plan_id: plan.id
        }
      }
    );

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Error in subscription checkout API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Helper imports
import { createClient } from '@/lib/supabaseClient';
import { NotificationService } from '@/lib/services/notification-service';

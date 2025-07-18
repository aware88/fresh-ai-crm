import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/subscription/current
 * Returns the current subscription plan for an organization or individual user
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
      return NextResponse.json({ error: 'Unauthorized - cannot access another user\'s subscription' }, { status: 403 });
    }

    const subscriptionService = new SubscriptionService();
    
    if (organizationId) {
      // Get organization subscription
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
    } else if (userId) {
      // Get individual user subscription
      // For now, we'll treat individual users as having a default subscription
      // In a real implementation, you would have a separate table for individual user subscriptions
      
      // For individual users, return a default Pro plan subscription (free during beta)
      const defaultSubscription = {
        id: `individual-${userId}`,
        organization_id: null,
        user_id: userId,
        subscription_plan_id: 'pro',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        cancel_at_period_end: false,
        payment_method_id: null,
        subscription_provider: 'beta',
        provider_subscription_id: `beta-${userId}`,
        metadata: { beta: true, user_type: 'individual' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get the Pro plan details
      const { data: plans, error: plansError } = await subscriptionService.getSubscriptionPlans();
      const proPlan = plans?.find(p => p.id === 'pro');
      
      if (plansError || !proPlan) {
        console.error('Error fetching subscription plans:', plansError);
        return NextResponse.json(
          { error: 'Failed to fetch subscription plans' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        plan: proPlan, 
        subscription: defaultSubscription 
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error in current subscription API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

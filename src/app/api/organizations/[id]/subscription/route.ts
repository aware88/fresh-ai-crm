import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { EnhancedSubscriptionService } from '@/lib/services/subscription-service-extension';

// GET /api/organizations/[id]/subscription
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    
    // Check if user has access to this organization
    // This would be replaced with your actual authorization logic
    // For now, we'll assume the user has access if they're authenticated
    
    const subscriptionService = new SubscriptionService();
    
    // Get the organization's subscription
    const { data: subscription, error: subscriptionError } = 
      await subscriptionService.getOrganizationSubscription(organizationId);
    
    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }
    
    // If no subscription exists, return empty data
    if (!subscription) {
      return NextResponse.json(
        { subscription: null, plan: null },
        { status: 200 }
      );
    }
    
    // Get the subscription plan
    const { data: plan, error: planError } = 
      await subscriptionService.getSubscriptionPlanById(subscription.subscription_plan_id);
    
    if (planError) {
      console.error('Error fetching subscription plan:', planError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription plan' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { subscription, plan },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in subscription endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/subscription
// Create or update a subscription
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    const body = await request.json();
    const { planId, userCount } = body;
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this organization
    // This would be replaced with your actual authorization logic
    
    const enhancedSubscriptionService = new EnhancedSubscriptionService();
    
    // Check if the organization already has a subscription
    const { data: existingSubscription } = 
      await enhancedSubscriptionService.getOrganizationSubscription(organizationId);
    
    let result;
    
    if (existingSubscription) {
      // Update the existing subscription
      result = await enhancedSubscriptionService.updateSubscription(
        existingSubscription.id,
        { subscription_plan_id: planId }
      );
    } else {
      // Create a new trial subscription
      result = await enhancedSubscriptionService.createTrialSubscription(
        organizationId,
        planId
      );
    }
    
    if (result.error) {
      console.error('Error updating subscription:', result.error);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }
    
    // Get the updated subscription plan
    const { data: plan, error: planError } = 
      await enhancedSubscriptionService.getSubscriptionPlanById(planId);
    
    if (planError) {
      console.error('Error fetching subscription plan:', planError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription plan' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { subscription: result.data, plan },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in subscription endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]/subscription
// Cancel a subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    
    // Check if user has access to this organization and can cancel subscriptions
    // This would be replaced with your actual authorization logic
    
    const subscriptionService = new SubscriptionService();
    
    // Get the organization's subscription
    const { data: subscription, error: subscriptionError } = 
      await subscriptionService.getOrganizationSubscription(organizationId);
    
    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }
    
    // Cancel the subscription
    const { data: canceledSubscription, error: cancelError } = 
      await subscriptionService.cancelSubscription(subscription.id);
    
    if (cancelError) {
      console.error('Error canceling subscription:', cancelError);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { subscription: canceledSubscription },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in subscription endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

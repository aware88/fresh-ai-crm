import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionInitializationService } from '@/lib/services/subscription-initialization';
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
    
    console.log('🔍 Fetching subscription for organization:', organizationId);
    console.log('🌍 Environment:', process.env.NODE_ENV);
    
    const subscriptionInitService = new SubscriptionInitializationService();
    
    // For your development organization, create premium subscription
    if (organizationId === '577485fb-50b4-4bb2-a4c6-54b97e1545ad' && process.env.NODE_ENV === 'development') {
      console.log('🚧 Development mode: Creating premium subscription...');
      
      const result = await subscriptionInitService.createDevelopmentPremiumSubscription(organizationId);
      
      if (result.error) {
        console.error('❌ Development subscription error:', result.error);
        // Fall back to normal flow
      } else if (result.subscription && result.plan) {
        console.log('✅ Development premium subscription created successfully');
        return NextResponse.json(
          { subscription: result.subscription, plan: result.plan },
          { status: 200 }
        );
      }
    }
    
         // Get existing subscription (no automatic creation)
     const result = await subscriptionInitService.getOrganizationSubscription(organizationId);
    
    if (result.error) {
      console.error('❌ Subscription error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    console.log('✅ Successfully retrieved/created subscription');
    
    return NextResponse.json(
      { subscription: result.subscription, plan: result.plan },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('❌ Error in subscription endpoint:', error);
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
    
    const enhancedSubscriptionService = new EnhancedSubscriptionService();
    
    // Get the organization's subscription
    const { data: subscription, error: subscriptionError } = 
      await enhancedSubscriptionService.getOrganizationSubscription(organizationId);
    
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
      await enhancedSubscriptionService.cancelSubscription(subscription.id);
    
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
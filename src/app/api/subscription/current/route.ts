import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

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
      // For individual users, get their subscription plan from user metadata
      
      try {
        // Create Supabase admin client
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // Get user data to check their subscription plan from metadata
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError || !userData.user) {
          console.error('Error fetching user data:', userError);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        // Get the subscription plan from user metadata (default to 'starter' if not set)
        const userSubscriptionPlan = userData.user.user_metadata?.subscription_plan || 'starter';
        
        console.log('Individual user subscription plan from metadata:', userSubscriptionPlan);
        
        // Get all subscription plans and find the one that matches
        const planResult = await subscriptionService.getSubscriptionPlans();
        
        if (planResult.error || !planResult.data) {
          console.error('Error fetching subscription plans:', planResult.error);
          // Fallback to a basic plan structure if we can't fetch from database
          const fallbackPlan = {
            id: 'fallback-plan',
            name: userSubscriptionPlan === 'pro' ? 'Pro' : 'Starter',
            price: userSubscriptionPlan === 'pro' ? 0 : 0, // Free during beta
            billing_interval: 'monthly' as const,
            features: {},
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          return NextResponse.json({
            subscription: null,
            plan: fallbackPlan,
            isActive: true
          });
        }
        
        // Find the plan by name (case-insensitive)
        const userPlan = planResult.data.find(p => 
          p.name.toLowerCase() === userSubscriptionPlan.toLowerCase()
        );
        
        if (!userPlan) {
          console.error(`Plan not found for: ${userSubscriptionPlan}`);
          // Fallback to Starter plan if specified plan doesn't exist
          const starterPlan = planResult.data.find(p => p.name.toLowerCase() === 'starter');
          if (!starterPlan) {
            return NextResponse.json({ error: 'No valid subscription plans found' }, { status: 500 });
          }
          
          // Create default subscription for Starter plan
          const defaultSubscription = {
            id: `individual-${userId}`,
            organization_id: null,
            user_id: userId,
            subscription_plan_id: starterPlan.id,
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
          
          return NextResponse.json({ 
            plan: starterPlan, 
            subscription: defaultSubscription 
          });
        }
        
        // Create subscription object for the user's plan
        const userSubscription = {
          id: `individual-${userId}`,
          organization_id: null,
          user_id: userId,
          subscription_plan_id: userPlan.id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          cancel_at_period_end: false,
          payment_method_id: null,
          subscription_provider: 'beta',
          provider_subscription_id: `beta-${userId}`,
          metadata: { 
            beta: true, 
            user_type: 'individual',
            plan_name: userPlan.name.toLowerCase()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Returning subscription for individual user:', {
          planName: userPlan.name,
          planId: userPlan.id,
          userId: userId
        });

        return NextResponse.json({ 
          plan: userPlan, 
          subscription: userSubscription 
        });
        
      } catch (error) {
        console.error('Error processing individual user subscription:', error);
        return NextResponse.json({ error: 'Failed to process user subscription' }, { status: 500 });
      }
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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { addMonths, addYears } from 'date-fns';
import { subscriptionPlans } from '@/lib/subscription-plans-v2';

// Handle individual user plan changes via user metadata
async function handleIndividualUserPlanChange(userId: string, planId: string, billingCycle: string) {
  try {
    console.log('🔄 Updating individual user plan:', { userId, planId, billingCycle });

    // Validate the plan exists
    const newPlan = subscriptionPlans.find(p => p.id === planId);
    if (!newPlan) {
      return NextResponse.json({ 
        error: `Plan not found: ${planId}` 
      }, { status: 404 });
    }

    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get current user data
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      console.error('❌ Error fetching user data:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user metadata with new plan
    const updatedMetadata = {
      ...userData.user.user_metadata,
      subscription_plan: planId,
      billing_cycle: billingCycle,
      plan_change_date: new Date().toISOString()
    };

    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: updatedMetadata }
    );

    if (updateError) {
      console.error('❌ Error updating user metadata:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update user subscription' 
      }, { status: 500 });
    }

    console.log('✅ Successfully updated user plan to:', planId);

    // Return success response with updated plan info
    return NextResponse.json({ 
      success: true,
      plan: {
        id: newPlan.id,
        name: newPlan.name,
        description: newPlan.description,
        price: billingCycle === 'yearly' ? newPlan.yearlyPrice : newPlan.monthlyPrice,
        billing_interval: billingCycle,
        features: newPlan.features,
        user_limit: newPlan.userLimit
      },
      subscription: {
        id: `individual-${userId}`,
        user_id: userId,
        subscription_plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in handleIndividualUserPlanChange:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, planId, billingCycle, subscriptionId } = await request.json();

    console.log('🔄 Change plan request:', { organizationId, planId, billingCycle, subscriptionId, userId: session.user.id });

    if (!planId || !billingCycle) {
      return NextResponse.json({ 
        error: 'Missing required fields: planId and billingCycle are required' 
      }, { status: 400 });
    }

    // Check if this is an individual user subscription (no organizationId or subscriptionId matches user pattern)
    const isIndividualUser = !organizationId || subscriptionId?.startsWith('individual-');
    
    console.log('🔍 Subscription type:', isIndividualUser ? 'Individual User' : 'Organization');

    if (isIndividualUser) {
      // Handle individual user subscription change via user metadata
      return handleIndividualUserPlanChange(session.user.id, planId, billingCycle);
    }

    // Handle organization subscription change via database
    const supabase = createClientComponentClient();

    // Get the current subscription
    const { data: currentSubscription, error: currentError } = await supabase
      .from('organization_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('id', subscriptionId)
      .eq('organization_id', organizationId)
      .single();

    if (currentError || !currentSubscription) {
      return NextResponse.json({ 
        error: 'Subscription not found' 
      }, { status: 404 });
    }

    // Get the new plan
    const { data: newPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !newPlan) {
      return NextResponse.json({ 
        error: 'Plan not found' 
      }, { status: 404 });
    }

    // Calculate new billing period
    const currentPeriodStart = new Date();
    let currentPeriodEnd: Date;
    
    if (billingCycle === 'yearly') {
      currentPeriodEnd = addYears(currentPeriodStart, 1);
    } else {
      currentPeriodEnd = addMonths(currentPeriodStart, 1);
    }

    // Calculate proration amount (simplified - in production, use proper proration logic)
    const currentPlan = currentSubscription.subscription_plans;
    const daysRemaining = Math.max(0, Math.ceil((new Date(currentSubscription.current_period_end).getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)));
    const daysInCurrentPeriod = Math.ceil((new Date(currentSubscription.current_period_end).getTime() - new Date(currentSubscription.current_period_start).getTime()) / (1000 * 60 * 60 * 24));
    
    const prorationCredit = currentPlan ? (currentPlan.price * daysRemaining) / daysInCurrentPeriod : 0;
    const newPlanCost = newPlan.price;
    const netAmount = newPlanCost - prorationCredit;

    // Update the subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({
        subscription_plan_id: planId,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...currentSubscription.metadata,
          billing_cycle: billingCycle,
          proration_credit: prorationCredit,
          net_amount: netAmount,
          plan_change_date: currentPeriodStart.toISOString()
        }
      })
      .eq('id', subscriptionId)
      .select('*, subscription_plans(*)')
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update subscription' 
      }, { status: 500 });
    }

    // Create an invoice for the plan change (if there's a net amount)
    if (netAmount > 0) {
      const { error: invoiceError } = await supabase
        .from('subscription_invoices')
        .insert({
          organization_id: organizationId,
          subscription_id: subscriptionId,
          amount: netAmount,
          status: 'paid', // Assuming immediate payment for plan changes
          due_date: currentPeriodStart.toISOString(),
          paid_at: currentPeriodStart.toISOString(),
          metadata: {
            type: 'plan_change',
            old_plan_id: currentSubscription.subscription_plan_id,
            new_plan_id: planId,
            proration_credit: prorationCredit
          }
        });

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        // Don't fail the entire operation for invoice creation errors
      }
    }

    return NextResponse.json({ 
      success: true, 
      subscription: updatedSubscription,
      proration: {
        credit: prorationCredit,
        net_amount: netAmount
      }
    });

  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 
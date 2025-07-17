import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { addMonths, addYears } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, planId, billingCycle, subscriptionId } = await request.json();

    if (!organizationId || !planId || !billingCycle || !subscriptionId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

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
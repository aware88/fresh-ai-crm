import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, subscriptionId } = await request.json();

    if (!organizationId || !subscriptionId) {
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

    // Check if already cancelled
    if (currentSubscription.cancel_at_period_end) {
      return NextResponse.json({ 
        error: 'Subscription is already set to cancel at period end' 
      }, { status: 400 });
    }

    // Update the subscription to cancel at period end
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
        metadata: {
          ...currentSubscription.metadata,
          cancellation_date: new Date().toISOString(),
          cancellation_reason: 'user_requested'
        }
      })
      .eq('id', subscriptionId)
      .select('*, subscription_plans(*)')
      .single();

    if (updateError) {
      console.error('Error cancelling subscription:', updateError);
      return NextResponse.json({ 
        error: 'Failed to cancel subscription' 
      }, { status: 500 });
    }

    // Create a cancellation record for tracking
    const { error: logError } = await supabase
      .from('subscription_invoices')
      .insert({
        organization_id: organizationId,
        subscription_id: subscriptionId,
        amount: 0,
        status: 'void',
        due_date: new Date().toISOString(),
        metadata: {
          type: 'cancellation',
          cancellation_date: new Date().toISOString(),
          access_until: currentSubscription.current_period_end
        }
      });

    if (logError) {
      console.error('Error creating cancellation log:', logError);
      // Don't fail the entire operation for logging errors
    }

    return NextResponse.json({ 
      success: true, 
      subscription: updatedSubscription,
      message: 'Subscription will be cancelled at the end of the current billing period'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

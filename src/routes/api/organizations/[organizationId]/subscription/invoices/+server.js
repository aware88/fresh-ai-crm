/**
 * Subscription Invoices API Endpoint
 * 
 * Endpoint for retrieving an organization's billing history
 */

import { json } from '@sveltejs/kit';
import { createServerClient } from '@supabase/auth-helpers-sveltekit';
import Stripe from 'stripe';

/**
 * GET handler for retrieving an organization's billing history
 */
export async function GET({ params, request, locals, cookies }) {
  const { organizationId } = params;
  
  try {
    // Initialize Supabase client
    const supabase = createServerClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { cookies }
    );
    
    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', locals.user.id)
      .single();
    
    if (membershipError || !membership) {
      return json({ error: 'Unauthorized access to organization' }, { status: 403 });
    }
    
    // Get the organization's subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('organization_subscriptions')
      .select('provider_subscription_id, subscription_provider')
      .eq('organization_id', organizationId)
      .single();
    
    if (subscriptionError || !subscription) {
      return json({ invoices: [] }, { status: 200 });
    }
    
    // If subscription provider is Stripe, fetch invoices from Stripe API
    if (subscription.subscription_provider === 'stripe' && subscription.provider_subscription_id) {
      const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY);
      
      const stripeInvoices = await stripe.invoices.list({
        subscription: subscription.provider_subscription_id,
        limit: 24, // Last 24 invoices should be enough
      });
      
      // Transform Stripe invoices to our format
      const invoices = stripeInvoices.data.map(invoice => ({
        id: invoice.id,
        created: new Date(invoice.created * 1000).toISOString(),
        due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        amount_remaining: invoice.amount_remaining,
        status: invoice.status,
        description: invoice.description,
        number: invoice.number,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
      }));
      
      return json({ invoices }, { status: 200 });
    }
    
    // If not Stripe or no provider ID, return empty array
    return json({ invoices: [] }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return json({ error: 'Failed to fetch billing history' }, { status: 500 });
  }
}

/**
 * API routes for Stripe checkout
 */

import { json } from '@sveltejs/kit';
import { StripeService } from '$lib/services/stripe-service';

/**
 * POST /api/organizations/:organizationId/subscription/checkout
 * Create a Stripe checkout session for subscription
 */
export async function POST({ request, params, locals }) {
  try {
    // Ensure user is authenticated
    const session = locals.session;
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = params;
    
    // Check if user is an admin of this organization
    const { data: membership } = await locals.supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();
      
    if (!membership) {
      return json({ error: 'Only organization admins can manage subscriptions' }, { status: 403 });
    }

    const { priceId } = await request.json();
    
    if (!priceId) {
      return json({ error: 'Stripe price ID is required' }, { status: 400 });
    }
    
    // Get organization details
    const { data: organization } = await locals.supabase
      .from('organizations')
      .select('name, stripe_customer_id')
      .eq('id', organizationId)
      .single();
      
    if (!organization) {
      return json({ error: 'Organization not found' }, { status: 404 });
    }
    
    // Get or create a Stripe customer
    let customerId = organization.stripe_customer_id;
    
    if (!customerId) {
      const customer = await StripeService.createCustomer(
        organizationId,
        session.user.email,
        organization.name
      );
      customerId = customer.id;
    }
    
    // Create a checkout session
    const checkoutSession = await StripeService.createCheckoutSession(
      organizationId,
      priceId,
      customerId
    );
    
    return json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error(`Error creating checkout session:`, error);
    return json({ error: error.message }, { status: 500 });
  }
}

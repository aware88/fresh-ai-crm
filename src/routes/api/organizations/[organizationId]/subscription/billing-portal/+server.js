/**
 * API routes for Stripe billing portal
 */

import { json } from '@sveltejs/kit';
import { StripeService } from '$lib/services/stripe-service';

/**
 * POST /api/organizations/:organizationId/subscription/billing-portal
 * Create a Stripe billing portal session for subscription management
 */
export async function POST({ params, locals }) {
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
    
    // Get organization details
    const { data: organization } = await locals.supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', organizationId)
      .single();
      
    if (!organization) {
      return json({ error: 'Organization not found' }, { status: 404 });
    }
    
    if (!organization.stripe_customer_id) {
      return json({ error: 'No active subscription found' }, { status: 400 });
    }
    
    // Create a billing portal session
    const portalSession = await StripeService.createBillingPortalSession(
      organization.stripe_customer_id
    );
    
    return json({ url: portalSession.url });
  } catch (error) {
    console.error(`Error creating billing portal session:`, error);
    return json({ error: error.message }, { status: 500 });
  }
}

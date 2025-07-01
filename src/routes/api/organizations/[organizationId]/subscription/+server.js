/**
 * API routes for organization subscription management
 */

import { json } from '@sveltejs/kit';
import { SubscriptionService } from '$lib/services/subscription-service';

/**
 * GET /api/organizations/:organizationId/subscription
 * Get an organization's current subscription
 */
export async function GET({ params, locals }) {
  try {
    // Ensure user is authenticated
    const session = locals.session;
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = params;
    
    // Check if user belongs to this organization
    const { data: membership } = await locals.supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .single();
      
    if (!membership) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const subscription = await SubscriptionService.getOrganizationSubscription(organizationId);
    return json({ subscription });
  } catch (error) {
    console.error(`Error in GET /api/organizations/:organizationId/subscription:`, error);
    return json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/organizations/:organizationId/subscription
 * Create or update an organization's subscription
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

    const { subscriptionPlanId } = await request.json();
    
    if (!subscriptionPlanId) {
      return json({ error: 'Subscription plan ID is required' }, { status: 400 });
    }

    const subscription = await SubscriptionService.createOrUpdateSubscription(
      organizationId, 
      subscriptionPlanId
    );
    
    return json({ subscription });
  } catch (error) {
    console.error(`Error in POST /api/organizations/:organizationId/subscription:`, error);
    return json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/organizations/:organizationId/subscription
 * Cancel an organization's subscription
 */
export async function DELETE({ request, params, locals }) {
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

    const requestData = await request.json();
    const immediateCancel = requestData?.immediateCancel || false;

    const subscription = await SubscriptionService.cancelSubscription(
      organizationId, 
      immediateCancel
    );
    
    return json({ subscription });
  } catch (error) {
    console.error(`Error in DELETE /api/organizations/:organizationId/subscription:`, error);
    return json({ error: error.message }, { status: 500 });
  }
}

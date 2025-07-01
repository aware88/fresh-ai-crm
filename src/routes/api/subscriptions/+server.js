/**
 * API routes for subscription management
 */

import { json } from '@sveltejs/kit';
import { SubscriptionService } from '$lib/services/subscription-service';

/**
 * GET /api/subscriptions
 * Get all available subscription plans
 */
export async function GET({ request, locals }) {
  try {
    // Ensure user is authenticated
    const session = locals.session;
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await SubscriptionService.getSubscriptionPlans();
    return json({ plans });
  } catch (error) {
    console.error('Error in GET /api/subscriptions:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

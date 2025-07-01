/**
 * API route for checking feature access
 */

import { json } from '@sveltejs/kit';
import { SubscriptionService } from '$lib/services/subscription-service';

/**
 * GET /api/organizations/:organizationId/subscription/features/:featureName
 * Check if an organization has access to a specific feature
 */
export async function GET({ params, locals }) {
  try {
    // Ensure user is authenticated
    const session = locals.session;
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, featureName } = params;
    
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

    const hasAccess = await SubscriptionService.hasFeatureAccess(organizationId, featureName);
    return json({ hasAccess });
  } catch (error) {
    console.error(`Error in GET /api/organizations/:organizationId/subscription/features/:featureName:`, error);
    return json({ error: error.message }, { status: 500 });
  }
}

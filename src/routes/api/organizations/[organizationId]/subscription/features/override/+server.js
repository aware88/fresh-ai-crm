/**
 * Feature Flag Override API Endpoint
 * 
 * Endpoint for overriding feature access for an organization
 */

import { json } from '@sveltejs/kit';
import { createServerClient } from '@supabase/auth-helpers-sveltekit';

/**
 * POST handler for overriding feature access
 */
export async function POST({ params, request, locals, cookies }) {
  const { organizationId } = params;
  
  try {
    // Initialize Supabase client
    const supabase = createServerClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { cookies }
    );
    
    // Check if user is an admin for this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', locals.user.id)
      .single();
    
    if (membershipError || !membership || membership.role !== 'admin') {
      return json({ error: 'Unauthorized. Only organization admins can override features.' }, { status: 403 });
    }
    
    // Get request body
    const { overrides } = await request.json();
    
    if (!overrides || typeof overrides !== 'object') {
      return json({ error: 'Invalid request. Overrides object is required.' }, { status: 400 });
    }
    
    // Get the organization's subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('organization_subscriptions')
      .select('id, metadata')
      .eq('organization_id', organizationId)
      .single();
    
    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
    
    // Create subscription if it doesn't exist
    let subscriptionId;
    let metadata = {};
    
    if (!subscription) {
      // Create a free subscription for this organization
      const { data: newSubscription, error: createError } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: organizationId,
          status: 'active',
          metadata: { feature_overrides: overrides }
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Error creating subscription:', createError);
        return json({ error: 'Failed to create subscription' }, { status: 500 });
      }
      
      subscriptionId = newSubscription.id;
    } else {
      subscriptionId = subscription.id;
      metadata = subscription.metadata || {};
      
      // Update the feature overrides in the metadata
      metadata.feature_overrides = {
        ...metadata.feature_overrides,
        ...overrides
      };
      
      // Remove any overrides that are set to undefined
      Object.keys(metadata.feature_overrides).forEach(key => {
        if (metadata.feature_overrides[key] === undefined) {
          delete metadata.feature_overrides[key];
        }
      });
    }
    
    // Update the subscription with the new metadata
    const { error: updateError } = await supabase
      .from('organization_subscriptions')
      .update({ metadata })
      .eq('id', subscriptionId);
    
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return json({ error: 'Failed to update feature overrides' }, { status: 500 });
    }
    
    return json({ success: true, overrides: metadata.feature_overrides });
    
  } catch (error) {
    console.error('Error overriding features:', error);
    return json({ error: 'Failed to override features' }, { status: 500 });
  }
}

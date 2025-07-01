import { supabase } from '$lib/supabaseClient';

/**
 * Get all subscription plans
 * @returns {Promise<Array>} Array of subscription plans
 */
export async function getSubscriptionPlans() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });
  
  if (error) {
    console.error('Error fetching subscription plans:', error);
    throw new Error('Failed to fetch subscription plans');
  }
  
  return data;
}

/**
 * Create a new subscription plan
 * @param {Object} planData - The plan data
 * @returns {Promise<Object>} The created plan
 */
export async function createSubscriptionPlan(planData) {
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert([
      {
        name: planData.name,
        description: planData.description,
        price: planData.price,
        billing_interval: planData.billing_interval,
        stripe_price_id: planData.stripe_price_id,
        features: planData.features,
        is_active: true
      }
    ])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating subscription plan:', error);
    throw new Error('Failed to create subscription plan');
  }
  
  return data;
}

/**
 * Update an existing subscription plan
 * @param {string} planId - The plan ID to update
 * @param {Object} planData - The updated plan data
 * @returns {Promise<Object>} The updated plan
 */
export async function updateSubscriptionPlan(planId, planData) {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update({
      name: planData.name,
      description: planData.description,
      price: planData.price,
      billing_interval: planData.billing_interval,
      stripe_price_id: planData.stripe_price_id,
      features: planData.features
    })
    .eq('id', planId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating subscription plan:', error);
    throw new Error('Failed to update subscription plan');
  }
  
  return data;
}

/**
 * Delete a subscription plan
 * @param {string} planId - The plan ID to delete
 * @returns {Promise<void>}
 */
export async function deleteSubscriptionPlan(planId) {
  const { error } = await supabase
    .from('subscription_plans')
    .delete()
    .eq('id', planId);
  
  if (error) {
    console.error('Error deleting subscription plan:', error);
    throw new Error('Failed to delete subscription plan');
  }
}

/**
 * Get all organization subscriptions
 * @returns {Promise<Array>} Array of organization subscriptions
 */
export async function getOrganizationSubscriptions() {
  const { data, error } = await supabase
    .from('organization_subscriptions')
    .select(`
      *,
      organization:organizations(*),
      subscription_plan:subscription_plans(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching organization subscriptions:', error);
    throw new Error('Failed to fetch organization subscriptions');
  }
  
  return data;
}

/**
 * Get subscription invoices for an organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Array>} Array of subscription invoices
 */
export async function getSubscriptionInvoices(organizationId) {
  const { data, error } = await supabase
    .from('subscription_invoices')
    .select('*')
    .eq('organization_id', organizationId)
    .order('due_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching subscription invoices:', error);
    throw new Error('Failed to fetch subscription invoices');
  }
  
  return data;
}

/**
 * Update organization subscription status
 * @param {string} subscriptionId - The subscription ID
 * @param {string} status - The new status
 * @returns {Promise<Object>} The updated subscription
 */
export async function updateSubscriptionStatus(subscriptionId, status) {
  const { data, error } = await supabase
    .from('organization_subscriptions')
    .update({ status })
    .eq('id', subscriptionId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating subscription status:', error);
    throw new Error('Failed to update subscription status');
  }
  
  return data;
}

/**
 * Subscription API Client
 * 
 * Client-side functions for interacting with subscription API endpoints
 */

import { fetchWithAuth } from './utils';

/**
 * Get all available subscription plans
 * @returns {Promise<Array>} List of subscription plans
 */
export async function getSubscriptionPlans() {
  const response = await fetchWithAuth('/api/subscriptions');
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch subscription plans');
  }
  
  return data.plans;
}

/**
 * Get an organization's current subscription
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object|null>} Subscription details or null
 */
export async function getOrganizationSubscription(organizationId) {
  const response = await fetchWithAuth(`/api/organizations/${organizationId}/subscription`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch organization subscription');
  }
  
  return data.subscription;
}

/**
 * Create or update an organization's subscription
 * @param {string} organizationId - Organization ID
 * @param {string} subscriptionPlanId - Subscription plan ID
 * @returns {Promise<Object>} Created or updated subscription
 */
export async function createOrUpdateSubscription(organizationId, subscriptionPlanId) {
  const response = await fetchWithAuth(
    `/api/organizations/${organizationId}/subscription`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionPlanId }),
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create/update subscription');
  }
  
  return data.subscription;
}

/**
 * Cancel an organization's subscription
 * @param {string} organizationId - Organization ID
 * @param {boolean} immediateCancel - Whether to cancel immediately or at the end of the period
 * @returns {Promise<Object>} Updated subscription
 */
export async function cancelSubscription(organizationId, immediateCancel = false) {
  const response = await fetchWithAuth(
    `/api/organizations/${organizationId}/subscription`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ immediateCancel }),
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to cancel subscription');
  }
  
  return data.subscription;
}

/**
 * Check if an organization has access to a specific feature
 * @param {string} organizationId - Organization ID
 * @param {string} featureName - Feature name to check
 * @returns {Promise<boolean>} True if the organization has access to the feature
 */
export async function checkFeatureAccess(organizationId, featureName) {
  const response = await fetchWithAuth(
    `/api/organizations/${organizationId}/subscription/features/${featureName}`
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    // Default to false on error
    console.error(`Error checking feature access: ${data.error}`);
    return false;
  }
  
  return data.hasAccess;
}

/**
 * Get billing history for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array>} List of invoices
 */
export async function getBillingHistory(organizationId) {
  const response = await fetchWithAuth(`/api/organizations/${organizationId}/subscription/invoices`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch billing history');
  }
  
  return data.invoices;
}

/**
 * Override feature flags for an organization
 * @param {string} organizationId - Organization ID
 * @param {Object} overrides - Map of feature names to boolean values
 * @returns {Promise<Object>} Updated feature overrides
 */
export async function overrideFeatureFlags(organizationId, overrides) {
  const response = await fetchWithAuth(
    `/api/organizations/${organizationId}/subscription/features/override`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ overrides }),
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to override feature flags');
  }
  
  return data.overrides;
}

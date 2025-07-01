/**
 * Stripe API Client
 * 
 * Client-side functions for interacting with Stripe API endpoints
 */

import { fetchWithAuth } from './utils';

/**
 * Create a checkout session for subscription
 * @param {string} organizationId - Organization ID
 * @param {string} priceId - Stripe price ID
 * @returns {Promise<Object>} Checkout session details
 */
export async function createCheckoutSession(organizationId, priceId) {
  const response = await fetchWithAuth(
    `/api/organizations/${organizationId}/subscription/checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create checkout session');
  }
  
  return data;
}

/**
 * Redirect to Stripe Checkout
 * @param {string} organizationId - Organization ID
 * @param {string} priceId - Stripe price ID
 * @returns {Promise<void>}
 */
export async function redirectToCheckout(organizationId, priceId) {
  try {
    const { url } = await createCheckoutSession(organizationId, priceId);
    
    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}

/**
 * Create a billing portal session and redirect to it
 * @param {string} organizationId - Organization ID
 * @returns {Promise<void>}
 */
export async function redirectToBillingPortal(organizationId) {
  try {
    const response = await fetchWithAuth(
      `/api/organizations/${organizationId}/subscription/billing-portal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create billing portal session');
    }
    
    // Redirect to Stripe Billing Portal
    window.location.href = data.url;
  } catch (error) {
    console.error('Error redirecting to billing portal:', error);
    throw error;
  }
}

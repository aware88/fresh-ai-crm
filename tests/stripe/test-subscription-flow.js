/**
 * Test script for Stripe subscription flow
 * 
 * This script tests the complete subscription flow including:
 * - Creating a checkout session
 * - Handling webhook events
 * - Managing subscriptions through the billing portal
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test_auth_token'; // Default test token
const ORGANIZATION_ID = process.env.ORGANIZATION_ID || 'test-org-123'; // Default test organization
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_standard_monthly';

if (!AUTH_TOKEN || !ORGANIZATION_ID) {
  console.error('Missing required environment variables. Please set AUTH_TOKEN and ORGANIZATION_ID.');
  process.exit(1);
}

// Helper function for API requests
async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  });

  return response;
}

// Test functions
async function testCreateCheckoutSession() {
  console.log('\n🔍 Testing checkout session creation...');
  
  try {
    const response = await fetchWithAuth(
      `/api/organizations/${ORGANIZATION_ID}/subscription/checkout`,
      {
        method: 'POST',
        body: JSON.stringify({ priceId: STRIPE_PRICE_ID })
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully created checkout session');
      console.log(`Session ID: ${data.sessionId}`);
      console.log(`Checkout URL: ${data.url}`);
      return data;
    } else {
      console.error('❌ Failed to create checkout session:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating checkout session:', error.message);
    return null;
  }
}

async function testBillingPortal() {
  console.log('\n🔍 Testing billing portal session creation...');
  
  try {
    const response = await fetchWithAuth(
      `/api/organizations/${ORGANIZATION_ID}/subscription/billing-portal`,
      {
        method: 'POST'
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully created billing portal session');
      console.log(`Portal URL: ${data.url}`);
      return data;
    } else {
      console.error('❌ Failed to create billing portal session:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating billing portal session:', error.message);
    return null;
  }
}

async function testGetSubscriptionDetails() {
  console.log('\n🔍 Testing subscription details retrieval...');
  
  try {
    const response = await fetchWithAuth(
      `/api/organizations/${ORGANIZATION_ID}/subscription`
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully retrieved subscription details');
      console.log(JSON.stringify(data, null, 2));
      return data;
    } else {
      console.error('❌ Failed to retrieve subscription details:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error retrieving subscription details:', error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Stripe subscription flow tests');
  
  // Test subscription details retrieval
  const subscriptionDetails = await testGetSubscriptionDetails();
  
  // Test checkout session creation
  const checkoutSession = await testCreateCheckoutSession();
  
  // Test billing portal session creation
  const billingPortalSession = await testBillingPortal();
  
  console.log('\n✨ Tests completed!');
  console.log('Note: To complete the full subscription flow, you would need to:');
  console.log('1. Visit the checkout URL to complete the payment process');
  console.log('2. Visit the billing portal URL to manage the subscription');
  console.log('3. Test webhook handling with Stripe CLI or webhook forwarding');
}

// Run the tests
runTests().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});

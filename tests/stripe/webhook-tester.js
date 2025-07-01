/**
 * Stripe Webhook Tester
 * 
 * This utility helps test Stripe webhook handlers by simulating webhook events
 * without needing to use the Stripe CLI or actual Stripe events.
 */

const fetch = require('node-fetch');
const crypto = require('crypto');
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const WEBHOOK_ENDPOINT = '/api/webhooks/stripe';

if (!WEBHOOK_SECRET) {
  console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  process.exit(1);
}

// Sample event templates
const eventTemplates = {
  'checkout.session.completed': {
    id: 'evt_checkout_completed_test',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_123456789',
        object: 'checkout.session',
        customer: 'cus_test_123456789',
        subscription: 'sub_test_123456789',
        client_reference_id: '', // Will be set to organization ID
        metadata: {}
      }
    },
    type: 'checkout.session.completed'
  },
  'customer.subscription.created': {
    id: 'evt_subscription_created_test',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_test_123456789',
        object: 'subscription',
        customer: 'cus_test_123456789',
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_standard_monthly',
              product: 'prod_standard'
            }
          }]
        },
        metadata: {}
      }
    },
    type: 'customer.subscription.created'
  },
  'customer.subscription.updated': {
    id: 'evt_subscription_updated_test',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_test_123456789',
        object: 'subscription',
        customer: 'cus_test_123456789',
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_premium_monthly',
              product: 'prod_premium'
            }
          }]
        },
        metadata: {}
      }
    },
    type: 'customer.subscription.updated'
  },
  'customer.subscription.deleted': {
    id: 'evt_subscription_deleted_test',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'sub_test_123456789',
        object: 'subscription',
        customer: 'cus_test_123456789',
        status: 'canceled',
        cancel_at_period_end: false,
        canceled_at: Math.floor(Date.now() / 1000),
        metadata: {}
      }
    },
    type: 'customer.subscription.deleted'
  },
  'invoice.payment_succeeded': {
    id: 'evt_invoice_payment_succeeded_test',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'in_test_123456789',
        object: 'invoice',
        customer: 'cus_test_123456789',
        subscription: 'sub_test_123456789',
        status: 'paid',
        total: 1999,
        currency: 'usd',
        metadata: {}
      }
    },
    type: 'invoice.payment_succeeded'
  },
  'invoice.payment_failed': {
    id: 'evt_invoice_payment_failed_test',
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'in_test_123456789',
        object: 'invoice',
        customer: 'cus_test_123456789',
        subscription: 'sub_test_123456789',
        status: 'open',
        total: 1999,
        currency: 'usd',
        metadata: {}
      }
    },
    type: 'invoice.payment_failed'
  }
};

// Generate Stripe webhook signature
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Send webhook event
async function sendWebhookEvent(eventType, organizationId = null, customerId = null) {
  // Get event template
  if (!eventTemplates[eventType]) {
    console.error(`Unknown event type: ${eventType}`);
    return false;
  }
  
  // Clone the template
  const event = JSON.parse(JSON.stringify(eventTemplates[eventType]));
  
  // Set organization ID if provided
  if (organizationId) {
    if (event.data.object.client_reference_id !== undefined) {
      event.data.object.client_reference_id = organizationId;
    }
    
    if (event.data.object.metadata) {
      event.data.object.metadata.organization_id = organizationId;
    }
  }
  
  // Set customer ID if provided
  if (customerId && event.data.object.customer) {
    event.data.object.customer = customerId;
  }
  
  // Convert event to string
  const payload = JSON.stringify(event);
  
  // Generate signature
  const signature = generateStripeSignature(payload, WEBHOOK_SECRET);
  
  try {
    // Send webhook request
    const response = await fetch(`${API_URL}${WEBHOOK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });
    
    const responseText = await response.text();
    
    console.log(`Event: ${eventType}`);
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${responseText}`);
    console.log('-'.repeat(50));
    
    return response.ok;
  } catch (error) {
    console.error(`Error sending webhook event: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const eventType = args[0];
  const organizationId = args[1];
  const customerId = args[2];
  
  if (!eventType) {
    console.log('Available event types:');
    Object.keys(eventTemplates).forEach(type => console.log(`- ${type}`));
    console.log('\nUsage: node webhook-tester.js <event-type> [organization-id] [customer-id]');
    process.exit(0);
  }
  
  console.log(`🚀 Sending test webhook event: ${eventType}`);
  if (organizationId) console.log(`Organization ID: ${organizationId}`);
  if (customerId) console.log(`Customer ID: ${customerId}`);
  console.log('-'.repeat(50));
  
  await sendWebhookEvent(eventType, organizationId, customerId);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

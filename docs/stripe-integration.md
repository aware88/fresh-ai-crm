# Stripe Integration Documentation

## Overview

This document provides a comprehensive guide to the Stripe integration in Fresh AI CRM for subscription management. The integration allows organizations to subscribe to different plans, manage their subscriptions, and process payments securely through Stripe.

## Architecture

The Stripe integration consists of the following components:

1. **Backend Services**
   - `StripeService`: Core service handling Stripe API interactions
   - Webhook handlers for processing Stripe events
   - API endpoints for checkout and billing portal

2. **Frontend Components**
   - Subscription plan selection
   - Subscription management UI
   - Stripe Checkout integration
   - Billing portal integration

3. **Database Tables**
   - `subscription_plans`: Available subscription plans
   - `organization_subscriptions`: Organization subscription details
   - `subscription_invoices`: Invoice records

## Configuration

### Environment Variables

The following environment variables need to be set for the Stripe integration to work:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BASE_URL=http://localhost:3000
```

### Stripe Product and Price Setup

Before using the integration, you need to set up products and prices in your Stripe dashboard:

1. Create products for each subscription tier (Free, Standard, Premium)
2. Create prices for each product with the following IDs:
   - Free tier: `price_free_monthly`
   - Standard tier: `price_standard_monthly`
   - Premium tier: `price_premium_monthly`

## API Endpoints

### Checkout Session

```
POST /api/organizations/:organizationId/subscription/checkout
```

Creates a Stripe checkout session for subscription purchase or upgrade.

**Request Body:**
```json
{
  "priceId": "price_standard_monthly"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### Billing Portal

```
POST /api/organizations/:organizationId/subscription/billing-portal
```

Creates a Stripe billing portal session for subscription management.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### Webhook Handler

```
POST /api/webhooks/stripe
```

Handles incoming webhook events from Stripe.

## Client-Side API

### Stripe API Module

The `stripe-api.js` module provides the following functions:

- `createCheckoutSession(organizationId, priceId)`: Creates a checkout session
- `redirectToCheckout(organizationId, priceId)`: Redirects to Stripe Checkout
- `redirectToBillingPortal(organizationId)`: Redirects to Stripe Billing Portal

## Webhook Events

The system handles the following Stripe webhook events:

- `checkout.session.completed`: When a checkout is completed
- `customer.subscription.created`: When a subscription is created
- `customer.subscription.updated`: When a subscription is updated
- `customer.subscription.deleted`: When a subscription is canceled
- `invoice.payment_succeeded`: When an invoice payment succeeds
- `invoice.payment_failed`: When an invoice payment fails

## Testing

A test script is provided in `/tests/stripe/test-subscription-flow.js` to validate the integration:

1. Copy `test-subscription-flow.env.sample` to `.env` in the same directory
2. Update the environment variables with your test values
3. Run the test script using the `run-subscription-test.sh` shell script

The test script validates:
- Checkout session creation
- Billing portal session creation
- Subscription details retrieval

## Troubleshooting

### Common Issues

1. **Webhook Verification Failures**
   - Ensure the `STRIPE_WEBHOOK_SECRET` is correctly set
   - Verify the raw body is being passed to the webhook handler

2. **Checkout Session Creation Failures**
   - Check that the price ID exists in your Stripe account
   - Verify the customer ID is correctly associated with the organization

3. **Subscription Not Updating After Payment**
   - Ensure webhooks are properly configured and reaching your application
   - Check for errors in the webhook handler logs

## Security Considerations

1. **API Keys**: Never expose Stripe secret keys in client-side code
2. **Webhook Verification**: Always verify webhook signatures
3. **Access Control**: Only organization admins can manage subscriptions
4. **Data Privacy**: Store only necessary payment metadata, not full payment details

## Future Enhancements

1. **Subscription Usage Metrics**: Track and display usage metrics
2. **Tiered Pricing**: Implement usage-based pricing tiers
3. **Promotional Codes**: Support for discount codes and promotions
4. **Invoice Customization**: Custom invoice templates and branding

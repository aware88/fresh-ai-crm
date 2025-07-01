# Fresh AI CRM Subscription System Documentation

## Overview

This document provides a comprehensive guide to the subscription system in Fresh AI CRM. The subscription system allows organizations to subscribe to different plans, manage their subscriptions, and access features based on their subscription tier.

## Architecture

### Database Schema

The subscription system database schema has been fully implemented with the following tables:

1. **subscription_plans**
   - Stores available subscription plans with pricing and features
   - Fields: id, name, description, price, billing_interval, features (JSONB), is_active

2. **organization_subscriptions**
   - Stores organization subscriptions to plans
   - Fields: id, organization_id, subscription_plan_id, status, current_period_start/end, cancel_at_period_end, payment_method_id, subscription_provider, provider_subscription_id, metadata

3. **subscription_invoices**
   - Stores subscription invoices for billing
   - Fields: id, organization_id, subscription_id, amount, status, due_date, paid_at, invoice_url, invoice_pdf, provider_invoice_id

### Database Functions

Two key database functions have been implemented:

1. **has_active_subscription(org_id UUID)**
   - Checks if an organization has an active subscription
   - Returns a boolean value

2. **has_feature_access(org_id UUID, feature_name TEXT)**
   - Checks if an organization has access to a specific feature based on their subscription
   - Returns a boolean value

### RLS Policies

Row-Level Security (RLS) policies have been implemented for all subscription tables:

1. **subscription_plans**
   - Everyone can view plans
   - Only admins can modify plans

2. **organization_subscriptions**
   - Organization members can view their organization's subscriptions
   - Only organization admins can modify subscriptions

3. **subscription_invoices**
   - Organization members can view invoices
   - Only system processes/admins can modify invoices

## Stripe Integration

The Stripe integration has been fully implemented for payment processing and subscription management:

### Backend Services

1. **StripeService**
   - Core service handling Stripe API interactions
   - Customer management
   - Subscription creation and management
   - Invoice handling

2. **Webhook Handlers**
   - Process Stripe events (subscription created, updated, canceled, etc.)
   - Update local database based on Stripe events
   - Handle payment successes and failures

3. **API Endpoints**
   - Checkout session creation
   - Billing portal session creation
   - Subscription management

### Frontend Components

1. **SubscriptionPlans**
   - Displays available subscription plans
   - Handles plan selection and checkout
   - Integrates with Stripe Checkout

2. **SubscriptionDetails**
   - Shows current subscription details
   - Provides access to Stripe Billing Portal
   - Displays subscription status and renewal information
   - Includes billing history with invoice details

3. **BillingHistory**
   - Displays organization's invoice history
   - Shows invoice date, amount, status, and description
   - Provides links to view/download invoice PDFs
   - Handles loading states and error conditions

## Feature Flag System

The feature flag system allows for controlling access to features based on subscription tier:

1. **Database Implementation**
   - Features are stored in the `features` JSONB column of the `subscription_plans` table
   - Each feature is represented as a key-value pair where the key is the feature name and the value is a boolean

2. **Access Control**
   - The `has_feature_access` database function checks if an organization has access to a specific feature
   - Frontend components can use this function to conditionally render features

## Testing

### Subscription Flow Testing

1. **Test Script**: `/tests/stripe/test-subscription-flow.js`
   - Tests checkout session creation
   - Tests billing portal session creation
   - Tests subscription details retrieval

2. **Test Environment Setup**:
   - Copy `test-subscription-flow.env.sample` to `.env`
   - Configure with valid authentication token and organization ID
   - Set appropriate Stripe price ID

3. **Test Execution**:
   - Run `./run-subscription-test.sh`
   - Verify successful API responses
   - Check subscription details match expected values

### Billing History Testing

1. **Test Script**: `/tests/stripe/test-billing-history.js`
   - Tests billing history retrieval
   - Validates invoice data structure
   - Verifies proper error handling

2. **Test Environment Setup**:
   - Copy `billing-history-test.env.sample` to `.env`
   - Configure with valid authentication token and organization ID

3. **Test Execution**:
   - Run `./run-billing-history-test.sh`
   - Verify successful API responses
   - Check invoice data format and structure

### Webhook Testing

1. **Test Script**: `/tests/stripe/webhook-tester.js`
   - Simulates Stripe webhook events
   - Tests webhook signature verification
   - Tests event handling for various event types

2. **Test Environment Setup**:
   - Same `.env` file as subscription flow testing
   - Ensure `STRIPE_WEBHOOK_SECRET` is properly configured

3. **Test Execution**:
   - Run `./run-webhook-test.sh <event-type> [organization-id] [customer-id]`
   - Available event types:
     - checkout.session.completed
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.payment_succeeded
     - invoice.payment_failed
   - Verify webhook handler responds with 200 OK
   - Check database for expected changes

## Usage

### Creating a Subscription

1. User selects a subscription plan from the available options
2. System creates a Stripe checkout session
3. User is redirected to Stripe Checkout to complete payment
4. Upon successful payment, Stripe sends a webhook event
5. System creates a subscription record in the database

### Managing a Subscription

1. User views their current subscription details
2. User clicks "Manage Billing" to access the Stripe Billing Portal
3. User can upgrade, downgrade, or cancel their subscription through the portal
4. Stripe sends webhook events for subscription changes
5. System updates the subscription record in the database

### Checking Feature Access

```javascript
// Backend example (Node.js)
async function checkFeatureAccess(organizationId, featureName) {
  const { data, error } = await supabase
    .rpc('has_feature_access', {
      org_id: organizationId,
      feature_name: featureName
    });
  
  if (error) throw error;
  return data;
}

// Frontend example (React)
function FeatureGatedComponent({ organizationId, featureName, children }) {
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    async function checkAccess() {
      const access = await checkFeatureAccess(organizationId, featureName);
      setHasAccess(access);
    }
    
    checkAccess();
  }, [organizationId, featureName]);
  
  return hasAccess ? children : null;
}
```

## Next Steps

### User/Admin Settings

1. **Subscription Management UI for Admins**:
   - Create admin dashboard for managing subscription plans
   - Implement CRUD operations for subscription plans
   - Add ability to view all organization subscriptions

2. **User Settings**:
   - Add subscription section to user settings
   - Show current subscription details
   - ✅ Provide access to billing history (implemented)
   - Add payment method management

### Feature Flag System Enhancement

1. **UI for Feature Flag Management**:
   - Create UI for viewing available features by plan
   - Implement feature flag checks in UI components

2. **Feature Access API**:
   - Create API endpoints to check feature access
   - Implement middleware for protecting feature-gated routes

### Subscription Analytics

1. **Dashboard for Subscription Metrics**:
   - Track subscription conversion rates
   - Monitor subscription revenue
   - Analyze plan popularity

2. **Reporting**:
   - Generate subscription reports
   - Export billing data

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

### Debugging

1. **Stripe Dashboard**
   - Use the Stripe Dashboard to view events, customers, and subscriptions
   - Check webhook delivery status and response codes

2. **Webhook Tester**
   - Use the webhook tester script to simulate events and debug handlers
   - Check the response from the webhook handler

3. **Database Inspection**
   - Query the subscription tables directly to check their state
   - Verify that RLS policies are working as expected

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Billing Portal Documentation](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)

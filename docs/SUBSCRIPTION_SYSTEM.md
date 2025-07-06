# CRM Mind Subscription System

This document provides an overview of the subscription system implementation for CRM Mind.

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Service Architecture](#service-architecture)
4. [Feature Flag System](#feature-flag-system)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Subscription Analytics](#subscription-analytics)
8. [Notification System](#notification-system)
9. [Integration Guide](#integration-guide)

## System Overview

The subscription system enables organizations to subscribe to different service tiers, each with specific features and usage limits. The system handles subscription lifecycle management, invoicing, and feature access control.

### Key Components

- **Subscription Plans**: Defines available tiers with pricing and features
- **Organization Subscriptions**: Links organizations to subscription plans
- **Subscription Invoices**: Manages billing and payment records
- **Feature Flags**: Controls access to features based on subscription tier
- **Usage Limits**: Enforces limits on resource usage based on subscription tier

## Database Schema

The subscription system uses the following tables:

### subscription_plans

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Plan name (e.g., "Free", "Pro", "Enterprise") |
| description | text | Plan description |
| price | numeric | Monthly price in USD |
| billing_interval | text | 'monthly' or 'yearly' |
| features | jsonb | JSON object of features and limits |
| is_active | boolean | Whether the plan is currently available |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### organization_subscriptions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | Foreign key to organizations table |
| subscription_plan_id | uuid | Foreign key to subscription_plans table |
| status | text | 'active', 'canceled', 'past_due', 'trialing', 'incomplete' |
| current_period_start | timestamp | Start of current billing period |
| current_period_end | timestamp | End of current billing period |
| cancel_at_period_end | boolean | Whether subscription will cancel at period end |
| payment_method_id | text | Optional payment method reference |
| provider_subscription_id | text | Optional external provider reference (e.g., Stripe) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### subscription_invoices

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | Foreign key to organizations table |
| subscription_id | uuid | Foreign key to organization_subscriptions table |
| amount | numeric | Invoice amount in USD |
| status | text | 'paid', 'unpaid', 'void' |
| due_date | timestamp | Payment due date |
| paid_at | timestamp | When payment was received |
| invoice_url | text | Optional URL to view invoice |
| invoice_pdf | text | Optional URL to download PDF |
| provider_invoice_id | text | Optional external provider reference |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

## Service Architecture

The subscription system is built around the following services:

### SubscriptionService

Handles core subscription operations:
- Retrieving subscription plans
- Managing organization subscriptions (create, update, cancel)
- Managing subscription invoices (create, update, mark as paid)

### SubscriptionStatusService

Handles subscription status and feature access checks:
- Checking if a subscription is active
- Determining if an organization has access to specific features
- Checking usage limits

### FeatureFlagService

Manages feature flags and access control:
- Defining available features
- Checking if features are enabled for an organization
- Enforcing usage limits

## Feature Flag System

The feature flag system controls access to features based on subscription tier. Features are defined in the `FEATURES` constant in the `FeatureFlagService`.

### Feature Types

- **Boolean Features**: Simple on/off features (e.g., `METAKOCKA_INTEGRATION: true/false`)
- **Limit Features**: Features with numerical limits (e.g., `MAX_CONTACTS: 100`)

### Feature Categories

- **Core Features**: Basic functionality available to all users
- **Metakocka Integration**: ERP integration features
- **AI Features**: Advanced AI-powered capabilities
- **Advanced Features**: Premium functionality for higher tiers
- **Usage Limits**: Numerical limits on resource usage

## API Endpoints

### Subscription Management

- `GET /api/subscription/plans`: List all available subscription plans
- `GET /api/subscription/current`: Get current subscription for an organization
- `POST /api/subscription/manage`: Create, update, or cancel subscriptions
- `GET /api/subscription/invoices`: List invoices for an organization

### Feature Flags

- `GET /api/feature-flags`: Get all feature flags for an organization
- `GET /api/feature-flags/[featureKey]`: Check if a specific feature is enabled

## Frontend Components

### Subscription Management

- `SubscriptionPlanCard`: Displays subscription plan details
- `BillingHistoryPage`: Shows invoice history

### Feature Access

- `FeatureCheck`: Conditionally renders content based on feature access
- `FeatureUpgradePrompt`: Shows upgrade prompt for unavailable features
- `UsageLimitCheck`: Displays warnings when approaching usage limits

### Analytics Dashboard

- `SubscriptionAnalyticsPage`: Comprehensive dashboard for subscription metrics
- `CohortRetentionTable`: Displays cohort retention analysis
- `PlanDistributionChart`: Visualizes plan distribution by users and revenue

### Notification Center

- `NotificationCenter`: Displays user notifications including subscription events
- `NotificationItem`: Individual notification with type-based styling

## Subscription Analytics

The subscription analytics system provides detailed metrics and visualizations for subscription data:

### Key Metrics

- **Total Subscriptions**: Count of all subscriptions
- **Active Subscriptions**: Count of active subscriptions
- **Trialing Subscriptions**: Count of trial subscriptions
- **Canceled Subscriptions**: Count of canceled subscriptions
- **Monthly Recurring Revenue (MRR)**: Total monthly revenue
- **Average Revenue Per User (ARPU)**: Average revenue per active user
- **Retention Rate**: Percentage of users who remain subscribed
- **Churn Rate**: Percentage of users who cancel subscriptions
- **Trial Conversion Rate**: Percentage of trials that convert to paid subscriptions
- **Average Subscription Value**: Average value of active subscriptions
- **Estimated Lifetime Value (LTV)**: Estimated total revenue from a customer

### Visualizations

- **Plan Distribution (Users)**: Doughnut chart showing user distribution across plans
- **Plan Distribution (Revenue)**: Doughnut chart showing revenue distribution across plans
- **Subscription Trend**: Line chart showing subscription growth over time
- **Cohort Retention Analysis**: Table showing retention rates by cohort

### Export Functionality

The analytics dashboard includes an export feature that generates a CSV file with all subscription metrics, including:

- Key metrics summary
- Plan distribution (users and revenue)
- Subscription trend data
- Cohort retention analysis

## Notification System

The notification system keeps users informed about subscription-related events:

### Notification Types

- **Trial Expiration**: Alerts when a trial is about to expire
- **Payment Failed**: Alerts when a payment attempt fails
- **Subscription Upgraded**: Confirms successful plan upgrades
- **Renewal Reminder**: Reminds users of upcoming subscription renewals

### Components

- **Database Schema**: Notifications table with user_id, organization_id, title, message, type, read status
- **NotificationService**: Core service for creating and managing notifications
- **SubscriptionNotificationService**: Specialized service for subscription-related notifications
- **API Endpoints**: Routes for fetching and managing notifications
- **UI Components**: NotificationCenter component for displaying notifications

### Scheduled Jobs

- **Trial Expiration Notifications**: Sends alerts 3 days before trial expiration
- **Renewal Reminders**: Sends alerts 7 days before subscription renewal

### Webhook Integration

The system includes webhook handlers for payment provider events:

- Payment succeeded/failed events
- Subscription created/updated/canceled events
- Trial ending events

## Integration Guide

### Adding Feature Checks to Components

Use the `useFeatureFlag` hook to check feature access:

```tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyComponent({ organizationId }) {
  const { isEnabled } = useFeatureFlag('FEATURE_NAME', { organizationId });
  
  if (!isEnabled) {
    return <p>Feature not available</p>;
  }
  
  return <p>Feature content</p>;
}
```

Alternatively, use the `FeatureCheck` component:

```tsx
import FeatureCheck from '@/components/subscription/FeatureCheck';

function MyComponent({ organizationId }) {
  return (
    <FeatureCheck feature="FEATURE_NAME" organizationId={organizationId}>
      <p>Feature content</p>
    </FeatureCheck>
  );
}
```

### Server-Side Feature Checks

Use the `checkFeatureAccess` utility in API routes:

```typescript
import { checkFeatureAccess } from '@/lib/utils/checkFeatureAccess';

export async function GET(request) {
  const organizationId = request.headers.get('x-organization-id');
  const hasAccess = await checkFeatureAccess(organizationId, 'FEATURE_NAME');
  
  if (!hasAccess) {
    return Response.json({ error: 'Feature not available' }, { status: 403 });
  }
  
  // Continue with request handling
}
```

### Adding New Features

To add a new feature flag:

1. Add the feature to the `FEATURES` constant in `FeatureFlagService`
2. Update subscription plans in the database to include the new feature
3. Add feature checks in components and API routes where needed

### Testing Feature Access

To test feature access without a real subscription:

1. Create a test subscription plan with specific features enabled
2. Create a test subscription for your organization linked to this plan
3. Use the feature flag system to check access

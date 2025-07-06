# CRM Mind Subscription System Implementation

## Overview

This document provides a comprehensive guide to the subscription system implementation in CRM Mind. The system includes pricing tiers, feature flags, admin interfaces, analytics, and API endpoints for managing subscriptions.

## Table of Contents

1. [Subscription Plans](#subscription-plans)
2. [Feature Flags](#feature-flags)
3. [Admin Interface](#admin-interface)
4. [Analytics Dashboard](#analytics-dashboard)
5. [API Endpoints](#api-endpoints)
6. [User Interface Components](#user-interface-components)
7. [Implementation Steps](#implementation-steps)
8. [Future Enhancements](#future-enhancements)

## Subscription Plans

The system includes five pricing tiers with different features and limits:

### Free Tier
- **Price**: $0/month
- **User Limit**: 1 user
- **Contact Limit**: 25 contacts
- **Features**: Basic DISC insights, email support, mobile app access

### Starter Tier
- **Price**: $18/month or $14/month billed annually (22% savings)
- **User Limit**: 1 user
- **Contact Limit**: 500 contacts
- **Features**: Advanced DISC profiling, basic automation, priority email support

### Pro Tier
- **Price**: $49/month or $39/month billed annually (20% savings)
- **Current Beta Price**: $0/month (limited time)
- **User Limit**: 5 users
- **Contact Limit**: Unlimited
- **Features**: Team collaboration tools, unlimited AI generation, 24/7 priority support

### Business Tier
- **Price**: $99/month or $79/month billed annually (20% savings)
- **User Limit**: 10 users included, $15/month per additional user
- **Contact Limit**: Unlimited
- **Features**: Advanced analytics dashboard, custom integrations & API, priority phone support

### Enterprise Tier
- **Price**: $197/month or $157/month billed annually (20% savings)
- **User Limit**: Minimum 20 users, custom pricing with volume discounts
- **Contact Limit**: Unlimited
- **Features**: Enterprise security & SSO, dedicated success manager, SLA guarantees & compliance

## Feature Flags

The subscription system uses feature flags to control access to features based on the subscription plan. Feature flags are stored in the subscription plan's `features` field as a JSON object.

### Feature Flag Types

- **Boolean Flags**: Enable or disable features (e.g., `ADVANCED_DISC_PROFILING: true`)
- **Numeric Limits**: Set usage limits (e.g., `MAX_CONTACTS: 500`)
- **String Values**: Configure feature-specific settings

### Core Feature Flags

| Flag | Type | Description |
|------|------|-------------|
| `MAX_USERS` | Numeric | Maximum number of users allowed |
| `MAX_CONTACTS` | Numeric | Maximum number of contacts allowed (-1 for unlimited) |
| `BASIC_DISC_INSIGHTS` | Boolean | Access to basic DISC insights |
| `ADVANCED_DISC_PROFILING` | Boolean | Access to advanced DISC profiling |
| `BASIC_AUTOMATION` | Boolean | Access to basic automation features |
| `TEAM_COLLABORATION` | Boolean | Access to team collaboration tools |
| `ADVANCED_ANALYTICS` | Boolean | Access to advanced analytics dashboard |
| `CUSTOM_INTEGRATIONS` | Boolean | Access to custom integrations and API |
| `ENTERPRISE_SECURITY` | Boolean | Access to enterprise security features and SSO |
| `PRIORITY_SUPPORT` | Boolean | Access to priority support |
| `PHONE_SUPPORT` | Boolean | Access to phone support |
| `DEDICATED_MANAGER` | Boolean | Access to a dedicated success manager |
| `AI_GENERATION_LIMIT` | Numeric | Limit on AI generation usage (-1 for unlimited) |

## Admin Interface

The admin interface provides tools for managing subscription plans and organization subscriptions.

### Subscription Plan Management

- **URL**: `/admin/subscriptions`
- **Features**:
  - List all subscription plans
  - Create new subscription plans
  - Edit existing plans
  - Activate/deactivate plans
  - Configure plan features and pricing

### Organization Subscription Management

- **URL**: `/admin/subscriptions/organizations`
- **Features**:
  - View all organization subscriptions
  - Filter by organization, plan, or status
  - Change subscription plans
  - Cancel or reactivate subscriptions
  - View subscription details and history

## Analytics Dashboard

The subscription analytics dashboard provides insights into subscription performance.

- **URL**: `/admin/analytics/subscriptions`
- **Metrics**:
  - Total subscriptions
  - Active/trialing/canceled subscriptions
  - Monthly Recurring Revenue (MRR)
  - Plan distribution
  - Subscription status breakdown
  - Subscription trend over time
  - Retention rate
- **Filters**: 30 days, 90 days, 1 year

## API Endpoints

### Subscription Plans

- `GET /api/admin/subscription/plans` - Get all subscription plans
- `POST /api/admin/subscription/plans` - Create a new subscription plan
- `GET /api/admin/subscription/plans/[id]` - Get a specific subscription plan
- `PUT /api/admin/subscription/plans/[id]` - Update a subscription plan
- `PATCH /api/admin/subscription/plans/[id]` - Partially update a subscription plan
- `DELETE /api/admin/subscription/plans/[id]` - Delete a subscription plan

### Organization Subscriptions

- `GET /api/admin/subscription/organizations` - Get all organization subscriptions
- `GET /api/admin/subscription/organizations/[id]` - Get a specific organization subscription
- `PUT /api/admin/subscription/organizations/[id]` - Update a subscription
- `POST /api/admin/subscription/organizations/[id]/change-plan` - Change subscription plan
- `POST /api/admin/subscription/organizations/[id]/cancel` - Cancel subscription
- `POST /api/admin/subscription/organizations/[id]/reactivate` - Reactivate subscription

### Analytics

- `GET /api/admin/analytics/subscriptions` - Get subscription analytics

## User Interface Components

### Pricing Page

- **URL**: `/pricing`
- **Features**:
  - Display all available subscription plans
  - Toggle between monthly and annual billing
  - Show plan features and limits
  - Highlight popular plans
  - Call-to-action buttons for each plan

### Checkout Page

- **URL**: `/checkout`
- **Features**:
  - Display selected plan details
  - Configure user count for team plans
  - Calculate total price
  - Process payment (integration with payment processor)

### Current Subscription Status

- **Component**: `CurrentSubscriptionStatus`
- **Features**:
  - Display current plan details
  - Show subscription status and period
  - List active features
  - Provide options to manage or upgrade subscription

## Implementation Steps

1. **Database Setup**:
   - Tables for subscription plans, organization subscriptions, and invoices
   - Feature flag schema in subscription plans

2. **Core Services**:
   - `SubscriptionService` for basic subscription operations
   - `EnhancedSubscriptionService` for integration with predefined plans
   - Feature access checking utilities

3. **Admin Interface**:
   - Plan management UI
   - Organization subscription management UI
   - Analytics dashboard

4. **User-Facing Components**:
   - Pricing page
   - Checkout flow
   - Subscription status display

5. **API Endpoints**:
   - Admin endpoints for subscription management
   - User endpoints for subscription information

6. **Integration**:
   - Feature flag integration with application features
   - User and contact limit enforcement

## Future Enhancements

1. **Payment Processor Integration**:
   - Integrate with Stripe for payment processing
   - Handle webhooks for subscription events
   - Automatic billing and invoicing

2. **Advanced Analytics**:
   - Cohort analysis for retention
   - Conversion funnel tracking
   - Revenue forecasting

3. **User Management**:
   - Seat management for team plans
   - Role-based permissions tied to subscription tiers

4. **Billing Portal**:
   - Self-service subscription management
   - Payment method management
   - Invoice history

5. **Promotional Features**:
   - Coupon and discount system
   - Referral program
   - Loyalty rewards

## Initialization

To initialize the subscription plans in the database, run the following command:

```bash
npx ts-node scripts/initialize-subscription-plans.ts
```

This script will create or update subscription plans in the database based on the predefined plans in the `subscription-plans.ts` file.

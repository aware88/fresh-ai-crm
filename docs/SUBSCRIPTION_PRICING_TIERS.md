# CRM Mind Subscription System & Pricing Tiers

## Table of Contents

1. [System Overview](#system-overview)
2. [Admin UI Components](#admin-ui-components)
3. [Analytics Dashboard](#analytics-dashboard)
4. [API Endpoints](#api-endpoints)
5. [Pricing Tier Analysis](#pricing-tier-analysis)
6. [Implementation Recommendations](#implementation-recommendations)
7. [Feature Flag Mapping](#feature-flag-mapping)

## System Overview

The CRM Mind subscription system provides a comprehensive solution for managing subscription plans, organization subscriptions, and feature access control. The system consists of several components:

- **Subscription Services**: Core services for managing subscription plans, organization subscriptions, and feature access
- **Feature Flag System**: Controls access to features based on subscription plans
- **Admin UI**: Interface for managing subscription plans and organization subscriptions
- **Analytics Dashboard**: Visualizes subscription metrics and trends
- **API Endpoints**: Backend routes for subscription management

## Admin UI Components

### Main Admin Dashboard

The admin dashboard provides an overview of key subscription metrics:

- Total organizations
- Total users
- Active subscriptions
- Monthly Recurring Revenue (MRR)
- Quick actions for subscription management

### Subscription Plan Management

The subscription plan management interface allows administrators to:

- Create new subscription plans
- Edit existing plans
- Configure plan features and limits
- Set pricing and billing intervals
- Activate or deactivate plans

### Organization Subscription Management

The organization subscription management interface allows administrators to:

- View all organization subscriptions
- Filter subscriptions by status, plan, or organization
- Change subscription plans for organizations
- Cancel or reactivate subscriptions
- View subscription details and history

## Analytics Dashboard

The subscription analytics dashboard provides insights into subscription performance:

- **Key Metrics**:
  - Total subscriptions
  - Active/trialing/canceled subscriptions
  - Monthly Recurring Revenue (MRR)
  - Retention rate

- **Charts**:
  - Plan distribution
  - Subscription status breakdown
  - Subscription trend over time

- **Time Range Selection**: 30 days, 90 days, or 1 year

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

## Pricing Tier Analysis

Based on the proposed pricing tiers and our current implementation, here's an analysis of what's possible to implement with our current system:

### Tier Structure Overview

| Tier | Monthly Price | Annual Price | User Limit | Key Features |
|------|--------------|--------------|------------|-------------|
| Free | $0 | $0 | 1 | Basic DISC insights, 25 contacts |
| Starter | $18 | $14/mo ($168/yr) | 1 | Advanced DISC, 500 contacts |
| Pro | $49 (beta: $0) | $0 (beta) | 5 | Unlimited contacts, team collaboration |
| Business | $99 | $79/mo ($948/yr) | 10 (+$15/user) | Advanced analytics, custom integrations |
| Enterprise | $197 | $157/mo ($1,884/yr) | 20+ | Enterprise security, dedicated support |

### Implementation Feasibility

1. **User Limits**: Our current system can handle user limits through feature flags. We can implement a numeric feature flag (e.g., `MAX_USERS`) for each tier.

2. **Contact Limits**: Similar to user limits, we can implement a numeric feature flag (e.g., `MAX_CONTACTS`) for each tier.

3. **Feature Access**: Our feature flag system already supports boolean flags for enabling/disabling features based on subscription tier.

4. **Beta Pricing**: We can implement special pricing for the Pro tier during the beta period by creating a separate "Pro Beta" plan with $0 pricing.

5. **Additional Users**: For the Business and Enterprise tiers, we need to implement a per-user pricing model. This requires:
   - Tracking the number of users in an organization
   - Calculating additional charges based on user count
   - Updating billing when users are added/removed

6. **Annual Billing**: Our system supports both monthly and annual billing intervals. We can implement the discounted annual pricing as separate plans or as options within each plan.

## Implementation Recommendations

Based on the analysis, here are our recommendations for implementing the proposed pricing tiers:

### 1. Core Plan Structure

Implement the five core subscription plans with their respective features and limits:

```javascript
// Example plan structure
const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    billing_interval: "monthly",
    features: {
      MAX_USERS: 1,
      MAX_CONTACTS: 25,
      BASIC_DISC_INSIGHTS: true,
      ADVANCED_DISC_PROFILING: false,
      // other features...
    },
    is_active: true
  },
  // Other plans...
];
```

### 2. Feature Flag Mapping

Map each feature mentioned in the pricing tiers to specific feature flags in our system:

| Feature | Feature Flag | Type | Description |
|---------|--------------|------|-------------|
| User Limit | MAX_USERS | Numeric | Maximum number of users allowed |
| Contact Limit | MAX_CONTACTS | Numeric | Maximum number of contacts allowed |
| Basic DISC | BASIC_DISC_INSIGHTS | Boolean | Access to basic DISC insights |
| Advanced DISC | ADVANCED_DISC_PROFILING | Boolean | Access to advanced DISC profiling |
| Basic Automation | BASIC_AUTOMATION | Boolean | Access to basic automation features |
| Team Collaboration | TEAM_COLLABORATION | Boolean | Access to team collaboration tools |
| Advanced Analytics | ADVANCED_ANALYTICS | Boolean | Access to advanced analytics dashboard |
| Custom Integrations | CUSTOM_INTEGRATIONS | Boolean | Access to custom integrations and API |
| Enterprise Security | ENTERPRISE_SECURITY | Boolean | Access to enterprise security features and SSO |

### 3. Additional User Pricing

Implement a system for tracking and billing additional users:

1. Add a `base_user_count` field to subscription plans to track included users
2. Add an `additional_user_price` field to subscription plans
3. Create a function to calculate additional user charges
4. Update the billing system to include additional user charges

### 4. Annual Billing

Implement annual billing options:

1. Create separate annual plans with discounted pricing
2. Update the subscription UI to allow switching between monthly and annual billing
3. Add logic to calculate and display savings for annual plans

### 5. Trial Period

Implement the 14-day free trial for paid plans:

1. Add a `trial_days` field to subscription plans (set to 14 for paid plans)
2. Update the subscription creation process to set the trial period
3. Add logic to handle trial expiration and conversion to paid subscriptions

## Feature Flag Mapping

Here's a detailed mapping of features to feature flags for each tier:

### Free Tier
```json
{
  "MAX_USERS": 1,
  "MAX_CONTACTS": 25,
  "BASIC_DISC_INSIGHTS": true,
  "ADVANCED_DISC_PROFILING": false,
  "BASIC_AUTOMATION": false,
  "TEAM_COLLABORATION": false,
  "ADVANCED_ANALYTICS": false,
  "CUSTOM_INTEGRATIONS": false,
  "ENTERPRISE_SECURITY": false,
  "PRIORITY_SUPPORT": false,
  "PHONE_SUPPORT": false,
  "DEDICATED_MANAGER": false
}
```

### Starter Tier
```json
{
  "MAX_USERS": 1,
  "MAX_CONTACTS": 500,
  "BASIC_DISC_INSIGHTS": true,
  "ADVANCED_DISC_PROFILING": true,
  "BASIC_AUTOMATION": true,
  "TEAM_COLLABORATION": false,
  "ADVANCED_ANALYTICS": false,
  "CUSTOM_INTEGRATIONS": false,
  "ENTERPRISE_SECURITY": false,
  "PRIORITY_SUPPORT": true,
  "PHONE_SUPPORT": false,
  "DEDICATED_MANAGER": false
}
```

### Pro Tier
```json
{
  "MAX_USERS": 5,
  "MAX_CONTACTS": -1, // Unlimited
  "BASIC_DISC_INSIGHTS": true,
  "ADVANCED_DISC_PROFILING": true,
  "BASIC_AUTOMATION": true,
  "TEAM_COLLABORATION": true,
  "ADVANCED_ANALYTICS": false,
  "CUSTOM_INTEGRATIONS": false,
  "ENTERPRISE_SECURITY": false,
  "PRIORITY_SUPPORT": true,
  "PHONE_SUPPORT": false,
  "DEDICATED_MANAGER": false,
  "AI_GENERATION_LIMIT": -1 // Unlimited
}
```

### Business Tier
```json
{
  "MAX_USERS": 10, // Base users, additional at $15/month
  "MAX_CONTACTS": -1, // Unlimited
  "BASIC_DISC_INSIGHTS": true,
  "ADVANCED_DISC_PROFILING": true,
  "BASIC_AUTOMATION": true,
  "TEAM_COLLABORATION": true,
  "ADVANCED_ANALYTICS": true,
  "CUSTOM_INTEGRATIONS": true,
  "ENTERPRISE_SECURITY": false,
  "PRIORITY_SUPPORT": true,
  "PHONE_SUPPORT": true,
  "DEDICATED_MANAGER": false,
  "AI_GENERATION_LIMIT": -1, // Unlimited
  "ADDITIONAL_USER_PRICE": 15
}
```

### Enterprise Tier
```json
{
  "MAX_USERS": 20, // Minimum users, custom pricing
  "MAX_CONTACTS": -1, // Unlimited
  "BASIC_DISC_INSIGHTS": true,
  "ADVANCED_DISC_PROFILING": true,
  "BASIC_AUTOMATION": true,
  "TEAM_COLLABORATION": true,
  "ADVANCED_ANALYTICS": true,
  "CUSTOM_INTEGRATIONS": true,
  "ENTERPRISE_SECURITY": true,
  "PRIORITY_SUPPORT": true,
  "PHONE_SUPPORT": true,
  "DEDICATED_MANAGER": true,
  "AI_GENERATION_LIMIT": -1, // Unlimited
  "SLA_GUARANTEES": true,
  "COMPLIANCE_FEATURES": true
}
```

## Conclusion

The proposed pricing tiers can be implemented with our current subscription system with minimal changes. The main areas requiring additional development are:

1. **Additional User Pricing**: Implementing per-user pricing for Business and Enterprise tiers
2. **Annual Billing**: Setting up discounted annual plans
3. **Trial Period**: Implementing the 14-day free trial for paid plans
4. **Beta Pricing**: Creating a special Pro Beta plan with $0 pricing

With these changes, we can fully implement the proposed pricing structure and provide a seamless subscription experience for users.

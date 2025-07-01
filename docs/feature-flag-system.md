# Feature Flag Management System

## Overview

The Feature Flag Management System allows for fine-grained control over feature access based on subscription tiers. It provides the ability to enable or disable specific features for organizations, with admin override capabilities.

## Components

### Backend Components

1. **Database Storage**
   - Feature flags are stored in the `subscription_plans.features` JSONB column
   - Feature overrides are stored in the `organization_subscriptions.metadata.feature_overrides` JSONB field

2. **API Endpoints**
   - `GET /api/organizations/:organizationId/subscription/features/:featureName` - Check if an organization has access to a specific feature
   - `POST /api/organizations/:organizationId/subscription/features/override` - Override feature access for an organization

3. **Database Functions**
   - `has_feature_access(org_id UUID, feature_name TEXT)` - SQL function to check feature access

### Frontend Components

1. **Feature Flag Utility**
   - `feature-flags.js` - Utility for checking feature access with caching
   - Exports `FEATURES` enum, `hasFeature()`, `clearFeatureCache()`, and `getSubscriptionTier()` functions

2. **UI Components**
   - `FeatureFlagManager.svelte` - Component for displaying and managing feature flags
   - Integrated into `SubscriptionDetails.svelte`

## Feature Tiers

Features are organized into three tiers:

1. **Basic Tier** (Free)
   - `contacts_basic` - Basic contact management
   - `sales_documents_basic` - Basic sales document management
   - `products_basic` - Basic product management

2. **Standard Tier**
   - `metakocka_integration` - Integration with Metakocka ERP
   - `bulk_operations` - Perform operations on multiple items at once
   - `advanced_reporting` - Access to advanced reports and analytics

3. **Premium Tier**
   - `ai_automation` - AI-powered automation features
   - `email_marketing` - Advanced email marketing capabilities
   - `white_label` - Remove Fresh AI CRM branding
   - `api_access` - Access to the Fresh AI CRM API

## Usage

### Checking Feature Access

```javascript
import { hasFeature, FEATURES } from '$lib/utils/feature-flags';

// Check if an organization has access to a feature
const hasAccess = await hasFeature(organizationId, FEATURES.METAKOCKA_INTEGRATION);

// Use the result to conditionally render UI elements
if (hasAccess) {
  // Show Metakocka integration features
} else {
  // Show upgrade prompt
}
```

### Overriding Feature Access (Admin Only)

```javascript
import { overrideFeatureFlags } from '$lib/api/subscription-api';

// Override feature access
const overrides = {
  [FEATURES.METAKOCKA_INTEGRATION]: true,  // Enable feature
  [FEATURES.BULK_OPERATIONS]: false         // Disable feature
};

await overrideFeatureFlags(organizationId, overrides);
```

## Testing

A comprehensive testing framework is available for validating the feature flag system:

1. **Setup**
   ```bash
   cd tests/subscription
   cp feature-flags-test.env.sample .env
   # Update .env with your test values
   ```

2. **Running Tests**
   ```bash
   ./run-feature-flags-test.sh
   ```

3. **Test Coverage**
   - Initial feature access state
   - Feature flag override functionality
   - Feature flag reset functionality
   - Proper state persistence

## Best Practices

1. **Always use the FEATURES enum** for feature names to ensure consistency
2. **Clear the cache** after making changes to feature access
3. **Use feature flags for UI elements** to avoid showing unavailable features
4. **Add new features to the appropriate tier** in the `FEATURES` enum
5. **Document new features** in this guide when adding them

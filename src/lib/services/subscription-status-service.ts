import { SubscriptionService, SubscriptionPlan } from './subscription-service';

export type FeatureAccess = {
  hasAccess: boolean;
  limit?: number;
  currentUsage?: number;
  reason?: string;
};

export class SubscriptionStatusService {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Check if an organization has access to a specific feature
   */
  async hasFeatureAccess(
    organizationId: string,
    featureKey: string
  ): Promise<FeatureAccess> {
    // Get the organization's subscription plan
    const { data: plan, error } = await this.subscriptionService.getOrganizationSubscriptionPlan(organizationId);

    // If there's an error or no plan, default to no access
    if (error || !plan) {
      return {
        hasAccess: false,
        reason: 'No active subscription found'
      };
    }

    // Check if the feature exists in the plan
    if (!(featureKey in plan.features)) {
      return {
        hasAccess: false,
        reason: `Feature '${featureKey}' not available in current plan`
      };
    }

    const featureValue = plan.features[featureKey];

    // If feature value is boolean, return direct access
    if (typeof featureValue === 'boolean') {
      return {
        hasAccess: featureValue,
        reason: featureValue ? undefined : `Feature '${featureKey}' not included in current plan`
      };
    }

    // If feature value is a number, it represents a limit
    if (typeof featureValue === 'number') {
      // For now, we'll return true if the limit is > 0
      // In a real implementation, you would check current usage against the limit
      return {
        hasAccess: featureValue > 0,
        limit: featureValue,
        reason: featureValue > 0 ? undefined : `Feature '${featureKey}' has reached its limit`
      };
    }

    // Default to no access for unknown feature value types
    return {
      hasAccess: false,
      reason: 'Unknown feature configuration'
    };
  }

  /**
   * Get the usage limit for a specific feature
   */
  async getFeatureLimit(
    organizationId: string,
    featureKey: string
  ): Promise<number | null> {
    const { data: plan, error } = await this.subscriptionService.getOrganizationSubscriptionPlan(organizationId);

    if (error || !plan || !(featureKey in plan.features)) {
      return null;
    }

    const featureValue = plan.features[featureKey];

    if (typeof featureValue === 'number') {
      return featureValue;
    }

    if (typeof featureValue === 'boolean' && featureValue) {
      return Infinity; // Unlimited for boolean true features
    }

    return null;
  }

  /**
   * Check if the organization's subscription is active
   */
  async isSubscriptionActive(organizationId: string): Promise<boolean> {
    const { data: subscription, error } = await this.subscriptionService.getOrganizationSubscription(organizationId);

    if (error || !subscription) {
      return false;
    }

    return subscription.status === 'active' || subscription.status === 'trialing';
  }

  /**
   * Get the organization's current subscription tier name
   */
  async getSubscriptionTier(organizationId: string): Promise<string | null> {
    const { data: plan, error } = await this.subscriptionService.getOrganizationSubscriptionPlan(organizationId);

    if (error || !plan) {
      return null;
    }

    return plan.name;
  }

  /**
   * Check if the organization needs to upgrade to access a feature
   */
  async needsUpgradeForFeature(
    organizationId: string,
    featureKey: string
  ): Promise<{ needsUpgrade: boolean; currentPlan: string | null; requiredPlan: string | null }> {
    const { hasAccess } = await this.hasFeatureAccess(organizationId, featureKey);
    const currentPlan = await this.getSubscriptionTier(organizationId);

    if (hasAccess) {
      return {
        needsUpgrade: false,
        currentPlan,
        requiredPlan: null
      };
    }

    // In a real implementation, you would determine which plan provides access to this feature
    // For now, we'll return a placeholder
    return {
      needsUpgrade: true,
      currentPlan,
      requiredPlan: 'Please upgrade to access this feature'
    };
  }
}

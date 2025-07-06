import { SubscriptionService } from './services/subscription-service';
import { getSubscriptionPlan } from './subscription-plans';

/**
 * Utility functions for checking subscription features
 */

/**
 * Check if an organization has access to a specific feature
 * @param organizationId - The organization ID
 * @param featureKey - The feature key to check
 * @returns Promise<boolean> - Whether the feature is enabled
 */
export async function hasFeatureAccess(
  organizationId: string,
  featureKey: string
): Promise<boolean> {
  const subscriptionService = new SubscriptionService();
  const { data, error } = await subscriptionService.getOrganizationFeatureAccess(organizationId);
  
  if (error || !data || !data.isActive || !data.features) {
    return false;
  }
  
  const feature = data.features[featureKey];
  return feature?.enabled || false;
}

/**
 * Get the numeric limit for a feature
 * @param organizationId - The organization ID
 * @param featureKey - The feature key to check
 * @param defaultValue - Default value if the feature is not found
 * @returns Promise<number> - The feature limit
 */
export async function getFeatureLimit(
  organizationId: string,
  featureKey: string,
  defaultValue: number = 0
): Promise<number> {
  const subscriptionService = new SubscriptionService();
  const { data, error } = await subscriptionService.getOrganizationFeatureAccess(organizationId);
  
  if (error || !data || !data.isActive || !data.features) {
    return defaultValue;
  }
  
  const feature = data.features[featureKey];
  return feature?.limit ?? defaultValue;
}

/**
 * Check if an organization can add more users
 * @param organizationId - The organization ID
 * @param currentUserCount - Current number of users
 * @returns Promise<{canAdd: boolean, reason?: string}> - Whether more users can be added
 */
export async function canAddMoreUsers(
  organizationId: string,
  currentUserCount: number
): Promise<{ canAdd: boolean; reason?: string }> {
  const subscriptionService = new SubscriptionService();
  const { data, error } = await subscriptionService.getOrganizationFeatureAccess(organizationId);
  
  if (error || !data || !data.isActive) {
    return { canAdd: false, reason: 'No active subscription found' };
  }
  
  // Find the predefined plan that matches this database plan
  const predefinedPlan = data.plan ? getSubscriptionPlan(data.plan.id) : null;
  
  if (!predefinedPlan) {
    return { canAdd: false, reason: 'Subscription plan not recognized' };
  }
  
  // Check if the plan supports additional users
  if (predefinedPlan.additionalUserPrice) {
    // Plans with additional user pricing can always add more users
    return { canAdd: true };
  }
  
  // For plans with fixed user limits, check against the limit
  if (currentUserCount < predefinedPlan.userLimit) {
    return { canAdd: true };
  }
  
  return { 
    canAdd: false, 
    reason: `Your plan is limited to ${predefinedPlan.userLimit} users. Please upgrade to add more users.`
  };
}

/**
 * Check if an organization can add more contacts
 * @param organizationId - The organization ID
 * @param currentContactCount - Current number of contacts
 * @returns Promise<{canAdd: boolean, reason?: string}> - Whether more contacts can be added
 */
export async function canAddMoreContacts(
  organizationId: string,
  currentContactCount: number
): Promise<{ canAdd: boolean; reason?: string }> {
  const subscriptionService = new SubscriptionService();
  const { data, error } = await subscriptionService.getOrganizationFeatureAccess(organizationId);
  
  if (error || !data || !data.isActive) {
    return { canAdd: false, reason: 'No active subscription found' };
  }
  
  // Check the MAX_CONTACTS feature
  const maxContacts = data.features?.MAX_CONTACTS?.limit;
  
  if (typeof maxContacts !== 'number') {
    return { canAdd: false, reason: 'Contact limit not defined in subscription' };
  }
  
  // -1 indicates unlimited contacts
  if (maxContacts === -1) {
    return { canAdd: true };
  }
  
  if (currentContactCount < maxContacts) {
    return { canAdd: true };
  }
  
  return { 
    canAdd: false, 
    reason: `Your plan is limited to ${maxContacts} contacts. Please upgrade to add more contacts.`
  };
}

/**
 * Calculate the price for additional users
 * @param organizationId - The organization ID
 * @param userCount - Number of users
 * @returns Promise<number> - Additional price for users
 */
export async function calculateAdditionalUserPrice(
  organizationId: string,
  userCount: number
): Promise<number> {
  const subscriptionService = new SubscriptionService();
  const { data, error } = await subscriptionService.getOrganizationSubscriptionPlan(organizationId);
  
  if (error || !data) {
    return 0;
  }
  
  // Find the predefined plan that matches this database plan
  const predefinedPlan = getSubscriptionPlan(data.id);
  
  if (!predefinedPlan) return 0;
  
  const baseUserLimit = predefinedPlan.userLimit;
  const additionalUserPrice = predefinedPlan.additionalUserPrice || 0;
  
  if (userCount <= baseUserLimit) return 0;
  
  const additionalUsers = userCount - baseUserLimit;
  return additionalUsers * additionalUserPrice;
}

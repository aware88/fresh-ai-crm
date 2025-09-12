import { getSubscriptionPlan } from '@/lib/subscription-plans-v2';

/**
 * Check if a feature is available for a given subscription plan
 * @param planId The ID of the subscription plan
 * @param featureKey The feature key to check
 */
export function hasFeature(planId: string, featureKey: string): boolean {
  const plan = getSubscriptionPlan(planId);
  if (!plan) return false;
  
  const featureValue = plan.features[featureKey];
  return featureValue === true || (typeof featureValue === 'number' && featureValue !== 0);
}

/**
 * Get the numeric limit for a feature
 * @param planId The ID of the subscription plan
 * @param featureKey The feature key to check
 * @param defaultValue The default value if the feature is not found
 */
export function getFeatureLimit(planId: string, featureKey: string, defaultValue: number = 0): number {
  const plan = getSubscriptionPlan(planId);
  if (!plan) return defaultValue;
  
  const featureValue = plan.features[featureKey];
  if (typeof featureValue === 'number') {
    return featureValue;
  }
  
  return defaultValue;
}

/**
 * Check if a user is within the user limit for their subscription
 * @param planId The ID of the subscription plan
 * @param currentUserCount The current number of users
 */
export function isWithinUserLimit(planId: string, currentUserCount: number): boolean {
  const plan = getSubscriptionPlan(planId);
  if (!plan) return false;
  
  const userLimit = plan.userLimit;
  return currentUserCount <= userLimit;
}

/**
 * Check if a user can add more contacts based on their subscription
 * @param planId The ID of the subscription plan
 * @param currentContactCount The current number of contacts
 */
export function canAddMoreContacts(planId: string, currentContactCount: number): boolean {
  const plan = getSubscriptionPlan(planId);
  if (!plan) return false;
  
  const contactLimit = plan.features.MAX_CONTACTS as number;
  
  // -1 indicates unlimited contacts
  if (contactLimit === -1) return true;
  
  return currentContactCount < contactLimit;
}

/**
 * Calculate the number of additional users that can be added to a subscription
 * @param planId The ID of the subscription plan
 * @param currentUserCount The current number of users
 */
export function getAdditionalUserSlots(planId: string, currentUserCount: number): number {
  const plan = getSubscriptionPlan(planId);
  if (!plan) return 0;
  
  const userLimit = plan.userLimit;
  const remaining = userLimit - currentUserCount;
  
  return Math.max(0, remaining);
}

/**
 * Check if a plan supports additional users beyond the base limit
 * @param planId The ID of the subscription plan
 */
export function supportsAdditionalUsers(planId: string): boolean {
  const plan = getSubscriptionPlan(planId);
  if (!plan) return false;
  
  return !!plan.additionalUserPrice;
}

/**
 * Get the price for additional users
 * @param planId The ID of the subscription plan
 */
export function getAdditionalUserPrice(planId: string): number {
  const plan = getSubscriptionPlan(planId);
  if (!plan) return 0;
  
  return plan.additionalUserPrice || 0;
}

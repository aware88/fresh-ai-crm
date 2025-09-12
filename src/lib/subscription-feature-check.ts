import { SubscriptionService } from './services/subscription-service';
import { getSubscriptionPlan } from './subscription-plans-v2';

/**
 * Utility functions for checking subscription features
 * NOTE: These functions now include context optimization where possible
 */

// Helper to get subscription data from localStorage cache (same as context)
function getCachedSubscriptionData(): any {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem('subscription-cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      // Use cache if less than 10 minutes old
      if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn('Failed to load cached subscription data:', e);
  }
  return null;
}

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
  // Try to use cached subscription data first
  const cached = getCachedSubscriptionData();
  if (cached && cached.features) {
    return cached.features.includes(featureKey);
  }
  
  // Fallback to database query
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
  // Try to use cached subscription data first
  const cached = getCachedSubscriptionData();
  if (cached && cached.limits) {
    switch (featureKey) {
      case 'emailAccounts':
        return cached.limits.emailAccounts ?? defaultValue;
      case 'aiTokens':
        return cached.limits.aiTokens ?? defaultValue;
      case 'teamMembers':
        return cached.limits.teamMembers ?? defaultValue;
      default:
        // For unknown features, fall through to database query
        break;
    }
  }
  
  // Fallback to database query
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
  // Try to use cached subscription data first
  const cached = getCachedSubscriptionData();
  if (cached && cached.limits) {
    const teamMembersLimit = cached.limits.teamMembers;
    
    if (teamMembersLimit === -1) {
      return { canAdd: true }; // Unlimited
    }
    
    if (currentUserCount >= teamMembersLimit) {
      return { canAdd: false, reason: `Plan limited to ${teamMembersLimit} team members` };
    }
    
    return { canAdd: true };
  }
  
  // Fallback to database query
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
  // Try to use cached subscription data first
  const cached = getCachedSubscriptionData();
  if (cached && cached.limits) {
    // Note: Contact limits not typically in base subscription context
    // This would need to be added to the context if frequently used
    // For now, fall through to database query
  }
  
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
 * Check if an organization can add more email accounts
 * @param organizationId - The organization ID
 * @param currentEmailAccountCount - Current number of email accounts
 * @returns Promise<{canAdd: boolean, reason?: string, limit?: number}> - Whether more email accounts can be added
 */
export async function canAddMoreEmailAccounts(
  organizationId: string,
  currentEmailAccountCount: number
): Promise<{ canAdd: boolean; reason?: string; limit?: number }> {
  // Try to use cached subscription data first
  const cached = getCachedSubscriptionData();
  if (cached && cached.limits) {
    const emailAccountLimit = cached.limits.emailAccounts;
    
    if (emailAccountLimit === -1) {
      return { canAdd: true, limit: -1 }; // Unlimited
    }
    
    if (currentEmailAccountCount < emailAccountLimit) {
      return { canAdd: true, limit: emailAccountLimit };
    }
    
    return { 
      canAdd: false, 
      reason: `Your plan is limited to ${emailAccountLimit} email account${emailAccountLimit === 1 ? '' : 's'}. Please upgrade to add more.`,
      limit: emailAccountLimit 
    };
  }
  
  // Fallback to database query
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
  
  // Define email account limits based on subscription tier
  let emailAccountLimit: number;
  
  if (predefinedPlan.id.includes('starter')) {
    emailAccountLimit = 1;
  } else if (predefinedPlan.id.includes('pro')) {
    emailAccountLimit = 2;
  } else if (predefinedPlan.id.includes('premium')) {
    emailAccountLimit = 3; // Premium gets 3 email accounts
  } else {
    emailAccountLimit = 1; // Default to starter limits
  }
  
  // Check if current count is below limit
  
  if (currentEmailAccountCount < emailAccountLimit) {
    return { canAdd: true, limit: emailAccountLimit };
  }
  
  const planName = predefinedPlan.id.includes('starter') ? 'Starter' : 
                   predefinedPlan.id.includes('pro') ? 'Pro' : 'Premium';
  
  return { 
    canAdd: false, 
    reason: `Your ${planName} plan is limited to ${emailAccountLimit} email account${emailAccountLimit === 1 ? '' : 's'}. Please upgrade to add more email accounts.`,
    limit: emailAccountLimit
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

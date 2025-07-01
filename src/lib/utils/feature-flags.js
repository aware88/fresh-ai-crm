/**
 * Feature Flag System
 * 
 * Utility for checking feature access based on subscription tiers
 */

import { checkFeatureAccess } from '$lib/api/subscription-api';

// Define all available features
export const FEATURES = {
  // Basic features (available in all plans)
  CONTACTS_BASIC: 'contacts_basic',
  SALES_DOCUMENTS_BASIC: 'sales_documents_basic',
  PRODUCTS_BASIC: 'products_basic',
  
  // Standard tier features
  METAKOCKA_INTEGRATION: 'metakocka_integration',
  BULK_OPERATIONS: 'bulk_operations',
  ADVANCED_REPORTING: 'advanced_reporting',
  
  // Premium tier features
  AI_AUTOMATION: 'ai_automation',
  EMAIL_MARKETING: 'email_marketing',
  WHITE_LABEL: 'white_label',
  API_ACCESS: 'api_access'
};

// Cache for feature access results
const featureAccessCache = new Map();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Check if a feature is available for an organization
 * @param {string} organizationId - Organization ID
 * @param {string} featureName - Feature name from FEATURES enum
 * @param {boolean} bypassCache - Whether to bypass the cache
 * @returns {Promise<boolean>} True if the feature is available
 */
export async function hasFeature(organizationId, featureName, bypassCache = false) {
  if (!organizationId || !featureName) {
    return false;
  }
  
  const cacheKey = `${organizationId}:${featureName}`;
  
  // Check cache first unless bypassing
  if (!bypassCache && featureAccessCache.has(cacheKey)) {
    const cachedResult = featureAccessCache.get(cacheKey);
    
    if (Date.now() < cachedResult.expiry) {
      return cachedResult.hasAccess;
    }
    
    // Cache expired, remove it
    featureAccessCache.delete(cacheKey);
  }
  
  try {
    // Call API to check feature access
    const hasAccess = await checkFeatureAccess(organizationId, featureName);
    
    // Cache the result
    featureAccessCache.set(cacheKey, {
      hasAccess,
      expiry: Date.now() + CACHE_TTL
    });
    
    return hasAccess;
  } catch (error) {
    console.error(`Error checking feature access for ${featureName}:`, error);
    return false; // Default to false on error
  }
}

/**
 * Clear the feature access cache for an organization
 * @param {string} organizationId - Organization ID to clear cache for, or null to clear all
 */
export function clearFeatureCache(organizationId = null) {
  if (organizationId) {
    // Clear cache only for the specified organization
    const prefix = `${organizationId}:`;
    
    for (const key of featureAccessCache.keys()) {
      if (key.startsWith(prefix)) {
        featureAccessCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    featureAccessCache.clear();
  }
}

/**
 * Get subscription tier based on features
 * @param {Object} features - Features object from subscription plan
 * @returns {string} Tier name: 'free', 'standard', or 'premium'
 */
export function getSubscriptionTier(features) {
  if (!features) {
    return 'free';
  }
  
  // Check for premium features
  if (
    features[FEATURES.AI_AUTOMATION] ||
    features[FEATURES.EMAIL_MARKETING] ||
    features[FEATURES.WHITE_LABEL] ||
    features[FEATURES.API_ACCESS]
  ) {
    return 'premium';
  }
  
  // Check for standard features
  if (
    features[FEATURES.METAKOCKA_INTEGRATION] ||
    features[FEATURES.BULK_OPERATIONS] ||
    features[FEATURES.ADVANCED_REPORTING]
  ) {
    return 'standard';
  }
  
  return 'free';
}

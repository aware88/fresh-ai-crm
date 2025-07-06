import { FeatureFlagService, FeatureKey } from '@/lib/services/feature-flag-service';

/**
 * Check if a feature is enabled for an organization (server-side)
 * @param organizationId The organization ID to check
 * @param featureKey The feature key to check
 * @param fallback Fallback value if check fails
 */
export async function checkFeatureAccess(
  organizationId: string,
  featureKey: FeatureKey,
  fallback: boolean = false
): Promise<boolean> {
  try {
    const featureFlagService = new FeatureFlagService();
    return await featureFlagService.isFeatureEnabled(organizationId, featureKey);
  } catch (error) {
    console.error(`Error checking feature access for ${featureKey}:`, error);
    return fallback;
  }
}

/**
 * Check if an organization has exceeded a usage limit
 * @param organizationId The organization ID to check
 * @param featureKey The feature key for the limit
 * @param currentUsage The current usage to check against the limit
 */
export async function checkUsageLimit(
  organizationId: string,
  featureKey: FeatureKey,
  currentUsage: number
): Promise<{ hasExceeded: boolean; limit: number }> {
  try {
    const featureFlagService = new FeatureFlagService();
    const limit = await featureFlagService.getFeatureLimit(organizationId, featureKey);
    const hasExceeded = await featureFlagService.hasExceededLimit(
      organizationId,
      featureKey,
      currentUsage
    );
    
    return { hasExceeded, limit };
  } catch (error) {
    console.error(`Error checking usage limit for ${featureKey}:`, error);
    return { hasExceeded: false, limit: Infinity };
  }
}

/**
 * Higher-order function that wraps an API handler with feature flag checking
 * @param handler The API handler function
 * @param featureKey The feature key to check
 */
export function withFeatureCheck<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  featureKey: FeatureKey
) {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const [req, context] = args;
    
    // Extract organizationId from request
    // This is a simplified example - you'll need to adapt to your actual request structure
    const organizationId = req.headers?.get('x-organization-id') || 
                          req.cookies?.get('organizationId')?.value ||
                          new URL(req.url).searchParams.get('organizationId');
    
    if (!organizationId) {
      throw new Error('Organization ID is required for feature check');
    }
    
    const hasAccess = await checkFeatureAccess(organizationId, featureKey, false);
    
    if (!hasAccess) {
      const error = new Error(`Feature ${featureKey} is not available for this organization`);
      error.name = 'FeatureNotAvailableError';
      throw error;
    }
    
    return handler(...args);
  };
}

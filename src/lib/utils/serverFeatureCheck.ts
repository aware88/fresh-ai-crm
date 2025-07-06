import { cookies, headers } from 'next/headers';
import { FeatureFlagService, FeatureKey } from '@/lib/services/feature-flag-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Check if a feature is enabled for an organization (server component version)
 * @param featureKey The feature key to check
 * @param organizationId Optional organization ID (if not provided, will try to get from cookies/headers)
 * @param fallback Fallback value if check fails
 */
export async function serverFeatureCheck(
  featureKey: FeatureKey,
  organizationId?: string,
  fallback: boolean = false
): Promise<boolean> {
  try {
    // If organizationId is not provided, try to get it from cookies or headers
    if (!organizationId) {
      const cookieStore = cookies();
      const orgIdFromCookie = cookieStore.get('organizationId')?.value;
      
      const headersList = headers();
      const orgIdFromHeader = headersList.get('x-organization-id');
      
      organizationId = orgIdFromCookie || orgIdFromHeader || '';
    }

    if (!organizationId) {
      // Try to get organization ID from session
      const session = await getServerSession(authOptions);
      organizationId = (session?.user as any)?.organizationId || '';
    }

    if (!organizationId) {
      console.warn('No organization ID found for feature check');
      return fallback;
    }

    const featureFlagService = new FeatureFlagService();
    return await featureFlagService.isFeatureEnabled(organizationId, featureKey);
  } catch (error) {
    console.error(`Error checking feature access for ${featureKey}:`, error);
    return fallback;
  }
}

/**
 * Server component that conditionally renders content based on feature access
 * @param props Component props
 */
export async function ServerFeatureCheck({
  feature,
  organizationId,
  fallback = false,
  children,
  fallbackComponent,
}: {
  feature: FeatureKey;
  organizationId?: string;
  fallback?: boolean;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}) {
  const isEnabled = await serverFeatureCheck(feature, organizationId, fallback);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return null;
}

/**
 * Check if an organization has exceeded a usage limit
 * @param featureKey The feature key for the limit
 * @param currentUsage The current usage to check against the limit
 * @param organizationId Optional organization ID
 */
export async function serverCheckUsageLimit(
  featureKey: FeatureKey,
  currentUsage: number,
  organizationId?: string
): Promise<{ hasExceeded: boolean; limit: number }> {
  try {
    // If organizationId is not provided, try to get it from cookies or headers
    if (!organizationId) {
      const cookieStore = cookies();
      const orgIdFromCookie = cookieStore.get('organizationId')?.value;
      
      const headersList = headers();
      const orgIdFromHeader = headersList.get('x-organization-id');
      
      organizationId = orgIdFromCookie || orgIdFromHeader || '';
    }

    if (!organizationId) {
      // Try to get organization ID from session
      const session = await getServerSession(authOptions);
      organizationId = (session?.user as any)?.organizationId || '';
    }

    if (!organizationId) {
      console.warn('No organization ID found for usage limit check');
      return { hasExceeded: false, limit: Infinity };
    }

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

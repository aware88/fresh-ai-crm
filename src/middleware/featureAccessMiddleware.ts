import { NextRequest, NextResponse } from 'next/server';
import { FeatureFlagService, FeatureKey } from '@/lib/services/feature-flag-service';

/**
 * Middleware to check feature access for protected routes
 * @param request The incoming request
 * @param featureKey The feature key to check
 */
export async function checkFeatureAccess(
  request: NextRequest,
  featureKey: FeatureKey
) {
  try {
    // Extract organization ID from request
    // This is a simplified example - adapt to your actual request structure
    const organizationId = request.headers.get('x-organization-id') || 
                          request.cookies.get('organizationId')?.value ||
                          new URL(request.url).searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the feature is enabled for this organization
    const featureFlagService = new FeatureFlagService();
    const isEnabled = await featureFlagService.isFeatureEnabled(organizationId, featureKey);
    
    if (!isEnabled) {
      return NextResponse.json(
        { error: `Feature ${featureKey} is not available for this organization` },
        { status: 403 }
      );
    }
    
    // Continue with the request if feature is enabled
    return NextResponse.next();
  } catch (error) {
    console.error(`Error checking feature access for ${featureKey}:`, error);
    return NextResponse.json(
      { error: 'Failed to check feature access' },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to create middleware for specific features
 * @param featureKey The feature key to check
 */
export function withFeatureAccessCheck(featureKey: FeatureKey) {
  return async function middleware(request: NextRequest) {
    return checkFeatureAccess(request, featureKey);
  };
}

/**
 * Example usage in a route handler:
 * 
 * // In your API route
 * import { withFeatureAccessCheck } from '@/middleware/featureAccessMiddleware';
 * 
 * export const middleware = withFeatureAccessCheck('METAKOCKA_INTEGRATION');
 * 
 * export async function GET(request) {
 *   // This code only runs if the feature check passes
 *   // ...
 * }
 */

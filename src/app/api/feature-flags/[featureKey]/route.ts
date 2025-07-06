import { NextRequest, NextResponse } from 'next/server';
import { FeatureFlagService, FeatureKey, FEATURES } from '@/lib/services/feature-flag-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/feature-flags/[featureKey]
 * Check if a specific feature flag is enabled for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { featureKey: string } }
) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const featureKey = params.featureKey as FeatureKey;
    
    // Validate feature key
    if (!Object.keys(FEATURES).includes(featureKey)) {
      return NextResponse.json({ error: 'Invalid feature key' }, { status: 400 });
    }

    // Get organizationId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has access to this organization
    // In a real implementation, you would verify the user's access to this organization
    
    const featureFlagService = new FeatureFlagService();
    const enabled = await featureFlagService.isFeatureEnabled(organizationId, featureKey);
    
    // If this is a limit-based feature, include the limit
    let limit: number | undefined;
    if (typeof FEATURES[featureKey].default === 'number') {
      limit = await featureFlagService.getFeatureLimit(organizationId, featureKey);
    }

    return NextResponse.json({ 
      featureKey, 
      enabled,
      ...(limit !== undefined ? { limit } : {}),
      description: FEATURES[featureKey].description
    });
  } catch (error) {
    console.error(`Error checking feature flag ${params.featureKey}:`, error);
    return NextResponse.json(
      { error: 'Failed to check feature flag' },
      { status: 500 }
    );
  }
}

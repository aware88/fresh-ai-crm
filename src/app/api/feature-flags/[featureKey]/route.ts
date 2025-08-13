import { NextRequest, NextResponse } from 'next/server';
import { FeatureFlagService } from '@/lib/services/feature-flag-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/feature-flags/[featureKey]
 * Check if a specific feature flag is enabled for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ featureKey: string }> }
) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureKey } = await params;

    // Get organizationId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has access to this organization
    // In a real implementation, you would verify the user's access to this organization
    
    const featureFlagService = new FeatureFlagService();
    const result = await featureFlagService.hasFeatureAccess(organizationId, featureKey);

    return NextResponse.json({ featureKey, enabled: result.hasAccess, plan: result.currentPlan, reason: result.reason, upgradeRequired: result.upgradeRequired });
  } catch (error) {
    console.error(`Error checking feature flag ${featureKey}:`, error);
    return NextResponse.json(
      { error: 'Failed to check feature flag' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { FeatureFlagService } from '@/lib/services/feature-flag-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/feature-flags
 * Returns all feature flags for an organization
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organizationId from query params or session
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has access to this organization
    // In a real implementation, you would verify the user's access to this organization
    
    const featureFlagService = new FeatureFlagService();
    const features = await featureFlagService.getAllFeatureStatuses(organizationId);

    return NextResponse.json({ features });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

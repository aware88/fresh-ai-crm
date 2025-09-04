import { cookies, headers } from 'next/headers';
import { FeatureFlagService } from '@/lib/services/feature-flag-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import React from 'react';

// Define the FeatureKey type locally since it's not exported from feature-flag-service
export enum FeatureKey {
  AI_MEMORY = 'ai_memory',
  EMAIL_INTEGRATION = 'email_integration',
  CONTACT_MANAGEMENT = 'contact_management',
  ANALYTICS_DASHBOARD = 'analytics_dashboard',
  SALES_TACTICS = 'sales_tactics',
  BULK_OPERATIONS = 'bulk_operations',
  ADVANCED_REPORTING = 'advanced_reporting',
  CUSTOM_BRANDING = 'custom_branding',
  API_ACCESS = 'api_access',
  PRIORITY_SUPPORT = 'priority_support',
  PSYCHOLOGICAL_PROFILING = 'PSYCHOLOGICAL_PROFILING',
  CRM_ASSISTANT = 'CRM_ASSISTANT',
  AI_DRAFTING_ASSISTANCE = 'AI_DRAFTING_ASSISTANCE',
  PERSONALITY_INSIGHTS = 'PERSONALITY_INSIGHTS',
  ERP_INTEGRATION = 'ERP_INTEGRATION',
  AI_FUTURE_ACCESS = 'AI_FUTURE_ACCESS'
}

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
      const cookieStore = await cookies();
      const orgIdFromCookie = cookieStore.get('organizationId')?.value;
      
      const headersList = await headers();
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
    const featureCheck = await featureFlagService.hasFeatureAccess(organizationId, featureKey);
    return featureCheck.hasAccess;
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
    return React.createElement(React.Fragment, null, children);
  }

  if (fallbackComponent) {
    return React.createElement(React.Fragment, null, fallbackComponent);
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
      const cookieStore = await cookies();
      const orgIdFromCookie = cookieStore.get('organizationId')?.value;
      
      const headersList = await headers();
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

    // For now, we'll return a default limit since the actual service doesn't have limit methods
    // In a real implementation, this would check against actual feature limits
    const limit = 1000; // Default high limit
    const hasExceeded = currentUsage > limit;
    
    return { hasExceeded, limit };
  } catch (error) {
    console.error(`Error checking usage limit for ${featureKey}:`, error);
    return { hasExceeded: false, limit: Infinity };
  }
}
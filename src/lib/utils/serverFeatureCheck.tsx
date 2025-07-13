'use client';

import { cookies, headers } from 'next/headers';
import * as React from 'react';

// Define the FeatureKey type locally to avoid import errors
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
  PRIORITY_SUPPORT = 'priority_support'
}

// Create a simple interface for the feature flag service
interface FeatureFlagServiceInterface {
  isFeatureEnabled(organizationId: string, featureKey: FeatureKey): Promise<boolean>;
  getFeatureLimit(organizationId: string, featureKey: FeatureKey): Promise<number>;
  hasExceededLimit(organizationId: string, featureKey: FeatureKey, currentUsage: number): Promise<boolean>;
}

// Simple implementation that can be replaced later with the actual service
class FeatureFlagService implements FeatureFlagServiceInterface {
  async isFeatureEnabled(organizationId: string, featureKey: FeatureKey): Promise<boolean> {
    // Default implementation - replace with actual implementation
    return true;
  }

  async getFeatureLimit(organizationId: string, featureKey: FeatureKey): Promise<number> {
    // Default implementation - replace with actual implementation
    return 100;
  }

  async hasExceededLimit(organizationId: string, featureKey: FeatureKey, currentUsage: number): Promise<boolean> {
    const limit = await this.getFeatureLimit(organizationId, featureKey);
    return currentUsage > limit;
  }
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
      try {
        // In Next.js 14+, cookies() and headers() return promises
        const cookieStore = await cookies();
        const orgIdFromCookie = cookieStore.get('organizationId')?.value;
        
        const headersList = await headers();
        const orgIdFromHeader = headersList.get('x-organization-id');
        
        organizationId = orgIdFromCookie || orgIdFromHeader || '';
      } catch (error) {
        console.warn('Error accessing cookies or headers:', error);
      }
    }

    if (!organizationId) {
      // Try to get organization ID from session
      // Since we can't import authOptions directly, we'll need to handle this differently
      // For now, we'll just use the fallback value
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
      try {
        // In Next.js 14+, cookies() and headers() return promises
        const cookieStore = await cookies();
        const orgIdFromCookie = cookieStore.get('organizationId')?.value;
        
        const headersList = await headers();
        const orgIdFromHeader = headersList.get('x-organization-id');
        
        organizationId = orgIdFromCookie || orgIdFromHeader || '';
      } catch (error) {
        console.warn('Error accessing cookies or headers:', error);
      }
    }

    if (!organizationId) {
      // Try to get organization ID from session
      // Since we can't import authOptions directly, we'll need to handle this differently
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

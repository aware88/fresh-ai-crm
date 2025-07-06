'use client';

import { ReactNode } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FeatureKey } from '@/lib/services/feature-flag-service';

interface FeatureCheckProps {
  /** The feature key to check */
  feature: FeatureKey;
  /** The organization ID to check against */
  organizationId: string;
  /** Content to show when feature is enabled */
  children: ReactNode;
  /** Optional content to show when feature is disabled */
  fallback?: ReactNode;
  /** Whether to show a loading state */
  showLoading?: boolean;
}

/**
 * Component that conditionally renders content based on feature flag status
 */
export default function FeatureCheck({
  feature,
  organizationId,
  children,
  fallback,
  showLoading = true,
}: FeatureCheckProps) {
  const { isEnabled, isLoading, error } = useFeatureFlag(feature, {
    organizationId,
  });

  if (isLoading && showLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-pulse h-5 w-5 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    console.error('Error checking feature flag:', error);
  }

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return null;
}

/**
 * Component that shows an upgrade prompt when a feature is not available
 */
export function FeatureUpgradePrompt({
  feature,
  organizationId,
  children,
}: {
  feature: FeatureKey;
  organizationId: string;
  children: ReactNode;
}) {
  const { isEnabled, isLoading } = useFeatureFlag(feature, {
    organizationId,
  });

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-pulse h-5 w-5 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  if (isEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="p-6 border border-yellow-200 bg-yellow-50 rounded-lg text-center">
      <h3 className="text-lg font-medium text-yellow-800 mb-2">
        Feature Not Available
      </h3>
      <p className="text-yellow-700 mb-4">
        This feature requires an upgraded subscription plan.
      </p>
      <a
        href="/settings/subscription"
        className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md"
      >
        Upgrade Subscription
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="ml-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </a>
    </div>
  );
}

/**
 * Component that shows a usage limit warning
 */
export function UsageLimitCheck({
  feature,
  organizationId,
  currentUsage,
  children,
  warningThreshold = 0.8, // Show warning when 80% of limit is reached
}: {
  feature: FeatureKey;
  organizationId: string;
  currentUsage: number;
  children: ReactNode;
  warningThreshold?: number;
}) {
  const { limit, isLoading } = useFeatureFlag(feature, {
    organizationId,
  });

  if (isLoading || !limit) {
    return <>{children}</>;
  }

  const usagePercentage = currentUsage / limit;
  const isExceeded = currentUsage >= limit;
  const isWarning = usagePercentage >= warningThreshold && !isExceeded;

  if (isExceeded) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Usage Limit Reached
        </h3>
        <p className="text-red-700 mb-4">
          You have reached your usage limit of {limit} for this feature.
          Please upgrade your subscription to continue using this feature.
        </p>
        <a
          href="/settings/subscription"
          className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
        >
          Upgrade Subscription
        </a>
      </div>
    );
  }

  if (isWarning) {
    return (
      <>
        <div className="p-4 mb-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-400 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-yellow-700">
              You have used {currentUsage} of {limit} available. Consider upgrading your plan.
            </p>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}

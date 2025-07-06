import { useCallback, useEffect, useState } from 'react';
import { FeatureKey, FEATURES } from '@/lib/services/feature-flag-service';

type UseFeatureFlagOptions = {
  fallback?: boolean;
  organizationId?: string;
};

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag(featureKey: FeatureKey, options: UseFeatureFlagOptions = {}) {
  const { fallback = false, organizationId } = options;
  const [isEnabled, setIsEnabled] = useState<boolean>(fallback);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [limit, setLimit] = useState<number | null>(null);

  const checkFeature = useCallback(async () => {
    if (!organizationId) {
      setIsEnabled(fallback);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/feature-flags/${featureKey}?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check feature flag: ${response.statusText}`);
      }

      const data = await response.json();
      setIsEnabled(data.enabled);
      
      if (data.limit !== undefined) {
        setLimit(data.limit);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error checking feature flag'));
      setIsEnabled(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [featureKey, organizationId, fallback]);

  useEffect(() => {
    checkFeature();
  }, [checkFeature]);

  return {
    isEnabled,
    isLoading,
    error,
    limit,
    description: FEATURES[featureKey].description,
    refresh: checkFeature,
  };
}

/**
 * Hook to get all feature flags for an organization
 */
export function useAllFeatureFlags(organizationId?: string) {
  const [features, setFeatures] = useState<Record<FeatureKey, { enabled: boolean; limit?: number }> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeatures = useCallback(async () => {
    if (!organizationId) {
      setFeatures(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/feature-flags?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feature flags: ${response.statusText}`);
      }

      const data = await response.json();
      setFeatures(data.features);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error fetching feature flags'));
      setFeatures(null);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    features,
    isLoading,
    error,
    refresh: fetchFeatures,
  };
}

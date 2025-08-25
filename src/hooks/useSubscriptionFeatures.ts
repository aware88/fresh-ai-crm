import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getSubscriptionPlan } from '@/lib/subscription-plans';

type FeatureAccess = {
  plan: any;
  subscription: any;
  features: Record<string, { enabled: boolean; limit?: number }> | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook to access subscription features for an organization
 * @param organizationId - The organization ID
 * @returns FeatureAccess object with plan, subscription, features, and helper methods
 */
export function useSubscriptionFeatures(organizationId: string) {
  const { status } = useSession();
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess>({
    plan: null,
    subscription: null,
    features: null,
    isActive: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    // Don't fetch if there's no organizationId (individual users)
    if (!organizationId || organizationId.trim() === '') {
      setFeatureAccess({
        plan: null,
        subscription: null,
        features: null,
        isActive: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    const fetchFeatureAccess = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/subscription`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription data');
        }
        
        const data = await response.json();
        
        // If no subscription exists
        if (!data.subscription || !data.plan) {
          setFeatureAccess({
            plan: null,
            subscription: null,
            features: null,
            isActive: false,
            isLoading: false,
            error: null,
          });
          return;
        }
        
        // Extract features from the plan
        const planFeatures = data.plan.features || {};
        
        // Format features for easier consumption
        const formattedFeatures: Record<string, { enabled: boolean; limit?: number }> = {};
        
        Object.entries(planFeatures).forEach(([key, value]: [string, any]) => {
          if (typeof value === 'boolean') {
            formattedFeatures[key] = { enabled: value };
          } else if (typeof value === 'number') {
            formattedFeatures[key] = { enabled: value > 0, limit: value };
          } else {
            formattedFeatures[key] = { enabled: false };
          }
        });
        
        // Check if subscription is active
        const isActive = ['active', 'trialing'].includes(data.subscription.status);
        
        // Debug logging for troubleshooting (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 useSubscriptionFeatures Debug:', {
            organizationId,
            planId: data.plan?.id,
            planName: data.plan?.name,
            subscriptionStatus: data.subscription?.status,
            isActive
          });
        }
        
        setFeatureAccess({
          plan: data.plan,
          subscription: data.subscription,
          features: formattedFeatures,
          isActive,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error fetching subscription features:', err);
        setFeatureAccess(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load subscription features',
        }));
      }
    };

    fetchFeatureAccess();
  }, [organizationId, status]);

  /**
   * Check if a specific feature is enabled
   * @param featureKey - The feature key to check
   * @param defaultValue - Default value if the feature is not found
   * @returns boolean - Whether the feature is enabled
   */
  const hasFeature = (featureKey: string, defaultValue: boolean = false): boolean => {
    if (!featureAccess.isActive || !featureAccess.features) {
      console.log(`🚫 hasFeature(${featureKey}) - No features or inactive:`, {
        hasFeatures: !!featureAccess.features,
        isActive: featureAccess.isActive,
        isLoading: featureAccess.isLoading
      });
      return defaultValue;
    }
    
    const result = featureAccess.features[featureKey]?.enabled ?? defaultValue;
    
    console.log(`🔍 hasFeature(${featureKey}) - Result:`, {
      feature: featureAccess.features[featureKey],
      result,
      defaultValue
    });
    
    return result;
  };

  /**
   * Get the limit for a specific feature
   * @param featureKey - The feature key to check
   * @param defaultValue - Default value if the feature is not found
   * @returns number - The feature limit
   */
  const getFeatureLimit = (featureKey: string, defaultValue: number = 0): number => {
    if (!featureAccess.isActive || !featureAccess.features) {
      return defaultValue;
    }
    
    return featureAccess.features[featureKey]?.limit ?? defaultValue;
  };

  /**
   * Get the user limit for the current plan
   * @returns number - The user limit
   */
  const getUserLimit = (): number => {
    if (!featureAccess.plan) return 1;
    
    const predefinedPlan = getSubscriptionPlan(featureAccess.plan.id);
    return predefinedPlan?.userLimit || 1;
  };

  /**
   * Check if the plan supports additional users
   * @returns boolean - Whether additional users are supported
   */
  const supportsAdditionalUsers = (): boolean => {
    if (!featureAccess.plan) return false;
    
    const predefinedPlan = getSubscriptionPlan(featureAccess.plan.id);
    return !!predefinedPlan?.additionalUserPrice;
  };

  /**
   * Get the price per additional user
   * @returns number - The price per additional user
   */
  const getAdditionalUserPrice = (): number => {
    if (!featureAccess.plan) return 0;
    
    const predefinedPlan = getSubscriptionPlan(featureAccess.plan.id);
    return predefinedPlan?.additionalUserPrice || 0;
  };

  /**
   * Get the contact limit for the current plan
   * @returns number - The contact limit (-1 for unlimited)
   */
  const getContactLimit = (): number => {
    return getFeatureLimit('MAX_CONTACTS', 0);
  };

  /**
   * Check if the plan has unlimited contacts
   * @returns boolean - Whether contacts are unlimited
   */
  const hasUnlimitedContacts = (): boolean => {
    return getContactLimit() === -1;
  };

  return {
    ...featureAccess,
    hasFeature,
    getFeatureLimit,
    getUserLimit,
    supportsAdditionalUsers,
    getAdditionalUserPrice,
    getContactLimit,
    hasUnlimitedContacts,
  };
}

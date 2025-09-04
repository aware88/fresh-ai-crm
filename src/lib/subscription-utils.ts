import { useSubscriptionStatus } from '@/contexts/SubscriptionContext';

/**
 * Backward-compatible subscription utilities
 * These functions work with both the new context system and old individual API calls
 */

// Type definitions for backward compatibility
export interface SubscriptionLimits {
  emailAccounts: number;
  aiTokens: number;
  teamMembers: number;
  isUnlimited?: boolean;
}

export interface SubscriptionInfo {
  tier: string;
  limits: SubscriptionLimits;
  features: string[];
  canChangePlans: boolean;
  isContextReady?: boolean;
}

/**
 * HYBRID FUNCTION: Get subscription limits
 * This function tries the new context first, falls back to old API if needed
 * 
 * Usage in existing components:
 * const { limits, isLoading } = await useSubscriptionLimits();
 */
export function useSubscriptionLimits() {
  const contextStatus = useSubscriptionStatus();

  // If context is working, use it
  if (contextStatus.isWorking && contextStatus.subscription) {
    return {
      limits: contextStatus.subscription.limits,
      tier: contextStatus.subscription.tier,
      features: contextStatus.subscription.features,
      canChangePlans: contextStatus.subscription.canChangePlans,
      isLoading: false,
      error: null,
      source: 'context' as const,
      isContextReady: true
    };
  }

  // If context is still loading, return loading state
  if (contextStatus.isLoading) {
    return {
      limits: null,
      tier: null,
      features: [],
      canChangePlans: true,
      isLoading: true,
      error: null,
      source: 'context-loading' as const,
      isContextReady: false
    };
  }

  // Context failed or not ready - signal to use fallback
  return {
    limits: null,
    tier: null,
    features: [],
    canChangePlans: true,
    isLoading: false,
    error: 'Context not available - use fallback',
    source: 'fallback-needed' as const,
    isContextReady: false
  };
}

/**
 * HYBRID HOOK: Email account limits with automatic fallback
 * Works with both new and old systems
 */
export function useEmailAccountLimits() {
  const subscriptionData = useSubscriptionLimits();
  
  // If we have context data, use it
  if (subscriptionData.source === 'context' && subscriptionData.limits) {
    const limit = subscriptionData.limits.emailAccounts;
    return {
      limit: limit,
      isUnlimited: limit === -1,
      canChangePlans: subscriptionData.canChangePlans,
      tier: subscriptionData.tier,
      isLoading: false,
      source: 'context',
      needsFallback: false
    };
  }

  // If context is loading, return loading state
  if (subscriptionData.source === 'context-loading') {
    return {
      limit: null,
      isUnlimited: false,
      canChangePlans: true,
      tier: null,
      isLoading: true,
      source: 'context-loading',
      needsFallback: false
    };
  }

  // Signal that component should use its own API call (fallback)
  return {
    limit: null,
    isUnlimited: false,
    canChangePlans: true,
    tier: null,
    isLoading: false,
    source: 'fallback-needed',
    needsFallback: true
  };
}

/**
 * HYBRID HOOK: AI token limits
 */
export function useAITokenLimits() {
  const subscriptionData = useSubscriptionLimits();
  
  if (subscriptionData.source === 'context' && subscriptionData.limits) {
    const limit = subscriptionData.limits.aiTokens;
    return {
      limit: limit,
      isUnlimited: limit === -1,
      tier: subscriptionData.tier,
      isLoading: false,
      source: 'context',
      needsFallback: false
    };
  }

  if (subscriptionData.source === 'context-loading') {
    return {
      limit: null,
      isUnlimited: false,
      tier: null,
      isLoading: true,
      source: 'context-loading',
      needsFallback: false
    };
  }

  return {
    limit: null,
    isUnlimited: false,
    tier: null,
    isLoading: false,
    source: 'fallback-needed',
    needsFallback: true
  };
}

/**
 * HELPER: Check if user can change subscription plans
 */
export function useCanChangeSubscriptionPlans() {
  const subscriptionData = useSubscriptionLimits();
  
  if (subscriptionData.source === 'context') {
    return {
      canChange: subscriptionData.canChangePlans,
      tier: subscriptionData.tier,
      reason: subscriptionData.canChangePlans ? null : 'Premium plans managed by administrator',
      source: 'context',
      needsFallback: false
    };
  }

  if (subscriptionData.source === 'context-loading') {
    return {
      canChange: null,
      tier: null,
      reason: null,
      source: 'context-loading',
      needsFallback: false
    };
  }

  // Safe default - allow changes
  return {
    canChange: true,
    tier: null,
    reason: null,
    source: 'fallback-default',
    needsFallback: true
  };
}

/**
 * DEBUGGING: Utility to check subscription system health
 * Use this in components to debug subscription issues
 */
export function useSubscriptionDebug() {
  const contextStatus = useSubscriptionStatus();
  const subscriptionData = useSubscriptionLimits();
  
  return {
    contextHealth: {
      isWorking: contextStatus.isWorking,
      isReady: contextStatus.isReady,
      isLoading: contextStatus.isLoading,
      error: contextStatus.error,
      hasSubscription: !!contextStatus.subscription
    },
    dataSource: subscriptionData.source,
    needsFallback: subscriptionData.source === 'fallback-needed',
    subscription: contextStatus.subscription,
    recommendations: {
      shouldUseFallback: subscriptionData.source === 'fallback-needed',
      shouldShowLoading: subscriptionData.source === 'context-loading',
      isFullyWorking: subscriptionData.source === 'context'
    }
  };
}
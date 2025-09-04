'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface SubscriptionData {
  tier: string;
  limits: {
    emailAccounts: number;
    aiTokens: number;
    aiTokensUsed: number;
    teamMembers: number;
  };
  features: string[];
  isUnlimited: boolean;
  canChangePlans: boolean;
  usage?: {
    topup: {
      available: number;
      totalSpent: number;
      totalPurchases: number;
    };
  };
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Backward compatibility flag
  isReady: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fetchSubscription = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 SubscriptionContext: Fetching subscription data for user:', session.user.id);
      
      const response = await fetch('/api/subscription/context', {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ SubscriptionContext: Received data:', data);
      
      setSubscription(data);
      setIsReady(true);
      
      // Cache in localStorage for faster subsequent loads
      try {
        localStorage.setItem('subscription-cache', JSON.stringify({
          data,
          timestamp: Date.now(),
          userId: session.user.id
        }));
      } catch (cacheError) {
        console.warn('Failed to cache subscription data:', cacheError);
      }
      
    } catch (err) {
      console.error('❌ SubscriptionContext: Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Try to use cached data as fallback
      try {
        const cached = localStorage.getItem('subscription-cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.userId === session.user.id) {
            console.log('📦 SubscriptionContext: Using cached data as fallback');
            setSubscription(parsed.data);
            setIsReady(true);
          }
        }
      } catch (fallbackError) {
        console.warn('Failed to load cached subscription as fallback:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      setSubscription(null);
      setIsLoading(false);
      setIsReady(false);
      return;
    }

    // Try to load from cache first for immediate display
    let cacheLoaded = false;
    try {
      const cached = localStorage.getItem('subscription-cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Use cache if less than 10 minutes old and same user
        if (
          Date.now() - parsed.timestamp < 10 * 60 * 1000 && 
          parsed.userId === session.user.id
        ) {
          console.log('📦 SubscriptionContext: Loading from cache - skipping API call');
          setSubscription(parsed.data);
          setIsReady(true);
          setIsLoading(false);
          cacheLoaded = true;
          return; // Skip API call if cache is fresh
        }
      }
    } catch (e) {
      console.warn('Failed to load subscription cache:', e);
    }

    // Only fetch fresh data if cache is not available or expired
    fetchSubscription();
  }, [session?.user?.id, status]);

  return (
    <SubscriptionContext.Provider 
      value={{
        subscription,
        isLoading,
        error,
        refetch: fetchSubscription,
        isReady
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// Safe hook that won't throw if context is not available
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.warn('useSubscription: Context not available, returning fallback values');
    return {
      subscription: null,
      isLoading: true,
      error: 'Context not available',
      refetch: async () => {},
      isReady: false
    };
  }
  return context;
}

// Backward-compatible helper hooks with fallback behavior
export function useCanAddEmailAccounts(fallbackLimit = 1) {
  const { subscription, isReady } = useSubscription();
  
  // If context not ready, return safe defaults
  if (!isReady || !subscription) {
    return {
      canAdd: false, // Conservative default
      limit: fallbackLimit,
      isUnlimited: false,
      isContextReady: false
    };
  }
  
  return {
    canAdd: subscription.limits.emailAccounts === -1 || 
           (subscription.limits.emailAccounts || 0) > 0,
    limit: subscription.limits.emailAccounts,
    isUnlimited: subscription.limits.emailAccounts === -1,
    isContextReady: true
  };
}

export function useCanChangePlans() {
  const { subscription, isReady } = useSubscription();
  
  // If context not ready, return safe default (allow changes)
  if (!isReady || !subscription) {
    return { canChange: true, isContextReady: false };
  }
  
  return {
    canChange: subscription.canChangePlans,
    isContextReady: true
  };
}

export function useHasFeature(feature: string) {
  const { subscription, isReady } = useSubscription();
  
  // If context not ready, return safe default (no features)
  if (!isReady || !subscription) {
    return { hasFeature: false, isContextReady: false };
  }
  
  return {
    hasFeature: subscription.features.includes(feature),
    isContextReady: true
  };
}

// Utility to check if subscription context is working
export function useSubscriptionStatus() {
  const { subscription, isLoading, error, isReady } = useSubscription();
  
  return {
    isWorking: isReady && !error && subscription !== null,
    isReady,
    isLoading,
    error,
    subscription
  };
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SubscriptionStatusBadgeProps {
  organizationId: string;
}

export default function SubscriptionStatusBadge({ organizationId }: SubscriptionStatusBadgeProps) {
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const router = useRouter();

  useEffect(() => {
    if (!organizationId) return;

    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch(`/api/subscription/current?organizationId=${organizationId}`);
        
        if (response.ok) {
          const data = await response.json();
          setSubscriptionTier(data.plan?.name || 'Free');
          
          // Check if subscription is active based on plan data
          setIsActive(Boolean(data.plan && ['active', 'trialing'].includes(data.subscription?.status)));
        } else {
          // Default to Free plan if no subscription is found
          setSubscriptionTier('Free');
          setIsActive(true); // Free plan is always "active"
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        setSubscriptionTier('Free');
        setIsActive(true); // Default to Free plan on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [organizationId]);

  if (isLoading) {
    return (
      <div className="animate-pulse h-6 w-20 bg-gray-200 rounded-full"></div>
    );
  }

  const getBadgeColor = () => {
    if (!isActive) return 'bg-red-100 text-red-800'; // Inactive subscription
    
    switch (subscriptionTier?.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      case 'free':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href="/settings/subscription" className="inline-block">
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor()} cursor-pointer hover:opacity-90`}
        title={isActive ? `${subscriptionTier} Plan` : 'Subscription Inactive'}
      >
        {subscriptionTier}
        {!isActive && (
          <svg className="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </Link>
  );
}

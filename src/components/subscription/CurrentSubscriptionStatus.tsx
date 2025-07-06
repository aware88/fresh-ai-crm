'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlan } from '@/lib/subscription-plans';
import { SubscriptionPlan, OrganizationSubscription } from '@/lib/services/subscription-service';

interface CurrentSubscriptionStatusProps {
  organizationId: string;
}

export default function CurrentSubscriptionStatus({ organizationId }: CurrentSubscriptionStatusProps) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        
        // Fetch the organization's subscription
        const subscriptionRes = await fetch(`/api/organizations/${organizationId}/subscription`);
        
        if (!subscriptionRes.ok) {
          throw new Error('Failed to fetch subscription data');
        }
        
        const subscriptionData = await subscriptionRes.json();
        setSubscription(subscriptionData.subscription);
        setPlan(subscriptionData.plan);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Failed to load subscription information');
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      fetchSubscriptionData();
    }
  }, [organizationId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleManageSubscription = () => {
    router.push(`/organizations/${organizationId}/subscription`);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!subscription || !plan) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">No Active Subscription</h3>
        <p className="mt-2 text-gray-600">Your organization doesn't have an active subscription.</p>
        <button
          onClick={handleUpgrade}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  // Find the predefined plan that matches this database plan
  const predefinedPlan = getSubscriptionPlan(plan.id);
  const isFree = plan.price === 0;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(subscription.status)}`}>
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </span>
            {predefinedPlan?.badge && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {predefinedPlan.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            ${plan.price}{plan.billing_interval === 'monthly' ? '/mo' : '/yr'}
          </p>
          <p className="text-sm text-gray-500">
            {plan.billing_interval === 'monthly' ? 'Monthly billing' : 'Annual billing'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Current period</span>
          <span className="text-gray-900">
            {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
          </span>
        </div>
        
        {subscription.cancel_at_period_end && (
          <div className="mt-2 text-sm text-red-600">
            Your subscription will be canceled at the end of the current billing period.
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">Plan Features</h4>
        <ul className="mt-2 space-y-2">
          {Object.entries(plan.features).map(([key, value]) => {
            // Skip internal feature flags that shouldn't be displayed
            if (key.startsWith('MAX_') || typeof value === 'number') return null;
            if (value === false) return null;
            
            let label = key
              .replace(/_/g, ' ')
              .toLowerCase()
              .replace(/\b\w/g, l => l.toUpperCase());
            
            return (
              <li key={key} className="text-sm flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {label}
              </li>
            );
          })}
          
          {/* Special case for contact limits */}
          <li className="text-sm flex items-center">
            <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {(plan.features.MAX_CONTACTS as number) === -1 
              ? 'Unlimited contacts' 
              : `Up to ${plan.features.MAX_CONTACTS} contacts`}
          </li>
          
          {/* Special case for user limits */}
          <li className="text-sm flex items-center">
            <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {predefinedPlan?.userLimit === 1 
              ? '1 user only' 
              : `Up to ${predefinedPlan?.userLimit} users`}
            {predefinedPlan?.additionalUserPrice && ` (${predefinedPlan.additionalUserPrice}/mo per additional user)`}
          </li>
        </ul>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        {!isFree && (
          <button
            onClick={handleManageSubscription}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Manage Subscription
          </button>
        )}
        <button
          onClick={handleUpgrade}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isFree ? 'Upgrade Plan' : 'Change Plan'}
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Organization } from '../page';

interface OrganizationSubscriptionProps {
  organization: Organization;
  organizationId: string;
}

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

export default function OrganizationSubscription({ organization, organizationId }: OrganizationSubscriptionProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch(`/api/admin/organizations/${organizationId}/subscription`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        
        const data = await response.json();
        setSubscription(data.subscription || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSubscription();
  }, [organizationId]);

  function getStatusBadgeColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Subscription</h3>
        <Link
          href={`/admin/subscriptions/organizations/${organizationId}`}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Manage Subscription
        </Link>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p>{error}</p>
        </div>
      ) : !subscription ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-8 text-center text-gray-500">
            No active subscription found for this organization.
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">{subscription.plan_name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Current Period</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(subscription.current_period_start).toLocaleDateString()} to {new Date(subscription.current_period_end).toLocaleDateString()}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Auto Renew</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {subscription.cancel_at_period_end ? 'No' : 'Yes'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(subscription.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

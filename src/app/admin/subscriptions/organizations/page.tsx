'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

interface OrganizationSubscription {
  id: string;
  organization_id: string;
  organization: Organization;
  subscription_plan_id: string;
  subscription_plan: {
    id: string;
    name: string;
    price: number;
    billing_interval: string;
  };
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export default function OrganizationSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<OrganizationSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [availablePlans, setAvailablePlans] = useState<{id: string, name: string}[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/subscription/organizations');
      if (!response.ok) throw new Error('Failed to load organization subscriptions');
      
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error('Error fetching organization subscriptions:', err);
      setError('Failed to load organization subscriptions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/subscription/plans');
      if (!response.ok) throw new Error('Failed to load subscription plans');
      
      const data = await response.json();
      setAvailablePlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    }
  };

  const handleChangePlan = async (subscriptionId: string, newPlanId: string) => {
    if (!confirm('Are you sure you want to change this organization\'s subscription plan?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/subscription/organizations/${subscriptionId}/change-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId: newPlanId })
      });

      if (!response.ok) {
        throw new Error('Failed to change subscription plan');
      }

      // Refresh subscriptions
      await fetchSubscriptions();
      alert('Subscription plan changed successfully');
    } catch (err) {
      console.error('Error changing subscription plan:', err);
      alert('Failed to change subscription plan. Please try again.');
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/subscription/organizations/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancelAtPeriodEnd: true })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh subscriptions
      await fetchSubscriptions();
      alert('Subscription canceled successfully');
    } catch (err) {
      console.error('Error canceling subscription:', err);
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to reactivate this subscription?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/subscription/organizations/${subscriptionId}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      // Refresh subscriptions
      await fetchSubscriptions();
      alert('Subscription reactivated successfully');
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      alert('Failed to reactivate subscription. Please try again.');
    }
  };

  // Filter subscriptions based on search term and filters
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.subscription_plan_id === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'incomplete':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Organization Subscriptions</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-64 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Organization Subscriptions</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Organization Subscriptions</h1>
          <div className="flex space-x-2">
            <Link 
              href="/admin/subscriptions"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Manage Plans
            </Link>
            <Link 
              href="/admin/analytics/subscriptions"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Analytics
            </Link>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by organization name or ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="canceled">Canceled</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Plans</option>
                {availablePlans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Subscriptions Table */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {filteredSubscriptions.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.organization.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.organization_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subscription.subscription_plan.name}</div>
                      <div className="text-sm text-gray-500">
                        ${subscription.subscription_plan.price}/{subscription.subscription_plan.billing_interval}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(subscription.status)}`}>
                        {subscription.status}
                      </span>
                      {subscription.cancel_at_period_end && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Canceling
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscription.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <select 
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleChangePlan(subscription.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          value=""
                        >
                          <option value="">Change Plan</option>
                          {availablePlans.map(plan => (
                            <option 
                              key={plan.id} 
                              value={plan.id}
                              disabled={plan.id === subscription.subscription_plan_id}
                            >
                              {plan.name}
                            </option>
                          ))}
                        </select>
                        
                        {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                          <button
                            onClick={() => handleCancelSubscription(subscription.id)}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            Cancel
                          </button>
                        )}
                        
                        {(subscription.status === 'canceled' || subscription.cancel_at_period_end) && (
                          <button
                            onClick={() => handleReactivateSubscription(subscription.id)}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Reactivate
                          </button>
                        )}
                        
                        <Link
                          href={`/admin/subscriptions/organizations/${subscription.organization_id}`}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No subscriptions found matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

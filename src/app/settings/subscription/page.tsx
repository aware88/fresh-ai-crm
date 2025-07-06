'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAllFeatureFlags } from '@/hooks/useFeatureFlag';
import SubscriptionPlanCard from '@/components/subscription/SubscriptionPlanCard';
import { SubscriptionPlan, SubscriptionService } from '@/lib/services/subscription-service';
import CancelSubscriptionDialog from '@/components/subscription/CancelSubscriptionDialog';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

export default function SubscriptionPage() {
  const [organizationId, setOrganizationId] = useState<string>('');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { features } = useAllFeatureFlags(organizationId);

  useEffect(() => {
    // Get organization ID from local storage or context
    const getOrgId = async () => {
      try {
        // This is a placeholder - replace with your actual method to get the organization ID
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.organizationId) {
          setOrganizationId(data.organizationId);
        } else {
          setError('No organization found. Please create or join an organization first.');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again later.');
      }
    };

    getOrgId();
  }, []);

  useEffect(() => {
    if (!organizationId) return;

    const fetchSubscriptionData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all available subscription plans
        const response = await fetch('/api/subscription/plans');
        if (!response.ok) throw new Error('Failed to load subscription plans');
        
        const plansData = await response.json();
        setPlans(plansData.plans);
        
        // Fetch current subscription plan and details
        const currentResponse = await fetch(`/api/subscription/current?organizationId=${organizationId}`);
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          setCurrentPlan(currentData.plan);
          
          // If we have a plan, also get the subscription details
          if (currentData.plan && currentData.subscription) {
            setCurrentSubscription(currentData.subscription);
          }
        }
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [organizationId]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!organizationId) return;
    
    try {
      // Redirect to the checkout page with the selected plan ID
      router.push(`/settings/subscription/checkout?plan=${plan.id}`);
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('Failed to select plan. Please try again later.');
    }
  };
  
  const handleCancelSubscription = () => {
    setShowCancelDialog(true);
  };
  
  const handleRenewSubscription = async () => {
    if (!organizationId || !currentSubscription) return;
    
    try {
      const response = await fetch('/api/subscription/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
          organizationId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to renew subscription');
      }
      
      // Refresh subscription data
      const currentResponse = await fetch(`/api/subscription/current?organizationId=${organizationId}`);
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        setCurrentPlan(currentData.plan);
        setCurrentSubscription(currentData.subscription);
        
        toast({
          title: 'Subscription Renewed',
          description: 'Your subscription has been renewed successfully.',
          variant: 'default',
        });
      }
    } catch (err: any) {
      console.error('Error renewing subscription:', err);
      toast({
        title: 'Error',
        description: err.message || 'An error occurred while renewing your subscription.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSubscriptionCancelled = async () => {
    // Refresh subscription data
    if (organizationId) {
      try {
        const currentResponse = await fetch(`/api/subscription/current?organizationId=${organizationId}`);
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          setCurrentPlan(currentData.plan);
          setCurrentSubscription(currentData.subscription);
          
          toast({
            title: 'Subscription Updated',
            description: 'Your subscription has been updated successfully.',
            variant: 'default',
          });
        }
      } catch (err) {
        console.error('Error refreshing subscription data:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription</h1>
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Subscription</h1>
        
        {currentPlan && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{currentPlan.name}</h3>
                  <p className="text-gray-500">
                    ${currentPlan.price}/{currentPlan.billing_interval}
                  </p>
                  {currentSubscription && (
                    <p className="text-sm text-gray-500 mt-1">
                      {currentSubscription.status === 'active' ? (
                        <>Active until {new Date(currentSubscription.current_period_end).toLocaleDateString()}</>
                      ) : currentSubscription.status === 'canceled' ? (
                        <span className="text-amber-600">Canceled - expires on {new Date(currentSubscription.current_period_end).toLocaleDateString()}</span>
                      ) : (
                        <span>{currentSubscription.status}</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {currentSubscription && currentSubscription.status === 'active' && !currentSubscription.cancel_at_period_end && (
                    <Button 
                      variant="outline" 
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                  {currentSubscription && currentSubscription.cancel_at_period_end && (
                    <Button 
                      variant="outline" 
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      onClick={handleRenewSubscription}
                    >
                      Renew Subscription
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/settings/subscription/billing-history')}
                  >
                    Billing History
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <SubscriptionPlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={currentPlan?.id === plan.id}
                onSelectPlan={handleSelectPlan}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No subscription plans available.</p>
        )}
        
        {features && Object.keys(features).length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Feature Access</h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feature
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Limit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(features).map(([key, { enabled, limit }]) => (
                    <tr key={key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {enabled ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Enabled
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {limit !== undefined ? (limit === Infinity ? 'Unlimited' : limit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Cancel Subscription Dialog */}
      {showCancelDialog && currentSubscription && currentPlan && (
        <CancelSubscriptionDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          subscriptionId={currentSubscription.id}
          organizationId={organizationId}
          planName={currentPlan.name}
          endDate={currentSubscription.current_period_end}
          onCancelled={handleSubscriptionCancelled}
        />
      )}
    </div>
  );
}

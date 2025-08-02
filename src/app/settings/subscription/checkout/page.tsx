'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubscriptionPlan, SubscriptionService } from '@/lib/services/subscription-service';

function SubscriptionCheckoutContent() {
  const [organizationId, setOrganizationId] = useState<string>('');
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams ? searchParams.get('plan') : null;

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
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again later.');
        setIsLoading(false);
      }
    };

    getOrgId();
  }, []);

  useEffect(() => {
    if (!organizationId || !planId) return;

    const fetchPlanDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const subscriptionService = new SubscriptionService();
        const { data, error } = await subscriptionService.getSubscriptionPlanById(planId);
        
        if (error || !data) {
          throw new Error('Failed to load subscription plan details');
        }
        
        setPlan(data);
      } catch (err) {
        console.error('Error fetching plan details:', err);
        setError('Failed to load subscription plan details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanDetails();
  }, [organizationId, planId]);

  const handleCheckout = async () => {
    if (!organizationId || !planId || !plan) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          planId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }
      
      setSuccess(true);
      
      // Redirect to subscription page after a short delay
      setTimeout(() => {
        router.push(`/settings/subscription?org=${organizationId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error during checkout:', err);
      setError(err.message || 'An unexpected error occurred during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription Checkout</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription Checkout</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <div className="mt-6">
            <button
              onClick={() => router.push('/settings/subscription')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Back to Subscription Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription Created</h1>
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success! </strong>
            <span className="block sm:inline">Your subscription has been created successfully.</span>
          </div>
          <div className="mt-6">
            <p className="text-gray-600 mb-4">You will be redirected to the subscription page shortly...</p>
            <button
              onClick={() => router.push(`/settings/subscription?org=${organizationId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Go to Subscription Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Subscription Checkout</h1>
        
        {plan && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="border-t border-b py-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{plan.name} Plan</span>
                <span>${plan.price}/{plan.billing_interval}</span>
              </div>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>
            
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${plan.price}/{plan.billing_interval}</span>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          <p className="text-gray-600 mb-4">
            By clicking "Complete Subscription", you agree to subscribe to the {plan?.name} plan at ${plan?.price}/{plan?.billing_interval}.
          </p>
          
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Complete Subscription'}
          </button>
          
          <button
            onClick={() => router.push('/settings/subscription')}
            disabled={isProcessing}
            className="w-full mt-4 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SubscriptionCheckoutContent />
    </Suspense>
  );
}

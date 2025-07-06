'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { getSubscriptionPlan } from '@/lib/subscription-plans';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [planId, setPlanId] = useState<string>('');
  
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      setPlanId(planParam);
    }
    
    // Redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [searchParams, router]);
  
  const plan = planId ? getSubscriptionPlan(planId) : null;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
          
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Subscription Successful!
          </h2>
          
          {plan ? (
            <p className="mt-2 text-gray-600">
              Thank you for subscribing to the {plan.name} plan.
            </p>
          ) : (
            <p className="mt-2 text-gray-600">
              Thank you for your subscription.
            </p>
          )}
          
          <div className="mt-6">
            <p className="text-sm text-gray-500">
              You will be redirected to your dashboard in a few seconds...
            </p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

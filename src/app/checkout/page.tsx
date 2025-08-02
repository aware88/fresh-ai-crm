'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getSubscriptionPlan, calculateTotalPrice } from '@/lib/subscription-plans';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [planId, setPlanId] = useState<string>('');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [userCount, setUserCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/checkout');
      return;
    }
    
    const planParam = searchParams.get('plan');
    const billingParam = searchParams.get('billing');
    
    if (planParam) {
      setPlanId(planParam);
    }
    
    if (billingParam === 'yearly' || billingParam === 'monthly') {
      setBillingInterval(billingParam);
    }
  }, [searchParams, status, router]);
  
  const plan = planId ? getSubscriptionPlan(planId) : null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan) {
      setError('Please select a valid plan');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // In a real implementation, this would create a checkout session with Stripe
      // For now, we'll just simulate a successful checkout
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to success page
      router.push('/checkout/success?plan=' + planId);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('An error occurred during checkout. Please try again.');
      setIsLoading(false);
    }
  };
  
  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Plan Not Found</h2>
              <p className="mt-2 text-gray-600">The selected plan is not available.</p>
              <button
                onClick={() => router.push('/pricing')}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Available Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const totalPrice = calculateTotalPrice(plan, userCount, billingInterval);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
            <p className="mt-2 text-gray-600">Complete your subscription to {plan.name}</p>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Subscription Summary</h3>
                <div className="mt-2 bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between">
                    <span className="text-gray-700">{plan.name} Plan</span>
                    <span className="font-medium">
                      ${billingInterval === 'yearly' ? plan.annualPrice : plan.monthlyPrice}/mo
                    </span>
                  </div>
                  
                  {plan.userLimit > 1 && (
                    <div className="mt-2">
                      <label htmlFor="userCount" className="block text-sm font-medium text-gray-700">
                        Number of Users
                      </label>
                      <select
                        id="userCount"
                        name="userCount"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={userCount}
                        onChange={(e) => setUserCount(parseInt(e.target.value))}
                      >
                        {Array.from({ length: Math.max(10, plan.userLimit) }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? 'user' : 'users'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>${totalPrice}/mo</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Billed {billingInterval === 'yearly' ? 'annually' : 'monthly'}
                      {billingInterval === 'yearly' && (
                        <span className="text-green-600 ml-1">
                          (Save {plan.annualSavingsPercent}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
                <div className="mt-2 bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">
                    This is a demo checkout page. In a real implementation, this would integrate with Stripe or another payment processor.
                  </p>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Processing...' : `Subscribe for $${totalPrice}/mo`}
                </button>
              </div>
              
              <div className="text-sm text-center text-gray-500">
                By subscribing, you agree to our{' '}
                <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckIcon } from '@/components/icons/HeroIcons';
import { subscriptionPlans, SubscriptionPlanDefinition, formatPrice } from '@/lib/subscription-plans';

export default function PricingPlans() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();
  const { data: session } = useSession();
  
  // Use all plans from the new 3-tier system
  const displayPlans = subscriptionPlans;

  const handleSelectPlan = (plan: SubscriptionPlanDefinition) => {
    if (!session) {
      // If not logged in, redirect to sign up
      router.push('/auth/signup');
      return;
    }

    if (plan.id === 'starter' || plan.id === 'pro') {
      // For free beta plans, just redirect to the dashboard
      router.push('/dashboard');
      return;
    }

    if (plan.id === 'premium') {
      // For premium plan, redirect to contact sales or checkout
      router.push('/contact-sales?plan=' + plan.id);
      return;
    }

    // For other plans, redirect to checkout
    router.push(`/checkout?plan=${plan.id}&billing=${billingInterval}`);
  };

  const getPrice = (plan: SubscriptionPlanDefinition) => {
    return billingInterval === 'yearly' ? plan.annualPrice : plan.monthlyPrice;
  };

  const getPlanFeatures = (plan: SubscriptionPlanDefinition) => {
    const features = [];
    for (const [key, value] of Object.entries(plan.features)) {
      if (typeof value === 'boolean' && value === true) {
        features.push(formatFeatureName(key));
      } else if (typeof value === 'number' && value > 0) {
        features.push(`${formatFeatureName(key)}: ${value === -1 ? 'Unlimited' : value}`);
      }
    }
    return features;
  };

  const formatFeatureName = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
      {/* Billing Interval Toggle */}
      <div className="flex justify-center mb-12">
        <div className="relative flex bg-gray-100 p-1 rounded-full">
          <button
            type="button"
            className={`${
              billingInterval === 'monthly'
                ? 'bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            } relative py-2 px-6 rounded-full text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10`}
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`${
              billingInterval === 'yearly'
                ? 'bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            } relative py-2 px-6 rounded-full text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10`}
            onClick={() => setBillingInterval('yearly')}
          >
            Yearly
            <span className="ml-1 text-xs text-green-500 font-semibold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {displayPlans.map((plan) => {
          // Skip premium tiers except the main one
          if (plan.id.startsWith('premium_')) return null;
          
          const price = getPrice(plan);
          const features = getPlanFeatures(plan);
          
          // Fixed pricing display for the subscription page
          let displayPrice = price;
          let originalPrice = null;
          
          // Starter plan: $19 with $0 current price
          if (plan.id === 'starter') {
            originalPrice = 19;
            displayPrice = 0;
          }
          
          // Pro plan: $29 monthly/$24 annual with $0 current price
          if (plan.id === 'pro') {
            originalPrice = billingInterval === 'yearly' ? 24 : 29;
            displayPrice = 0;
          }

          return (
            <div
              key={plan.id}
              className={`rounded-lg shadow-lg overflow-hidden ${
                plan.popular ? 'border-2 border-blue-500 transform scale-105 z-10' : 'border border-gray-200'
              }`}
            >
              {/* Plan Header */}
              <div className="px-6 py-8 bg-white">
                {plan.popular && (
                  <div className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full mb-4">
                    Most Popular
                  </div>
                )}
                {plan.badge && (
                  <div className="inline-block px-3 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full mb-4">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                <div className="mt-4 flex items-baseline">
                  {originalPrice !== null && (
                    <span className="line-through text-gray-400 mr-2">${originalPrice}</span>
                  )}
                  <span className="text-4xl font-extrabold text-gray-900">${displayPrice}</span>
                  <span className="ml-1 text-xl font-semibold text-gray-500">/{billingInterval === 'yearly' ? 'mo' : 'month'}</span>
                </div>
                {billingInterval === 'yearly' && plan.annualSavingsPercent > 0 && (
                  <p className="mt-1 text-sm text-green-600">Save {plan.annualSavingsPercent}% with annual billing</p>
                )}
                {plan.highlight && (
                  <p className="mt-3 text-sm text-blue-600 font-medium">{plan.highlight}</p>
                )}
              </div>

              {/* Feature List */}
              <div className="px-6 py-8 bg-gray-50">
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="ml-3 text-sm text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      plan.popular
                        ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        : 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                    }`}
                  >
                    {plan.id === 'premium' ? 'Contact Sales' : 'Get Started'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
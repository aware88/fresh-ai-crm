'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckIcon } from '@/components/icons/HeroIcons';
import { subscriptionPlans, SubscriptionPlanDefinition, calculateAnnualSavings } from '@/lib/subscription-plans';

export default function PricingPlans() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();
  const { data: session } = useSession();
  
  // Filter out plans that shouldn't be shown on the pricing page
  const displayPlans = subscriptionPlans.filter(plan => 
    plan.id !== 'pro-beta' // Don't show the beta plan in the regular pricing page
  );

  const handleSelectPlan = (plan: SubscriptionPlanDefinition) => {
    if (!session) {
      // If not logged in, redirect to sign up
      router.push('/auth/signup?plan=' + plan.id);
      return;
    }

    if (plan.id === 'free') {
      // For free plan, just redirect to the dashboard
      router.push('/dashboard');
      return;
    }

    if (plan.id === 'enterprise') {
      // For enterprise plan, redirect to contact sales
      router.push('/contact-sales?plan=' + plan.id);
      return;
    }

    // For other plans, redirect to checkout
    router.push(`/checkout?plan=${plan.id}&billing=${billingInterval}`);
  };

  return (
    <div className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that's right for you and your team
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-12 flex justify-center">
          <div className="relative flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              className={`${billingInterval === 'monthly' ? 'bg-white shadow-sm' : 'bg-transparent'} relative w-32 rounded-md py-2 text-sm font-medium text-gray-900 whitespace-nowrap focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              onClick={() => setBillingInterval('monthly')}
            >
              Monthly billing
            </button>
            <button
              type="button"
              className={`${billingInterval === 'yearly' ? 'bg-white shadow-sm' : 'bg-transparent'} relative w-32 rounded-md py-2 text-sm font-medium text-gray-900 whitespace-nowrap focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              onClick={() => setBillingInterval('yearly')}
            >
              Annual billing
              <span className="absolute -right-1 -top-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500 text-xs text-white items-center justify-center">💰</span>
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mt-12 space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0 lg:grid-cols-5 lg:gap-4">
          {displayPlans.map((plan) => {
            const price = billingInterval === 'yearly' ? plan.annualPrice : plan.monthlyPrice;
            const savings = billingInterval === 'yearly' ? calculateAnnualSavings(plan) : 0;
            const isPro = plan.id === 'pro';
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-lg shadow-lg overflow-hidden ${isPopular ? 'border-2 border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border border-gray-200'}`}
              >
                {isPopular && (
                  <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="px-6 py-8 bg-white sm:p-10 flex-grow">
                  <div>
                    {plan.badge && (
                      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold leading-5 text-blue-800">
                        {plan.badge}
                      </span>
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">
                      {plan.name}
                    </h3>
                    {plan.highlight && (
                      <p className="mt-1 text-sm text-blue-600">
                        {plan.highlight}
                      </p>
                    )}
                    <p className="mt-2 text-base text-gray-500">
                      {plan.description}
                    </p>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-extrabold tracking-tight text-gray-900">
                        ${price}
                      </span>
                      <span className="ml-1 text-xl font-semibold text-gray-500">
                        /mo
                      </span>
                    </div>
                    {billingInterval === 'yearly' && plan.annualSavingsPercent > 0 && (
                      <p className="mt-1 text-sm text-green-600">
                        Save {plan.annualSavingsPercent}% (${savings}/year)
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      {plan.userLimit === 1 
                        ? '1 user only' 
                        : `Up to ${plan.userLimit} users included`}
                    </p>
                    {plan.additionalUserPrice && (
                      <p className="text-sm text-gray-500">
                        ${plan.additionalUserPrice}/mo per additional user
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-6 pt-6 pb-8 bg-gray-50 sm:px-10">
                  <ul className="space-y-4">
                    {Object.entries(plan.features).map(([key, value]) => {
                      // Skip internal feature flags that shouldn't be displayed
                      if (key.startsWith('MAX_') || typeof value === 'number') return null;
                      if (value === false) return null;
                      
                      let label = key
                        .replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, l => l.toUpperCase());
                      
                      // Special case for contact limits
                      if (key === 'MAX_CONTACTS') {
                        const contactLimit = plan.features.MAX_CONTACTS as number;
                        label = contactLimit === -1 
                          ? 'Unlimited contacts' 
                          : `Up to ${contactLimit} contacts`;
                      }
                      
                      return (
                        <li key={key} className="flex items-start">
                          <div className="flex-shrink-0">
                            <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                          </div>
                          <p className="ml-3 text-base text-gray-700">{label}</p>
                        </li>
                      );
                    })}
                    
                    {/* Special case for contact limits */}
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        {(plan.features.MAX_CONTACTS as number) === -1 
                          ? 'Unlimited contacts' 
                          : `Up to ${plan.features.MAX_CONTACTS} contacts`}
                      </p>
                    </li>
                  </ul>
                  <div className="mt-8">
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`block w-full rounded-md px-4 py-3 text-center text-sm font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {plan.id === 'free' 
                        ? 'Start Free' 
                        : plan.id === 'enterprise'
                          ? 'Contact Sales'
                          : `Start ${plan.trialDays}-Day Trial`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="max-w-3xl mx-auto divide-y divide-gray-200">
            <div className="py-6">
              <h4 className="text-lg font-medium text-gray-900">Can I change plans later?</h4>
              <p className="mt-2 text-gray-600">Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate will apply at the start of your next billing cycle.</p>
            </div>
            <div className="py-6">
              <h4 className="text-lg font-medium text-gray-900">What happens when my trial ends?</h4>
              <p className="mt-2 text-gray-600">At the end of your trial period, your account will automatically convert to the selected plan and you'll be charged the plan price. You can cancel anytime before the trial ends to avoid charges.</p>
            </div>
            <div className="py-6">
              <h4 className="text-lg font-medium text-gray-900">Do you offer discounts for nonprofits or educational institutions?</h4>
              <p className="mt-2 text-gray-600">Yes, we offer special pricing for nonprofits, educational institutions, and startups. Please contact our sales team for more information.</p>
            </div>
            <div className="py-6">
              <h4 className="text-lg font-medium text-gray-900">What payment methods do you accept?</h4>
              <p className="mt-2 text-gray-600">We accept all major credit cards including Visa, Mastercard, American Express, and Discover. For Enterprise plans, we also offer invoicing options.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    
    // User limit
    if (plan.features.MAX_USERS === 1) {
      features.push('1 user included');
    } else if (plan.features.MAX_USERS === 5) {
      features.push('5 users included');
    } else if (plan.features.MAX_USERS === -1) {
      features.push('Unlimited users');
    }
    
    // Contact limit
    if (plan.features.MAX_CONTACTS === 500) {
      features.push('500 contacts limit');
    } else if (plan.features.MAX_CONTACTS === 5000) {
      features.push('5,000 contacts limit');
    } else if (plan.features.MAX_CONTACTS === -1) {
      features.push('Unlimited contacts');
    }
    
    // AI messages
    if (plan.features.AI_MESSAGES_LIMIT === 100) {
      features.push('100 AI messages/month');
    } else if (plan.features.AI_MESSAGES_LIMIT === 250) {
      features.push('250 AI messages/month');
    } else if (plan.features.AI_MESSAGES_LIMIT === -1) {
      features.push('Unlimited AI messages');
    }
    
    // Core features
    if (plan.features.PSYCHOLOGICAL_PROFILING) {
      features.push('Psychological profiling');
    }
    
    if (plan.features.CORE_AUTOMATION) {
      features.push('Core automation features');
    }
    
    if (plan.features.EMAIL_SUPPORT) {
      features.push('Email support');
    }
    
    // Advanced features
    if (plan.features.ADVANCED_PSYCHOLOGICAL_PROFILING) {
      features.push('Advanced psychological profiling');
    }
    
    if (plan.features.EMAIL_SYNC) {
      features.push('Full email sync (Gmail/Outlook)');
    }
    
    if (plan.features.ERP_INTEGRATION) {
      features.push('ERP integration (soon)');
    }
    
    if (plan.features.PRIORITY_SUPPORT) {
      features.push('Priority support');
    }
    
    if (plan.features.AI_CUSTOMIZATION) {
      features.push('AI customization & training');
    }
    
    if (plan.features.DEDICATED_SUCCESS_AGENT) {
      features.push('Dedicated success agent');
    }
    
    if (plan.features.CUSTOM_INTEGRATIONS) {
      features.push('Custom integrations');
    }
    
    if (plan.features.ADVANCED_ANALYTICS) {
      features.push('Advanced analytics');
    }
    
    if (plan.features.WHITE_LABEL) {
      features.push('White-label options');
    }
    
    return features;
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Start with our free beta and upgrade as your business grows. All plans include our core CRM features with advanced psychological profiling.
        </p>
        
        {/* Billing Toggle */}
        <div className="mt-16 flex justify-center">
          <fieldset className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200">
            <legend className="sr-only">Payment frequency</legend>
            <label
              className={`cursor-pointer rounded-full px-2.5 py-1 ${
                billingInterval === 'monthly' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-500'
              }`}
            >
              <input
                type="radio"
                name="frequency"
                value="monthly"
                className="sr-only"
                checked={billingInterval === 'monthly'}
                onChange={() => setBillingInterval('monthly')}
              />
              Monthly
            </label>
            <label
              className={`cursor-pointer rounded-full px-2.5 py-1 ${
                billingInterval === 'yearly' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-500'
              }`}
            >
              <input
                type="radio"
                name="frequency"
                value="yearly"
                className="sr-only"
                checked={billingInterval === 'yearly'}
                onChange={() => setBillingInterval('yearly')}
              />
              Yearly
            </label>
          </fieldset>
        </div>

        {/* Plans */}
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:max-w-4xl lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0">
          {displayPlans.map((plan, planIdx) => (
            <div
              key={plan.id}
              className={`flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 xl:p-10 ${
                plan.popular
                  ? 'ring-2 ring-indigo-600 relative'
                  : 'ring-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="rounded-full bg-indigo-600 px-4 py-1 text-sm font-medium text-white">
                    Most Popular Choice
                  </div>
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">
                    {plan.name}
                  </h3>
                  {plan.badge && (
                    <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                      {plan.badge}
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {plan.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {formatPrice(getPrice(plan))}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">
                    /month
                  </span>
                </p>
                {plan.highlight && (
                  <p className="mt-2 text-sm text-indigo-600 font-medium">
                    {plan.highlight}
                  </p>
                )}
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {getPlanFeatures(plan).map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={() => handleSelectPlan(plan)}
                className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  plan.popular
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600'
                    : 'text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300 focus-visible:outline-indigo-600'
                }`}
              >
                {plan.id === 'starter' || plan.id === 'pro' ? 'Join Beta - Free' : 
                 plan.id === 'premium' ? 'Contact Sales' : 'Get started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

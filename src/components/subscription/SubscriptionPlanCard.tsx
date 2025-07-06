'use client';

import { useState } from 'react';
import { SubscriptionPlan } from '@/lib/services/subscription-service';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onSelectPlan?: (plan: SubscriptionPlan) => void;
}

export default function SubscriptionPlanCard({
  plan,
  isCurrentPlan = false,
  onSelectPlan,
}: SubscriptionPlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async () => {
    if (!onSelectPlan) return;
    
    setIsLoading(true);
    try {
      await onSelectPlan(plan);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse features from the JSON
  const features = Object.entries(plan.features || {}).map(([key, value]) => {
    if (typeof value === 'boolean') {
      return { name: formatFeatureName(key), included: value };
    } else if (typeof value === 'number') {
      return { name: formatFeatureName(key), limit: value };
    }
    return { name: formatFeatureName(key), included: false };
  });

  return (
    <div className={`border rounded-lg p-6 ${isCurrentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{plan.name}</h3>
        {isCurrentPlan && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Current Plan
          </span>
        )}
      </div>
      
      <div className="mb-6">
        <span className="text-3xl font-bold">${plan.price}</span>
        <span className="text-gray-500">/{plan.billing_interval}</span>
      </div>
      
      {plan.description && (
        <p className="text-gray-600 mb-6">{plan.description}</p>
      )}
      
      <div className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-green-500">
              {feature.included !== false ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="ml-2 text-gray-600">
              {feature.name}
              {feature.limit !== undefined && ` (${feature.limit === Infinity ? 'Unlimited' : feature.limit})`}
            </span>
          </div>
        ))}
      </div>
      
      {onSelectPlan && !isCurrentPlan && (
        <button
          onClick={handleSelectPlan}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Select Plan'}
        </button>
      )}
      
      {isCurrentPlan && (
        <button
          className="w-full py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          disabled
        >
          Current Plan
        </button>
      )}
    </div>
  );
}

// Helper function to format feature keys into readable names
function formatFeatureName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

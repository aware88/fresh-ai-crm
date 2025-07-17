/**
 * Subscription Plans Configuration
 * 
 * This file defines the subscription plans available in ARIS.
 * Each plan includes pricing, features, and limits that determine what users can access.
 */

export interface SubscriptionPlanDefinition {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number; // Price per month when billed annually
  annualSavingsPercent: number;
  badge?: string;
  highlight?: string;
  popular?: boolean;
  features: {
    [key: string]: boolean | number | string;
  };
  trialDays: number;
  userLimit: number;
  additionalUserPrice?: number;
  minimumUsers?: number;
  isOrganizationPlan?: boolean;
}

/**
 * Simplified 3-tier subscription plans matching the landing page
 */
export const subscriptionPlans: SubscriptionPlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for Solo Entrepreneurs',
    monthlyPrice: 0, // Free during beta (will be $19 post-beta)
    annualPrice: 0,
    annualSavingsPercent: 0,
    badge: 'FREE BETA',
    highlight: 'Best for early-stage founders',
    popular: false,
    features: {
      MAX_USERS: 1,
      MAX_CONTACTS: 500,
      AI_MESSAGES_LIMIT: 100,
      PSYCHOLOGICAL_PROFILING: true,
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      ADVANCED_PSYCHOLOGICAL_PROFILING: false,
      EMAIL_SYNC: false,
      ERP_INTEGRATION: false,
      PRIORITY_SUPPORT: false,
      PHONE_SUPPORT: false,
      DEDICATED_SUCCESS_AGENT: false,
      CUSTOM_INTEGRATIONS: false,
      ADVANCED_ANALYTICS: false,
      WHITE_LABEL: false,
      AI_CUSTOMIZATION: false,
      MOBILE_APP_ACCESS: true
    },
    trialDays: 0,
    userLimit: 1,
    isOrganizationPlan: false
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Perfect for growing teams',
    monthlyPrice: 0, // Free during beta (will be $59 post-beta)
    annualPrice: 0,
    annualSavingsPercent: 0,
    badge: 'FREE BETA',
    highlight: 'Most Popular Choice',
    popular: true,
    features: {
      MAX_USERS: 5,
      MAX_CONTACTS: 5000,
      AI_MESSAGES_LIMIT: 250,
      PSYCHOLOGICAL_PROFILING: true,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
      EMAIL_SYNC: true,
      ERP_INTEGRATION: true,
      PRIORITY_SUPPORT: true,
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      PHONE_SUPPORT: false,
      DEDICATED_SUCCESS_AGENT: false,
      CUSTOM_INTEGRATIONS: false,
      ADVANCED_ANALYTICS: false,
      WHITE_LABEL: false,
      AI_CUSTOMIZATION: false,
      MOBILE_APP_ACCESS: true
    },
    trialDays: 0,
    userLimit: 5,
    isOrganizationPlan: false
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Built for sales-led organizations',
    monthlyPrice: 197,
    annualPrice: 157, // 20% discount when billed annually
    annualSavingsPercent: 20,
    badge: 'ENTERPRISE',
    highlight: 'Complete Sales Intelligence',
    popular: false,
    features: {
      MAX_USERS: -1, // Unlimited
      MAX_CONTACTS: -1, // Unlimited
      AI_MESSAGES_LIMIT: -1, // Unlimited
      PSYCHOLOGICAL_PROFILING: true,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
      AI_CUSTOMIZATION: true,
      DEDICATED_SUCCESS_AGENT: true,
      CUSTOM_INTEGRATIONS: true,
      ADVANCED_ANALYTICS: true,
      WHITE_LABEL: true,
      EMAIL_SYNC: true,
      ERP_INTEGRATION: true,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: true,
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      MOBILE_APP_ACCESS: true
    },
    trialDays: 14,
    userLimit: -1, // Unlimited
    isOrganizationPlan: true
  }
];

/**
 * Get a subscription plan by ID
 */
export function getSubscriptionPlan(planId: string): SubscriptionPlanDefinition | null {
  return subscriptionPlans.find(plan => plan.id === planId) || null;
}

/**
 * Get plans available for individuals (non-organization users)
 */
export function getIndividualPlans(): SubscriptionPlanDefinition[] {
  return subscriptionPlans.filter(plan => !plan.isOrganizationPlan);
}

/**
 * Get plans available for organizations
 */
export function getOrganizationPlans(): SubscriptionPlanDefinition[] {
  return subscriptionPlans.filter(plan => plan.isOrganizationPlan);
}

/**
 * Calculate annual savings amount
 */
export function calculateAnnualSavings(plan: SubscriptionPlanDefinition): number {
  if (plan.annualSavingsPercent === 0) return 0;
  const monthlyCost = plan.monthlyPrice * 12;
  const annualCost = plan.annualPrice * 12;
  return monthlyCost - annualCost;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get the most popular plan
 */
export function getPopularPlan(): SubscriptionPlanDefinition | null {
  return subscriptionPlans.find(plan => plan.popular) || null;
}

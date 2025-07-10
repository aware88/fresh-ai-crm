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
}

/**
 * Default subscription plans
 */
export const subscriptionPlans: SubscriptionPlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    annualPrice: 0,
    annualSavingsPercent: 0,
    badge: 'FOREVER FREE',
    highlight: 'No Credit Card Required',
    popular: false,
    features: {
      MAX_USERS: 1,
      MAX_CONTACTS: 25,
      BASIC_DISC_INSIGHTS: true,
      ADVANCED_DISC_PROFILING: false,
      BASIC_AUTOMATION: false,
      TEAM_COLLABORATION: false,
      ADVANCED_ANALYTICS: false,
      CUSTOM_INTEGRATIONS: false,
      ENTERPRISE_SECURITY: false,
      PRIORITY_SUPPORT: false,
      PHONE_SUPPORT: false,
      DEDICATED_MANAGER: false,
      EMAIL_SUPPORT: true,
      MOBILE_APP_ACCESS: true
    },
    trialDays: 0, // No trial for free plan
    userLimit: 1
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal for solopreneurs',
    monthlyPrice: 18,
    annualPrice: 14, // Monthly price when billed annually
    annualSavingsPercent: 22,
    highlight: 'Most Popular for Individuals',
    popular: false,
    features: {
      MAX_USERS: 1,
      MAX_CONTACTS: 500,
      BASIC_DISC_INSIGHTS: true,
      ADVANCED_DISC_PROFILING: true,
      BASIC_AUTOMATION: true,
      TEAM_COLLABORATION: false,
      ADVANCED_ANALYTICS: false,
      CUSTOM_INTEGRATIONS: false,
      ENTERPRISE_SECURITY: false,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: false,
      DEDICATED_MANAGER: false,
      EMAIL_SUPPORT: true,
      MOBILE_APP_ACCESS: true
    },
    trialDays: 14,
    userLimit: 1
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Perfect for small teams',
    monthlyPrice: 49,
    annualPrice: 39, // Monthly price when billed annually
    annualSavingsPercent: 20,
    badge: 'FREE BETA',
    highlight: '⚡ 40% Higher Close Rates',
    popular: true,
    features: {
      MAX_USERS: 5,
      MAX_CONTACTS: -1, // Unlimited
      BASIC_DISC_INSIGHTS: true,
      ADVANCED_DISC_PROFILING: true,
      BASIC_AUTOMATION: true,
      TEAM_COLLABORATION: true,
      ADVANCED_ANALYTICS: false,
      CUSTOM_INTEGRATIONS: false,
      ENTERPRISE_SECURITY: false,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: false,
      DEDICATED_MANAGER: false,
      EMAIL_SUPPORT: true,
      MOBILE_APP_ACCESS: true,
      AI_GENERATION_LIMIT: -1 // Unlimited
    },
    trialDays: 14,
    userLimit: 5
  },
  {
    id: 'pro-beta',
    name: 'Pro (Beta)',
    description: 'Perfect for small teams',
    monthlyPrice: 0, // Free during beta
    annualPrice: 0, // Free during beta
    annualSavingsPercent: 0,
    badge: 'FREE BETA',
    highlight: '⚡ 40% Higher Close Rates',
    popular: true,
    features: {
      MAX_USERS: 5,
      MAX_CONTACTS: -1, // Unlimited
      BASIC_DISC_INSIGHTS: true,
      ADVANCED_DISC_PROFILING: true,
      BASIC_AUTOMATION: true,
      TEAM_COLLABORATION: true,
      ADVANCED_ANALYTICS: false,
      CUSTOM_INTEGRATIONS: false,
      ENTERPRISE_SECURITY: false,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: false,
      DEDICATED_MANAGER: false,
      EMAIL_SUPPORT: true,
      MOBILE_APP_ACCESS: true,
      AI_GENERATION_LIMIT: -1 // Unlimited
    },
    trialDays: 0, // No trial for beta
    userLimit: 5
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Built for growing companies',
    monthlyPrice: 99,
    annualPrice: 79, // Monthly price when billed annually
    annualSavingsPercent: 20,
    highlight: 'Scale Your Team Efficiently',
    popular: false,
    features: {
      MAX_USERS: 10, // Base users, additional at $15/month
      MAX_CONTACTS: -1, // Unlimited
      BASIC_DISC_INSIGHTS: true,
      ADVANCED_DISC_PROFILING: true,
      BASIC_AUTOMATION: true,
      TEAM_COLLABORATION: true,
      ADVANCED_ANALYTICS: true,
      CUSTOM_INTEGRATIONS: true,
      ENTERPRISE_SECURITY: false,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: true,
      DEDICATED_MANAGER: false,
      EMAIL_SUPPORT: true,
      MOBILE_APP_ACCESS: true,
      AI_GENERATION_LIMIT: -1 // Unlimited
    },
    trialDays: 14,
    userLimit: 10,
    additionalUserPrice: 15
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 197,
    annualPrice: 157, // Monthly price when billed annually
    annualSavingsPercent: 20,
    badge: 'CUSTOM',
    highlight: 'Enterprise-Grade Security',
    popular: false,
    features: {
      MAX_USERS: 20, // Minimum users, custom pricing
      MAX_CONTACTS: -1, // Unlimited
      BASIC_DISC_INSIGHTS: true,
      ADVANCED_DISC_PROFILING: true,
      BASIC_AUTOMATION: true,
      TEAM_COLLABORATION: true,
      ADVANCED_ANALYTICS: true,
      CUSTOM_INTEGRATIONS: true,
      ENTERPRISE_SECURITY: true,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: true,
      DEDICATED_MANAGER: true,
      EMAIL_SUPPORT: true,
      MOBILE_APP_ACCESS: true,
      AI_GENERATION_LIMIT: -1, // Unlimited
      SLA_GUARANTEES: true,
      COMPLIANCE_FEATURES: true
    },
    trialDays: 0, // Custom sales process, no trial
    userLimit: 20,
    minimumUsers: 20
  }
];

/**
 * Get a subscription plan by ID
 * @param planId The ID of the plan to retrieve
 */
export function getSubscriptionPlan(planId: string): SubscriptionPlanDefinition | undefined {
  return subscriptionPlans.find(plan => plan.id === planId);
}

/**
 * Get all active subscription plans (excluding special plans like beta)
 */
export function getActiveSubscriptionPlans(): SubscriptionPlanDefinition[] {
  // Filter out special plans like pro-beta that shouldn't be shown in the regular plan selection
  return subscriptionPlans.filter(plan => plan.id !== 'pro-beta');
}

/**
 * Calculate the annual savings amount
 * @param plan The subscription plan
 */
export function calculateAnnualSavings(plan: SubscriptionPlanDefinition): number {
  if (plan.monthlyPrice === 0 || plan.annualPrice === 0) return 0;
  return Math.round((plan.monthlyPrice - plan.annualPrice) * 12);
}

/**
 * Calculate the price for additional users
 * @param plan The subscription plan
 * @param userCount The total number of users
 */
export function calculateAdditionalUserPrice(plan: SubscriptionPlanDefinition, userCount: number): number {
  if (!plan.additionalUserPrice || userCount <= plan.userLimit) return 0;
  
  const additionalUsers = userCount - plan.userLimit;
  return additionalUsers * (plan.additionalUserPrice || 0);
}

/**
 * Calculate the total price for a subscription
 * @param plan The subscription plan
 * @param userCount The total number of users
 * @param billingInterval The billing interval ('monthly' or 'yearly')
 */
export function calculateTotalPrice(
  plan: SubscriptionPlanDefinition,
  userCount: number,
  billingInterval: 'monthly' | 'yearly'
): number {
  const basePrice = billingInterval === 'yearly' ? plan.annualPrice : plan.monthlyPrice;
  const additionalUserPrice = calculateAdditionalUserPrice(plan, userCount);
  
  return basePrice + additionalUserPrice;
}

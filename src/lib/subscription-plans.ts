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
 * 5-tier subscription plans aligned with landing page structure
 * Based on research of successful SaaS pricing strategies
 */
export const subscriptionPlans: SubscriptionPlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for Solo Entrepreneurs',
    monthlyPrice: 0, // Free during beta
    annualPrice: 0,
    annualSavingsPercent: 0,
    badge: 'FREE',
    highlight: 'Always Free',
    popular: false,
    features: {
      MAX_USERS: 1,
      MAX_CONTACTS: -1, // Unlimited contacts
      AI_MESSAGES_LIMIT: 300, // Enough to see value, creates upgrade pressure
      PSYCHOLOGICAL_PROFILING: true, // KEY DIFFERENTIATOR - let them taste it
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true,
      // INCLUDE VALUE FEATURES (let them get hooked)
      AI_FUTURE_ACCESS: true, // Wow factor - but limited by message count
      WHATSAPP_INTEGRATION: true, // Modern expectation
      CRM_ASSISTANT: true, // Core value proposition
      SALES_TACTICS: true, // Part of psychological profiling
      PERSONALITY_INSIGHTS: true, // Part of psychological profiling  
      AI_DRAFTING_ASSISTANCE: true, // Core AI value
      TEAM_COLLABORATION: true, // But limited by 1 user
      FOLLOWUP_SYSTEM: true, // CORE FEATURE - let them see the magic
      UPSELL_SYSTEM: true, // Revenue-generating feature
      // RESTRICT ENTERPRISE FEATURES (clear upgrade path)
      ADVANCED_PSYCHOLOGICAL_PROFILING: false, // Pro feature
      ERP_INTEGRATION: false, // Enterprise feature
      PRIORITY_SUPPORT: false, // Support tier
      PHONE_SUPPORT: false, // Support tier
      DEDICATED_SUCCESS_AGENT: false, // Enterprise feature
      CUSTOM_INTEGRATIONS: false, // Enterprise feature
      WHITE_LABEL: false, // Enterprise feature
      AI_CUSTOMIZATION: false, // Enterprise feature
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
    monthlyPrice: 29,
    annualPrice: 24,
    annualSavingsPercent: 17,
    badge: 'MOST POPULAR',
    highlight: 'Best Value',
    popular: true,
    features: {
      MAX_USERS: 3,
      MAX_CONTACTS: -1, // Unlimited contacts
      AI_MESSAGES_LIMIT: 500, // 500 total messages shared across team
      PSYCHOLOGICAL_PROFILING: true, // Full psychological profiling
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true,
      PRIORITY_SUPPORT: true,
      // Pro-exclusive features
      CRM_ASSISTANT: true, // CRM Assistant included
      SALES_TACTICS: true, // Sales tactics and psychology enabled
      PERSONALITY_INSIGHTS: true, // Personality insights enabled
      AI_DRAFTING_ASSISTANCE: true, // AI drafting assistance enabled
      AI_FUTURE_ACCESS: true,
      WHATSAPP_INTEGRATION: true,
      AI_FUTURE_MESSAGES_LIMIT: 500,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
      TEAM_COLLABORATION: true, // Team collaboration available in Pro
      FOLLOWUP_SYSTEM: true, // Advanced follow-up system
      UPSELL_SYSTEM: true, // Basic upsell system
      // Premium features still disabled
      ERP_INTEGRATION: false,
      PHONE_SUPPORT: false,
      DEDICATED_SUCCESS_AGENT: false,
      CUSTOM_INTEGRATIONS: false,
      ADVANCED_ANALYTICS: false,
      WHITE_LABEL: false,
      AI_CUSTOMIZATION: false,
      MOBILE_APP_ACCESS: true
    },
    trialDays: 0,
    userLimit: 3,
    isOrganizationPlan: false
  },
  {
    id: 'premium-basic',
    name: 'Premium Basic',
    description: 'Team Scale',
    monthlyPrice: 97,
    annualPrice: 77,
    annualSavingsPercent: 20,
    badge: 'TEAM SCALE',
    highlight: 'For Growing Teams',
    popular: false,
    features: {
      MAX_USERS: 10,
      MAX_CONTACTS: -1, // Unlimited contacts
      AI_MESSAGES_LIMIT: 5000, // 5,000 total messages for all team
      PSYCHOLOGICAL_PROFILING: true,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true,
      PRIORITY_SUPPORT: true,
      // All Pro features included
      CRM_ASSISTANT: true,
      SALES_TACTICS: true,
      PERSONALITY_INSIGHTS: true,
      AI_DRAFTING_ASSISTANCE: true,
      AI_FUTURE_ACCESS: true,
      WHATSAPP_INTEGRATION: true,
      AI_FUTURE_MESSAGES_LIMIT: 5000,
      TEAM_COLLABORATION: true,
      FOLLOWUP_SYSTEM: true,
      UPSELL_SYSTEM: true,
      // Premium Basic features
      ERP_INTEGRATION: true, // Metakocka integration
      // Still disabled features
      PHONE_SUPPORT: false,
      DEDICATED_SUCCESS_AGENT: false,
      CUSTOM_INTEGRATIONS: false,
      WHITE_LABEL: false,
      AI_CUSTOMIZATION: false,
      MOBILE_APP_ACCESS: true
    },
    trialDays: 14,
    userLimit: 10,
    isOrganizationPlan: true
  },
  {
    id: 'premium-advanced',
    name: 'Premium Advanced',
    description: 'Best Value',
    monthlyPrice: 147,
    annualPrice: 117,
    annualSavingsPercent: 20,
    badge: 'BEST VALUE',
    highlight: 'Most Popular Enterprise',
    popular: false,
    features: {
      MAX_USERS: 50,
      MAX_CONTACTS: -1, // Unlimited contacts
      AI_MESSAGES_LIMIT: 15000, // 15,000 total messages for all team
      PSYCHOLOGICAL_PROFILING: true,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true,
      PRIORITY_SUPPORT: true,
      // All previous features included
      CRM_ASSISTANT: true,
      SALES_TACTICS: true,
      PERSONALITY_INSIGHTS: true,
      AI_DRAFTING_ASSISTANCE: true,
      AI_FUTURE_ACCESS: true,
      WHATSAPP_INTEGRATION: true,
      AI_FUTURE_MESSAGES_LIMIT: 15000,
      TEAM_COLLABORATION: true,
      FOLLOWUP_SYSTEM: true,
      UPSELL_SYSTEM: true,
      ERP_INTEGRATION: true,
      // Premium Advanced features
      CUSTOM_INTEGRATIONS: true,
      WHITE_LABEL: true,
      AI_CUSTOMIZATION: true,
      // Still disabled features
      PHONE_SUPPORT: false,
      DEDICATED_SUCCESS_AGENT: false,
      MOBILE_APP_ACCESS: true
    },
    trialDays: 14,
    userLimit: 50,
    isOrganizationPlan: true
  },
  {
    id: 'premium-enterprise',
    name: 'Premium Enterprise',
    description: 'Enterprise',
    monthlyPrice: 297,
    annualPrice: 237,
    annualSavingsPercent: 20,
    badge: 'ENTERPRISE',
    highlight: 'Complete Solution',
    popular: false,
    features: {
      MAX_USERS: -1, // 100+ (unlimited)
      MAX_CONTACTS: -1, // Unlimited contacts
      AI_MESSAGES_LIMIT: -1, // Unlimited
      PSYCHOLOGICAL_PROFILING: true,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: true,
      // All previous features included
      CRM_ASSISTANT: true,
      SALES_TACTICS: true,
      PERSONALITY_INSIGHTS: true,
      AI_DRAFTING_ASSISTANCE: true,
      AI_FUTURE_ACCESS: true,
      WHATSAPP_INTEGRATION: true,
      AI_FUTURE_MESSAGES_LIMIT: -1,
      AI_FUTURE_PRIORITY_SUPPORT: true,
      TEAM_COLLABORATION: true,
      FOLLOWUP_SYSTEM: true,
      UPSELL_SYSTEM: true,
      ERP_INTEGRATION: true,
      CUSTOM_INTEGRATIONS: true,
      WHITE_LABEL: true,
      AI_CUSTOMIZATION: true,
      // Enterprise exclusive features
      DEDICATED_SUCCESS_AGENT: true,
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

/**
 * Calculate total price for a subscription plan
 */
export function calculateTotalPrice(
  plan: SubscriptionPlanDefinition,
  userCount: number = 1,
  billingInterval: 'monthly' | 'annual' = 'monthly'
): number {
  const basePrice = billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  
  // If plan has unlimited users, just return base price
  if (plan.userLimit === -1) {
    return basePrice;
  }
  
  // Calculate additional user costs if applicable
  let totalPrice = basePrice;
  
  if (userCount > plan.userLimit && plan.additionalUserPrice) {
    const additionalUsers = userCount - plan.userLimit;
    totalPrice += additionalUsers * plan.additionalUserPrice;
  }
  
  return totalPrice;
}

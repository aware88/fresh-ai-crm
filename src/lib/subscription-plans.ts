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
 * Optimized 3-tier subscription plans for maximum user acquisition and conversion
 * Based on research of successful SaaS pricing strategies
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
    highlight: 'Always Free',
    popular: false,
    features: {
      MAX_USERS: 1,
      MAX_CONTACTS: -1, // Unlimited contacts to remove friction
      AI_MESSAGES_LIMIT: 50, // Reduced to create upgrade pressure
      PSYCHOLOGICAL_PROFILING: false, // No psychological profiling - basic AI only
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true, // Available in Starter to add value
      // Premium features disabled
      AI_FUTURE_ACCESS: false,
      WHATSAPP_INTEGRATION: false,
      ADVANCED_PSYCHOLOGICAL_PROFILING: false,
      ERP_INTEGRATION: false,
      PRIORITY_SUPPORT: false,
      PHONE_SUPPORT: false,
      DEDICATED_SUCCESS_AGENT: false,
      CUSTOM_INTEGRATIONS: false,
      ADVANCED_ANALYTICS: false,
      WHITE_LABEL: false,
      AI_CUSTOMIZATION: false,
      MOBILE_APP_ACCESS: true,
      CRM_ASSISTANT: false, // No CRM Assistant in Starter
      SALES_TACTICS: false, // No sales tactics/psychology in Starter
      PERSONALITY_INSIGHTS: false, // No personality insights in Starter
      AI_DRAFTING_ASSISTANCE: false, // No AI drafting assistance in Starter
      TEAM_COLLABORATION: false // No team collaboration in Starter
    },
    trialDays: 0,
    userLimit: 1,
    isOrganizationPlan: false
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Perfect for growing teams',
    monthlyPrice: 29, // $29 USD monthly
    annualPrice: 24, // $24 USD monthly when billed annually
    annualSavingsPercent: 17, // ~17% savings (24*12 vs 29*12)
    badge: 'MOST POPULAR',
    highlight: 'Best Value',
    popular: true,
    features: {
      MAX_USERS: 5,
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
      // Premium features still disabled
      ERP_INTEGRATION: false, // Only for organizations
      PHONE_SUPPORT: false,
      DEDICATED_SUCCESS_AGENT: false,
      CUSTOM_INTEGRATIONS: false,
      ADVANCED_ANALYTICS: false,
      WHITE_LABEL: false,
      AI_CUSTOMIZATION: false,
      MOBILE_APP_ACCESS: true,
      TEAM_COLLABORATION: true // Team collaboration available in Pro
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
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: true,
      // All Pro features included
      CRM_ASSISTANT: true,
      SALES_TACTICS: true,
      PERSONALITY_INSIGHTS: true,
      AI_DRAFTING_ASSISTANCE: true,
      AI_FUTURE_ACCESS: true,
      WHATSAPP_INTEGRATION: true,
      AI_FUTURE_MESSAGES_LIMIT: -1,
      AI_FUTURE_PRIORITY_SUPPORT: true,
      // Premium-exclusive features
      ERP_INTEGRATION: true, // Metakocka integration
      DEDICATED_SUCCESS_AGENT: true,
      CUSTOM_INTEGRATIONS: true,
      ADVANCED_ANALYTICS: true,
      WHITE_LABEL: true,
      AI_CUSTOMIZATION: true,
      MOBILE_APP_ACCESS: true,
      TEAM_COLLABORATION: true // Team collaboration available in Premium
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

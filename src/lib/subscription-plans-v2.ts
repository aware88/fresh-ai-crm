/**
 * Updated Subscription Plans Configuration V2
 * 
 * This file defines the improved subscription plans with:
 * - Corrected pricing (Pro €29/€24)
 * - Tiered Premium plans
 * - Top-up system support
 */

/**
 * Format price in USD currency
 */
export function formatPriceEUR(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}



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
  premiumTier?: 'basic' | 'advanced' | 'enterprise'; // For Premium plan tiers
}

export interface TopUpPackage {
  id: string;
  name: string;
  description: string;
  messages: number;
  priceUsd: number;
  pricePerMessage: number;
  discountPercent?: number;
  popular?: boolean;
}

/**
 * AI Message Top-Up Packages
 */
export const topUpPackages: TopUpPackage[] = [
  {
    id: 'topup_100',
    name: '100 Messages',
    description: 'Perfect for light usage',
    messages: 100,
    priceUsd: 5,
    pricePerMessage: 0.05,
    popular: false
  },
  {
    id: 'topup_500',
    name: '500 Messages',
    description: 'Great for regular usage',
    messages: 500,
    priceUsd: 20,
    pricePerMessage: 0.04,
    discountPercent: 20,
    popular: true
  },
  {
    id: 'topup_1000',
    name: '1000 Messages',
    description: 'Best value for heavy usage',
    messages: 1000,
    priceUsd: 35,
    pricePerMessage: 0.035,
    discountPercent: 30,
    popular: false
  }
];

/**
 * Updated subscription plans with improved pricing
 */
export const subscriptionPlans: SubscriptionPlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for Solo Entrepreneurs',
    monthlyPrice: 0, // Always free
    annualPrice: 0,
    annualSavingsPercent: 0,
    badge: 'ALWAYS FREE',
    highlight: 'Great to get started',
    popular: false,
    features: {
      MAX_USERS: 1,
      MAX_CONTACTS: -1, // Unlimited contacts to remove friction
      AI_MESSAGES_LIMIT: 50, // Reduced to create upgrade pressure
      PSYCHOLOGICAL_PROFILING: false, // No psychological profiling - basic AI only
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true, // Available in Starter to add value
      TOPUP_AVAILABLE: true, // Can buy top-ups
      TOPUP_PRICE_PER_MESSAGE: 0.05, // €0.05 per message in top-ups
      // Premium features disabled
      AI_FUTURE_ACCESS: false,
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
      CRM_ASSISTANT: false,
      SALES_TACTICS: false,
      PERSONALITY_INSIGHTS: false,
      AI_DRAFTING_ASSISTANCE: false,
      TEAM_COLLABORATION: false
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
    annualSavingsPercent: 17, // $29 -> $24 is 17% savings
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
      TOPUP_AVAILABLE: true, // Can buy top-ups
      TOPUP_PRICE_PER_MESSAGE: 0.04, // €0.04 per message in top-ups (better rate)
      // Pro-exclusive features
      CRM_ASSISTANT: true,
      SALES_TACTICS: true,
      PERSONALITY_INSIGHTS: true,
      AI_DRAFTING_ASSISTANCE: true,
      TEAM_COLLABORATION: true,
      AI_FUTURE_ACCESS: true,
      AI_FUTURE_MESSAGES_LIMIT: 500,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
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
    userLimit: 5,
    isOrganizationPlan: false
  },
  // Premium Basic Tier
  {
    id: 'premium_basic',
    name: 'Premium Basic',
    description: 'Perfect for medium businesses',
    monthlyPrice: 197,
    annualPrice: 157, // 20% discount when billed annually
    annualSavingsPercent: 20,
    badge: 'ENTERPRISE',
    highlight: 'Best for growing companies',
    popular: false,
    premiumTier: 'basic',
    features: {
      MAX_USERS: 20, // 20 users limit
      MAX_CONTACTS: -1, // Unlimited contacts
      AI_MESSAGES_LIMIT: 5000, // 5,000 AI messages/month
      PSYCHOLOGICAL_PROFILING: true,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: true,
      TOPUP_AVAILABLE: true,
      TOPUP_PRICE_PER_MESSAGE: 0.035, // €0.035 per message (best rate)
      // All Pro features included
      CRM_ASSISTANT: true,
      SALES_TACTICS: true,
      PERSONALITY_INSIGHTS: true,
      AI_DRAFTING_ASSISTANCE: true,
      TEAM_COLLABORATION: true,
      AI_FUTURE_ACCESS: true,
      AI_FUTURE_MESSAGES_LIMIT: 5000,
      AI_FUTURE_PRIORITY_SUPPORT: true,
      // Premium features
      ERP_INTEGRATION: true, // Metakocka integration
      ADVANCED_ANALYTICS: true,
      CUSTOM_INTEGRATIONS: false, // Not in basic tier
      WHITE_LABEL: false, // Not in basic tier
      AI_CUSTOMIZATION: false, // Not in basic tier
      DEDICATED_SUCCESS_AGENT: false, // Not in basic tier
      MOBILE_APP_ACCESS: true
    },
    trialDays: 14,
    userLimit: 20,
    additionalUserPrice: 15, // €15 per additional user per month
    isOrganizationPlan: true
  },
  // Premium Advanced Tier
  {
    id: 'premium_advanced',
    name: 'Premium Advanced',
    description: 'Perfect for large teams',
    monthlyPrice: 297,
    annualPrice: 237, // 20% discount when billed annually
    annualSavingsPercent: 20,
    badge: 'ENTERPRISE',
    highlight: 'Advanced features',
    popular: false,
    premiumTier: 'advanced',
    features: {
      MAX_USERS: 50, // 50 users limit
      MAX_CONTACTS: -1,
      AI_MESSAGES_LIMIT: 15000, // 15,000 AI messages/month
      PSYCHOLOGICAL_PROFILING: true,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: true,
      TOPUP_AVAILABLE: true,
      TOPUP_PRICE_PER_MESSAGE: 0.03, // €0.03 per message (premium rate)
      // All Pro features
      CRM_ASSISTANT: true,
      SALES_TACTICS: true,
      PERSONALITY_INSIGHTS: true,
      AI_DRAFTING_ASSISTANCE: true,
      TEAM_COLLABORATION: true,
      AI_FUTURE_ACCESS: true,
      AI_FUTURE_MESSAGES_LIMIT: 15000,
      AI_FUTURE_PRIORITY_SUPPORT: true,
      // Advanced Premium features
      ERP_INTEGRATION: true,
      ADVANCED_ANALYTICS: true,
      CUSTOM_INTEGRATIONS: true, // Available in advanced
      WHITE_LABEL: true, // Available in advanced
      AI_CUSTOMIZATION: true, // Available in advanced
      DEDICATED_SUCCESS_AGENT: true, // Available in advanced
      MOBILE_APP_ACCESS: true
    },
    trialDays: 14,
    userLimit: 50,
    additionalUserPrice: 12, // €12 per additional user per month
    isOrganizationPlan: true
  },
  // Premium Enterprise Tier
  {
    id: 'premium_enterprise',
    name: 'Premium Enterprise',
    description: 'Perfect for large organizations',
    monthlyPrice: 497,
    annualPrice: 397, // 20% discount when billed annually
    annualSavingsPercent: 20,
    badge: 'ENTERPRISE',
    highlight: 'Unlimited usage',
    popular: false,
    premiumTier: 'enterprise',
    features: {
      MAX_USERS: 100, // 100 users limit (above this is custom)
      MAX_CONTACTS: -1,
      AI_MESSAGES_LIMIT: -1, // Unlimited AI messages
      PSYCHOLOGICAL_PROFILING: true,
      ADVANCED_PSYCHOLOGICAL_PROFILING: true,
      EMAIL_SUPPORT: true,
      CORE_AUTOMATION: true,
      EMAIL_SYNC: true,
      PRIORITY_SUPPORT: true,
      PHONE_SUPPORT: true,
      TOPUP_AVAILABLE: false, // No need for top-ups with unlimited
      // All features included
      CRM_ASSISTANT: true,
      SALES_TACTICS: true,
      PERSONALITY_INSIGHTS: true,
      AI_DRAFTING_ASSISTANCE: true,
      TEAM_COLLABORATION: true,
      AI_FUTURE_ACCESS: true,
      AI_FUTURE_MESSAGES_LIMIT: -1,
      AI_FUTURE_PRIORITY_SUPPORT: true,
      ERP_INTEGRATION: true,
      ADVANCED_ANALYTICS: true,
      CUSTOM_INTEGRATIONS: true,
      WHITE_LABEL: true,
      AI_CUSTOMIZATION: true,
      DEDICATED_SUCCESS_AGENT: true,
      MOBILE_APP_ACCESS: true
    },
    trialDays: 14,
    userLimit: 100,
    additionalUserPrice: 10, // €10 per additional user per month
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
 * Get Premium tier plans
 */
export function getPremiumPlans(): SubscriptionPlanDefinition[] {
  return subscriptionPlans.filter(plan => plan.premiumTier);
}

/**
 * Determine appropriate Premium tier based on organization size
 */
export function recommendPremiumTier(userCount: number, monthlyAIMessages: number): SubscriptionPlanDefinition {
  const premiumPlans = getPremiumPlans();
  
  // Enterprise tier for 100+ users or unlimited AI needs
  if (userCount >= 100 || monthlyAIMessages > 15000) {
    return premiumPlans.find(p => p.premiumTier === 'enterprise')!;
  }
  
  // Advanced tier for 50+ users or high AI usage
  if (userCount >= 50 || monthlyAIMessages > 5000) {
    return premiumPlans.find(p => p.premiumTier === 'advanced')!;
  }
  
  // Basic tier for smaller teams
  return premiumPlans.find(p => p.premiumTier === 'basic')!;
}

/**
 * Get top-up package by ID
 */
export function getTopUpPackage(packageId: string): TopUpPackage | null {
  return topUpPackages.find(pkg => pkg.id === packageId) || null;
}

/**
 * Calculate best top-up package for needed messages
 */
export function recommendTopUpPackage(neededMessages: number): TopUpPackage {
  // If need more than 750 messages, recommend 1000 pack
  if (neededMessages > 750) {
    return topUpPackages.find(pkg => pkg.id === 'topup_1000')!;
  }
  
  // If need more than 300 messages, recommend 500 pack
  if (neededMessages > 300) {
    return topUpPackages.find(pkg => pkg.id === 'topup_500')!;
  }
  
  // Otherwise recommend 100 pack
  return topUpPackages.find(pkg => pkg.id === 'topup_100')!;
}

/**
 * Format price for display in USD
 */
export function formatPriceUSD(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Calculate annual savings amount in EUR
 */
export function calculateAnnualSavings(plan: SubscriptionPlanDefinition): number {
  if (plan.annualSavingsPercent === 0) return 0;
  const monthlyCost = plan.monthlyPrice * 12;
  const annualCost = plan.annualPrice * 12;
  return monthlyCost - annualCost;
}

/**
 * Get the most popular plan
 */
export function getPopularPlan(): SubscriptionPlanDefinition | null {
  return subscriptionPlans.find(plan => plan.popular) || null;
}

/**
 * Calculate total price for a subscription plan including additional users
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
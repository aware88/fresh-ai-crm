/**
 * Subscription Types
 * 
 * TypeScript definitions for subscription-related entities
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_interval: 'monthly' | 'quarterly' | 'yearly';
  features: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  subscription_plan_id: string;
  subscription_plan?: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trial' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method_id: string | null;
  subscription_provider: string | null;
  provider_subscription_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  organization_id: string;
  subscription_id: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'void' | 'processing';
  due_date: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  invoice_pdf: string | null;
  provider_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureAccess {
  [featureName: string]: boolean;
}

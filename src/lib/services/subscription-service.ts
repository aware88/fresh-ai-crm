import { createClient } from '@/lib/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

export type SubscriptionPlan = {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_interval: 'monthly' | 'yearly';
  features: Record<string, boolean | number | string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrganizationSubscription = {
  id: string;
  organization_id: string;
  subscription_plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method_id?: string;
  provider_subscription_id?: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInvoice = {
  id: string;
  organization_id: string;
  subscription_id: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'void';
  due_date?: string;
  paid_at?: string;
  invoice_url?: string;
  invoice_pdf?: string;
  provider_invoice_id?: string;
  created_at: string;
  updated_at: string;
};

export class SubscriptionService {
  /**
   * Get all subscription plans
   */
  async getSubscriptionPlans(): Promise<{ data: SubscriptionPlan[] | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    return { data, error };
  }

  /**
   * Get a specific subscription plan by ID
   */
  async getSubscriptionPlanById(id: string): Promise<{ data: SubscriptionPlan | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  /**
   * Get an organization's current subscription
   */
  async getOrganizationSubscription(organizationId: string): Promise<{ data: OrganizationSubscription | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return { data, error };
  }
  
  /**
   * Get a subscription by its ID
   */
  async getSubscriptionById(subscriptionId: string): Promise<{ data: OrganizationSubscription | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();
    
    return { data, error };
  }

  /**
   * Get subscription plan details for an organization
   */
  async getOrganizationSubscriptionPlan(organizationId: string): Promise<{ data: SubscriptionPlan | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data: subscription, error: subscriptionError } = await this.getOrganizationSubscription(organizationId);
    
    if (subscriptionError || !subscription) {
      return { data: null, error: subscriptionError };
    }
    
    const { data: plan, error: planError } = await this.getSubscriptionPlanById(subscription.subscription_plan_id);
    
    return { data: plan, error: planError };
  }

  /**
   * Create a new subscription for an organization
   */
  async createSubscription(
    organizationId: string,
    subscriptionPlanId: string,
    status: OrganizationSubscription['status'] = 'active',
    periodStart: Date = new Date(),
    periodEnd: Date = new Date(new Date().setMonth(new Date().getMonth() + 1))
  ): Promise<{ data: OrganizationSubscription | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: organizationId,
        subscription_plan_id: subscriptionPlanId,
        status,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false
      })
      .select()
      .single();
    
    return { data, error };
  }

  /**
   * Update an organization's subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<OrganizationSubscription>
  ): Promise<{ data: OrganizationSubscription | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();
    
    return { data, error };
  }

  /**
   * Cancel a subscription at period end
   */
  async cancelSubscription(subscriptionId: string): Promise<{ data: OrganizationSubscription | null; error: PostgrestError | null }> {
    return this.updateSubscription(subscriptionId, { 
      cancel_at_period_end: true 
    });
  }

  /**
   * Get invoices for an organization
   */
  async getOrganizationInvoices(organizationId: string): Promise<{ data: SubscriptionInvoice[] | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  }

  /**
   * Create a new invoice
   */
  async createInvoice(
    organizationId: string,
    subscriptionId: string,
    amount: number,
    status: SubscriptionInvoice['status'] = 'unpaid',
    dueDate: Date = new Date(new Date().setDate(new Date().getDate() + 7))
  ): Promise<{ data: SubscriptionInvoice | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('subscription_invoices')
      .insert({
        organization_id: organizationId,
        subscription_id: subscriptionId,
        amount,
        status,
        due_date: dueDate.toISOString()
      })
      .select()
      .single();
    
    return { data, error };
  }

  /**
   * Update an invoice
   */
  async updateInvoice(
    invoiceId: string,
    updates: Partial<SubscriptionInvoice>
  ): Promise<{ data: SubscriptionInvoice | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('subscription_invoices')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();
    
    return { data, error };
  }

  /**
   * Mark an invoice as paid
   */
  async markInvoiceAsPaid(invoiceId: string): Promise<{ data: SubscriptionInvoice | null; error: PostgrestError | null }> {
    return this.updateInvoice(invoiceId, { 
      status: 'paid',
      paid_at: new Date().toISOString()
    });
  }

  /**
   * Get detailed feature access information for an organization
   * This combines subscription plan data with feature access checks
   */
  async getOrganizationFeatureAccess(organizationId: string): Promise<{ 
    data: { 
      plan: SubscriptionPlan | null; 
      subscription: OrganizationSubscription | null;
      features: Record<string, { enabled: boolean; limit?: number }> | null;
      isActive: boolean;
    }; 
    error: PostgrestError | null 
  }> {
    try {
      // Get the organization's subscription
      const { data: subscription, error: subscriptionError } = await this.getOrganizationSubscription(organizationId);
      
      if (subscriptionError) {
        return { data: { plan: null, subscription: null, features: null, isActive: false }, error: subscriptionError };
      }
      
      // If no subscription exists, return empty data
      if (!subscription) {
        return { data: { plan: null, subscription: null, features: null, isActive: false }, error: null };
      }
      
      // Check if subscription is active
      const isActive = ['active', 'trialing'].includes(subscription.status);
      
      // Get the subscription plan
      const { data: plan, error: planError } = await this.getSubscriptionPlanById(subscription.subscription_plan_id);
      
      if (planError || !plan) {
        return { 
          data: { 
            plan: null, 
            subscription, 
            features: null, 
            isActive 
          }, 
          error: planError 
        };
      }
      
      // Extract features from the plan
      const features = plan.features || {};
      
      // Format features for easier consumption by frontend
      const formattedFeatures: Record<string, { enabled: boolean; limit?: number }> = {};
      
      Object.entries(features).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formattedFeatures[key] = { enabled: value };
        } else if (typeof value === 'number') {
          formattedFeatures[key] = { enabled: value > 0, limit: value };
        } else {
          formattedFeatures[key] = { enabled: false };
        }
      });
      
      return { 
        data: { 
          plan, 
          subscription, 
          features: formattedFeatures, 
          isActive 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error getting organization feature access:', error);
      return { 
        data: { 
          plan: null, 
          subscription: null, 
          features: null, 
          isActive: false 
        }, 
        error: error as PostgrestError 
      };
    }
  }
}

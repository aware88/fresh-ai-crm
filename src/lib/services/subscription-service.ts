import { createServerClient } from '@/lib/supabase/server';
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

// Define Stripe types for webhook events
type StripeCheckoutSession = {
  id: string;
  client_reference_id?: string;
  customer?: string;
  subscription?: string;
  payment_status?: string;
  metadata?: Record<string, string>;
};

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        id: string;
        product: string;
      };
    }>;
  };
  metadata?: Record<string, string>;
};

type StripeInvoice = {
  id: string;
  customer: string;
  subscription?: string;
  status: string;
  amount_paid: number;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  payment_intent?: string;
};

export class SubscriptionService {
  /**
   * Get all subscription plans
   */
  async getSubscriptionPlans(): Promise<{ data: SubscriptionPlan[] | null; error: PostgrestError | null }> {
    const supabase = await createServerClient();
    
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
    const supabase = await createServerClient();
    
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
    const supabase = await createServerClient();
    
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
    const supabase = await createServerClient();
    
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
    const supabase = await createServerClient();
    
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
    const supabase = await createServerClient();
    
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
    const supabase = await createServerClient();
    
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
    const supabase = await createServerClient();
    
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
    const supabase = await createServerClient();
    
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
    const supabase = await createServerClient();
    
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

  /**
   * Handle checkout session completed event from Stripe
   * @param organizationId The organization ID
   * @param session The Stripe checkout session object
   */
  async handleCheckoutCompleted(organizationId: string, session: StripeCheckoutSession): Promise<{ success: boolean; error?: any }> {
    try {
      const supabase = await createServerClient();
      
      // Get the subscription ID from the session
      const subscriptionId = session.subscription;
      
      if (!subscriptionId) {
        console.error('No subscription ID in checkout session');
        return { success: false, error: 'No subscription ID in checkout session' };
      }
      
      // Find the price ID from the session metadata or items
      let priceId = session.metadata?.price_id;
      
      // Find the corresponding plan in our database
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);
      
      if (plansError || !plans || plans.length === 0) {
        console.error('Error fetching subscription plans:', plansError);
        return { success: false, error: plansError };
      }
      
      // Find the matching plan by Stripe price ID
      const plan = plans.find(p => p.stripe_price_id === priceId);
      
      if (!plan) {
        console.error('No matching plan found for price ID:', priceId);
        return { success: false, error: 'No matching plan found' };
      }
      
      // Create or update the subscription record
      const { data: subscription, error: subscriptionError } = await supabase
        .from('organization_subscriptions')
        .upsert({
          organization_id: organizationId,
          subscription_plan_id: plan.id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Placeholder until we get the actual period end
          cancel_at_period_end: false,
          provider_subscription_id: subscriptionId,
          provider_customer_id: session.customer,
          subscription_provider: 'stripe',
          metadata: {
            checkout_session_id: session.id
          },
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (subscriptionError) {
        console.error('Error creating/updating subscription:', subscriptionError);
        return { success: false, error: subscriptionError };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error handling checkout completed:', error);
      return { success: false, error };
    }
  }

  /**
   * Handle subscription created event from Stripe
   * @param organizationId The organization ID
   * @param subscription The Stripe subscription object
   */
  async handleSubscriptionCreated(organizationId: string, subscription: StripeSubscription): Promise<{ success: boolean; error?: any }> {
    try {
      const supabase = await createServerClient();
      
      // Get the price ID from the subscription
      const priceId = subscription.items.data[0]?.price.id;
      
      if (!priceId) {
        console.error('No price ID in subscription');
        return { success: false, error: 'No price ID in subscription' };
      }
      
      // Find the corresponding plan in our database
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);
      
      if (plansError || !plans || plans.length === 0) {
        console.error('Error fetching subscription plans:', plansError);
        return { success: false, error: plansError };
      }
      
      // Find the matching plan by Stripe price ID
      const plan = plans.find(p => p.stripe_price_id === priceId);
      
      if (!plan) {
        console.error('No matching plan found for price ID:', priceId);
        return { success: false, error: 'No matching plan found' };
      }
      
      // Update the subscription record
      const { data: updatedSubscription, error: subscriptionError } = await supabase
        .from('organization_subscriptions')
        .update({
          subscription_plan_id: plan.id,
          status: subscription.status === 'active' ? 'active' : 'incomplete',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('provider_subscription_id', subscription.id)
        .select()
        .single();
      
      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        return { success: false, error: subscriptionError };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error handling subscription created:', error);
      return { success: false, error };
    }
  }

  /**
   * Handle subscription updated event from Stripe
   * @param organizationId The organization ID
   * @param subscription The Stripe subscription object
   */
  async handleSubscriptionUpdated(organizationId: string, subscription: StripeSubscription): Promise<{ success: boolean; error?: any }> {
    try {
      const supabase = await createServerClient();
      
      // Get the price ID from the subscription
      const priceId = subscription.items.data[0]?.price.id;
      
      if (!priceId) {
        console.error('No price ID in subscription');
        return { success: false, error: 'No price ID in subscription' };
      }
      
      // Find the corresponding plan in our database
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);
      
      if (plansError || !plans || plans.length === 0) {
        console.error('Error fetching subscription plans:', plansError);
        return { success: false, error: plansError };
      }
      
      // Find the matching plan by Stripe price ID
      const plan = plans.find(p => p.stripe_price_id === priceId);
      
      if (!plan) {
        console.error('No matching plan found for price ID:', priceId);
        return { success: false, error: 'No matching plan found' };
      }
      
      // Map Stripe status to our status
      let status = 'active';
      if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
        status = 'incomplete';
      } else if (subscription.status === 'past_due') {
        status = 'past_due';
      } else if (subscription.status === 'canceled') {
        status = 'canceled';
      } else if (subscription.status === 'trialing') {
        status = 'trialing';
      }
      
      // Update the subscription record
      const { data: updatedSubscription, error: subscriptionError } = await supabase
        .from('organization_subscriptions')
        .update({
          subscription_plan_id: plan.id,
          status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('provider_subscription_id', subscription.id)
        .select()
        .single();
      
      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        return { success: false, error: subscriptionError };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      return { success: false, error };
    }
  }

  /**
   * Record an invoice from Stripe
   * @param organizationId The organization ID
   * @param invoice The Stripe invoice object
   */
  async recordInvoice(organizationId: string, invoice: StripeInvoice): Promise<{ success: boolean; error?: any }> {
    try {
      const supabase = await createServerClient();
      
      // Get the subscription ID
      const subscriptionId = invoice.subscription;
      
      if (!subscriptionId) {
        console.error('No subscription ID in invoice');
        return { success: false, error: 'No subscription ID in invoice' };
      }
      
      // Find our subscription record
      const { data: subscription, error: subscriptionError } = await supabase
        .from('organization_subscriptions')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('provider_subscription_id', subscriptionId)
        .single();
      
      if (subscriptionError || !subscription) {
        console.error('Error finding subscription:', subscriptionError);
        return { success: false, error: subscriptionError || 'Subscription not found' };
      }
      
      // Create or update the invoice record
      const { data: invoiceRecord, error: invoiceError } = await supabase
        .from('subscription_invoices')
        .upsert({
          organization_id: organizationId,
          subscription_id: subscription.id,
          amount: invoice.amount_paid / 100, // Convert from cents to dollars
          status: invoice.status === 'paid' ? 'paid' : 'unpaid',
          paid_at: invoice.status === 'paid' ? new Date().toISOString() : null,
          invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          provider_invoice_id: invoice.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (invoiceError) {
        console.error('Error creating/updating invoice:', invoiceError);
        return { success: false, error: invoiceError };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error recording invoice:', error);
      return { success: false, error };
    }
  }
}

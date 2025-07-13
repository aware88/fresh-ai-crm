/**
 * Subscription Service
 * 
 * Handles subscription-related operations for organizations
 */

// Check if we're in a build environment
const isBuildEnv = () => {
  // Enhanced detection for Northflank, Vercel, Netlify and other cloud build environments
  return (process.env.NODE_ENV === 'production' && 
         typeof window === 'undefined' && 
         (process.env.NEXT_PHASE === 'phase-production-build' || 
          process.env.NEXT_PHASE === 'phase-production-server' ||
          process.env.VERCEL_ENV === 'production' ||
          process.env.NETLIFY === 'true' ||
          process.env.CI === 'true' ||
          process.env.BUILD_ENV === 'true' ||
          // Northflank specific environment detection
          process.env.NORTHFLANK === 'true' ||
          process.env.KUBERNETES_SERVICE_HOST !== undefined));
};

// Get a mock client for build-time or when env vars are missing
const createMockSupabaseClient = () => {
  return {
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        order: (column, options) => Promise.resolve({ data: [], error: null }),
      }),
      update: (data) => ({
        eq: (column, value) => ({
          select: () => Promise.resolve({ data: [data], error: null })
        })
      }),
      insert: (data) => ({
        select: () => Promise.resolve({ data: [data], error: null })
      }),
      upsert: (data) => Promise.resolve({ data, error: null })
    }),
    rpc: (functionName, params) => Promise.resolve({ data: false, error: null })
  };
};

// Get a properly initialized Supabase client
const getSupabaseClient = async () => {
  // Return mock during build
  if (isBuildEnv()) {
    console.log('Using mock Supabase client in build environment');
    return createMockSupabaseClient();
  }
  
  // Return mock if not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Using mock Supabase client due to missing environment variables');
    return createMockSupabaseClient();
  }
  
  try {
    // Dynamically import Supabase to avoid build-time errors
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return createMockSupabaseClient();
  }
};

export class SubscriptionService {
  constructor() {
    // Initialize any required properties
  }
  
  /**
   * Handle subscription created event from Stripe
   * @param {string} organizationId The organization ID
   * @param {Object} subscription The Stripe subscription object
   * @returns {Promise<Object>} Result with success flag
   */
  async handleSubscriptionCreated(organizationId, subscription) {
    try {
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
      // Update the subscription record with details from Stripe
      const { error } = await supabase
        .from('organization_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('provider_subscription_id', subscription.id);
      
      if (error) {
        console.error('Error updating subscription record:', error);
        return { success: false, error };
      }
      
      console.log(`Subscription record updated for organization ${organizationId}`);
      return { success: true };
    } catch (error) {
      console.error('Error handling subscription created:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Handle subscription updated event from Stripe
   * @param {string} organizationId The organization ID
   * @param {Object} subscription The Stripe subscription object
   * @returns {Promise<Object>} Result with success flag
   */
  async handleSubscriptionUpdated(organizationId, subscription) {
    try {
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
      // Update the subscription record with details from Stripe
      const { error } = await supabase
        .from('organization_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('provider_subscription_id', subscription.id);
      
      if (error) {
        console.error('Error updating subscription record:', error);
        return { success: false, error };
      }
      
      console.log(`Subscription record updated for organization ${organizationId}`);
      return { success: true };
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Record an invoice from Stripe
   * @param {string} organizationId The organization ID
   * @param {Object} invoice The Stripe invoice object
   * @returns {Promise<Object>} Result with success flag
   */
  async recordInvoice(organizationId, invoice) {
    try {
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
      // Create an invoice record
      const { error } = await supabase
        .from('subscription_invoices')
        .upsert({
          organization_id: organizationId,
          provider: 'stripe',
          provider_invoice_id: invoice.id,
          amount_due: invoice.amount_due / 100, // Convert from cents to dollars
          amount_paid: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: invoice.status,
          invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          created_at: new Date(invoice.created * 1000).toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error recording invoice:', error);
        return { success: false, error };
      }
      
      console.log(`Invoice recorded for organization ${organizationId}`);
      return { success: true };
    } catch (error) {
      console.error('Error recording invoice:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Handle checkout session completed event from Stripe
   * @param {string} organizationId The organization ID
   * @param {Object} session The Stripe checkout session object
   * @returns {Promise<Object>} Result with success flag
   */
  async handleCheckoutCompleted(organizationId, session) {
    try {
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
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
        console.error('No matching subscription plan found for price ID:', priceId);
        return { success: false, error: 'No matching subscription plan found' };
      }
      
      // Create or update the organization subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('organization_subscriptions')
        .upsert({
          organization_id: organizationId,
          subscription_plan_id: plan.id,
          provider: 'stripe',
          provider_subscription_id: subscriptionId,
          provider_customer_id: session.customer,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: null, // Will be updated when we get the subscription details
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (subscriptionError) {
        console.error('Error creating subscription record:', subscriptionError);
        return { success: false, error: subscriptionError };
      }
      
      console.log(`Subscription record created for organization ${organizationId}`);
      return { success: true };
    } catch (error) {
      console.error('Error handling checkout completed:', error);
      return { success: false, error };
    }
  }
  /**
   * Get all available subscription plans
   * @returns {Promise<Array>} List of subscription plans
   */
  static async getSubscriptionPlans() {
    try {
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw new Error(`Failed to fetch subscription plans: ${error.message}`);
    }
  }

  /**
   * Get an organization's current subscription
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object|null>} Subscription details or null if not found
   */
  static async getOrganizationSubscription(organizationId) {
    try {
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select(`
          *,
          subscription_plan:subscription_plan_id(id, name, description, price, billing_interval, features)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data || null;
    } catch (error) {
      console.error(`Error fetching subscription for organization ${organizationId}:`, error);
      throw new Error(`Failed to fetch organization subscription: ${error.message}`);
    }
  }

  /**
   * Check if an organization has an active subscription
   * @param {string} organizationId - Organization ID
   * @returns {Promise<boolean>} True if the organization has an active subscription
   */
  static async hasActiveSubscription(organizationId) {
    try {
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
      const { data, error } = await supabase
        .rpc('has_active_subscription', { org_id: organizationId });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error(`Error checking active subscription for organization ${organizationId}:`, error);
      throw new Error(`Failed to check active subscription: ${error.message}`);
    }
  }

  /**
   * Check if an organization has access to a specific feature
   * @param {string} organizationId - Organization ID
   * @param {string} featureName - Feature name to check
   * @returns {Promise<boolean>} True if the organization has access to the feature
   */
  static async hasFeatureAccess(organizationId, featureName) {
    try {
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
      const { data, error } = await supabase
        .rpc('has_feature_access', { 
          org_id: organizationId,
          feature_name: featureName
        });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error(`Error checking feature access for organization ${organizationId}:`, error);
      throw new Error(`Failed to check feature access: ${error.message}`);
    }
  }

  /**
   * Get subscription invoices for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} List of invoices
   */
  static async getSubscriptionInvoices(organizationId) {
    try {
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching invoices for organization ${organizationId}:`, error);
      throw new Error(`Failed to fetch subscription invoices: ${error.message}`);
    }
  }

  /**
   * Create or update an organization subscription
   * Note: This is a placeholder until payment integration is implemented
   * @param {string} organizationId - Organization ID
   * @param {string} subscriptionPlanId - Subscription plan ID
   * @returns {Promise<Object>} Created or updated subscription
   */
  static async createOrUpdateSubscription(organizationId, subscriptionPlanId) {
    try {
      // Get the current date and add 30 days for the trial period
      const currentDate = new Date();
      const trialEndDate = new Date(currentDate);
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      // Check if the organization already has a subscription
      const existingSubscription = await this.getOrganizationSubscription(organizationId);
      
      let subscriptionData;
      
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();
      
      if (existingSubscription) {
        // Update existing subscription
        const { data, error } = await supabase
          .from('organization_subscriptions')
          .update({
            subscription_plan_id: subscriptionPlanId,
            status: 'active',
            current_period_start: currentDate.toISOString(),
            current_period_end: trialEndDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)
          .select();

        if (error) throw error;
        subscriptionData = data[0];
      } else {
        // Create new subscription
        const { data, error } = await supabase
          .from('organization_subscriptions')
          .insert({
            organization_id: organizationId,
            subscription_plan_id: subscriptionPlanId,
            status: 'active',
            current_period_start: currentDate.toISOString(),
            current_period_end: trialEndDate.toISOString(),
            cancel_at_period_end: false,
            subscription_provider: 'system',
            provider_subscription_id: `trial-${Date.now()}`,
            metadata: { trial: true }
          })
          .select();

        if (error) throw error;
        subscriptionData = data[0];
      }

      return subscriptionData;
    } catch (error) {
      console.error(`Error creating/updating subscription for organization ${organizationId}:`, error);
      throw new Error(`Failed to create/update subscription: ${error.message}`);
    }
  }

  /**
   * Cancel an organization subscription
   * @param {string} organizationId - Organization ID
   * @param {boolean} immediateCancel - Whether to cancel immediately or at the end of the period
   * @returns {Promise<Object>} Updated subscription
   */
  static async cancelSubscription(organizationId, immediateCancel = false) {
    try {
      const subscription = await this.getOrganizationSubscription(organizationId);
      
      if (!subscription) {
        throw new Error('No active subscription found for this organization');
      }

      const updateData = immediateCancel 
        ? { status: 'canceled', updated_at: new Date().toISOString() }
        : { cancel_at_period_end: true, updated_at: new Date().toISOString() };
      
      // Get initialized Supabase client
      const supabase = await getSupabaseClient();

      const { data, error } = await supabase
        .from('organization_subscriptions')
        .update(updateData)
        .eq('id', subscription.id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error(`Error canceling subscription for organization ${organizationId}:`, error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }
}

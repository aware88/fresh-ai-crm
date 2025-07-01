/**
 * Subscription Service
 * 
 * Handles subscription-related operations for organizations
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export class SubscriptionService {
  /**
   * Get all available subscription plans
   * @returns {Promise<Array>} List of subscription plans
   */
  static async getSubscriptionPlans() {
    try {
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

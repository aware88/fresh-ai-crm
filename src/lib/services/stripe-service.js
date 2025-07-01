/**
 * Stripe Service
 * 
 * Handles Stripe payment processing integration for subscriptions
 */

import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, BASE_URL } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export class StripeService {
  /**
   * Create a Stripe customer for an organization
   * @param {string} organizationId - Organization ID
   * @param {string} email - Organization admin email
   * @param {string} name - Organization name
   * @returns {Promise<Object>} Stripe customer object
   */
  static async createCustomer(organizationId, email, name) {
    try {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          organization_id: organizationId
        }
      });
      
      // Store the customer ID in the database
      const { error } = await supabase
        .from('organizations')
        .update({ stripe_customer_id: customer.id })
        .eq('id', organizationId);
        
      if (error) throw error;
      
      return customer;
    } catch (error) {
      console.error(`Error creating Stripe customer for organization ${organizationId}:`, error);
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }
  
  /**
   * Get a Stripe customer for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object|null>} Stripe customer object or null
   */
  static async getCustomer(organizationId) {
    try {
      // Get the Stripe customer ID from the database
      const { data, error } = await supabase
        .from('organizations')
        .select('stripe_customer_id')
        .eq('id', organizationId)
        .single();
        
      if (error) throw error;
      
      if (!data?.stripe_customer_id) {
        return null;
      }
      
      // Get the customer from Stripe
      return await stripe.customers.retrieve(data.stripe_customer_id);
    } catch (error) {
      console.error(`Error getting Stripe customer for organization ${organizationId}:`, error);
      throw new Error(`Failed to get Stripe customer: ${error.message}`);
    }
  }
  
  /**
   * Create a checkout session for a subscription
   * @param {string} organizationId - Organization ID
   * @param {string} priceId - Stripe price ID
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Checkout session
   */
  static async createCheckoutSession(organizationId, priceId, customerId) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${BASE_URL}/app/settings/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/app/settings/subscription/cancel`,
        metadata: {
          organization_id: organizationId
        }
      });
      
      return session;
    } catch (error) {
      console.error(`Error creating checkout session for organization ${organizationId}:`, error);
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }
  
  /**
   * Create a billing portal session for managing subscriptions
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Portal session
   */
  static async createBillingPortalSession(customerId) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${BASE_URL}/app/settings/subscription`,
      });
      
      return session;
    } catch (error) {
      console.error(`Error creating billing portal session for customer ${customerId}:`, error);
      throw new Error(`Failed to create billing portal session: ${error.message}`);
    }
  }
  
  /**
   * Process a Stripe webhook event
   * @param {string} signature - Stripe signature from headers
   * @param {string} rawBody - Raw request body
   * @returns {Promise<Object>} Processed event result
   */
  static async processWebhookEvent(signature, rawBody) {
    try {
      // Verify the webhook signature
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
      
      // Process different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
          
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
          
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
      }
      
      return { success: true, event };
    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw new Error(`Webhook Error: ${error.message}`);
    }
  }
  
  /**
   * Handle checkout.session.completed event
   * @param {Object} session - Checkout session
   * @returns {Promise<void>}
   */
  static async handleCheckoutSessionCompleted(session) {
    try {
      const organizationId = session.metadata.organization_id;
      
      // Get the subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Map Stripe subscription status to our status
      const statusMap = {
        'active': 'active',
        'trialing': 'trial',
        'past_due': 'past_due',
        'canceled': 'canceled',
        'unpaid': 'past_due',
        'incomplete': 'past_due',
        'incomplete_expired': 'expired'
      };
      
      // Get the subscription plan ID from the price ID
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('stripe_price_id', subscription.items.data[0].price.id)
        .single();
      
      if (!planData) {
        throw new Error(`No subscription plan found for price ID: ${subscription.items.data[0].price.id}`);
      }
      
      // Create or update the subscription in our database
      const { error } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: organizationId,
          subscription_plan_id: planData.id,
          status: statusMap[subscription.status] || 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          payment_method_id: session.payment_method,
          subscription_provider: 'stripe',
          provider_subscription_id: subscription.id,
          metadata: {
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscription.id
          }
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error handling checkout.session.completed:', error);
      throw error;
    }
  }
  
  /**
   * Handle customer.subscription.created or customer.subscription.updated events
   * @param {Object} subscription - Stripe subscription
   * @returns {Promise<void>}
   */
  static async handleSubscriptionUpdated(subscription) {
    try {
      // Get the organization ID from the customer metadata
      const customer = await stripe.customers.retrieve(subscription.customer);
      const organizationId = customer.metadata.organization_id;
      
      if (!organizationId) {
        throw new Error(`No organization ID found for customer: ${subscription.customer}`);
      }
      
      // Map Stripe subscription status to our status
      const statusMap = {
        'active': 'active',
        'trialing': 'trial',
        'past_due': 'past_due',
        'canceled': 'canceled',
        'unpaid': 'past_due',
        'incomplete': 'past_due',
        'incomplete_expired': 'expired'
      };
      
      // Get the subscription plan ID from the price ID
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('stripe_price_id', subscription.items.data[0].price.id)
        .single();
      
      if (!planData) {
        throw new Error(`No subscription plan found for price ID: ${subscription.items.data[0].price.id}`);
      }
      
      // Check if the subscription exists in our database
      const { data: existingSubscription } = await supabase
        .from('organization_subscriptions')
        .select('id')
        .eq('provider_subscription_id', subscription.id)
        .single();
      
      if (existingSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('organization_subscriptions')
          .update({
            subscription_plan_id: planData.id,
            status: statusMap[subscription.status] || 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);
        
        if (error) throw error;
      } else {
        // Create new subscription record
        const { error } = await supabase
          .from('organization_subscriptions')
          .insert({
            organization_id: organizationId,
            subscription_plan_id: planData.id,
            status: statusMap[subscription.status] || 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            subscription_provider: 'stripe',
            provider_subscription_id: subscription.id,
            metadata: {
              stripe_customer_id: subscription.customer,
              stripe_subscription_id: subscription.id
            }
          });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error handling subscription update:', error);
      throw error;
    }
  }
  
  /**
   * Handle customer.subscription.deleted event
   * @param {Object} subscription - Stripe subscription
   * @returns {Promise<void>}
   */
  static async handleSubscriptionDeleted(subscription) {
    try {
      // Update the subscription status in our database
      const { error } = await supabase
        .from('organization_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('provider_subscription_id', subscription.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
      throw error;
    }
  }
  
  /**
   * Handle invoice.payment_succeeded event
   * @param {Object} invoice - Stripe invoice
   * @returns {Promise<void>}
   */
  static async handleInvoicePaymentSucceeded(invoice) {
    try {
      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      
      // Get the organization ID from the customer metadata
      const customer = await stripe.customers.retrieve(invoice.customer);
      const organizationId = customer.metadata.organization_id;
      
      if (!organizationId) {
        throw new Error(`No organization ID found for customer: ${invoice.customer}`);
      }
      
      // Create an invoice record in our database
      const { error } = await supabase
        .from('subscription_invoices')
        .insert({
          organization_id: organizationId,
          subscription_id: subscription.id,
          amount: invoice.amount_paid / 100, // Convert from cents to dollars
          status: 'paid',
          paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
          invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          provider_invoice_id: invoice.id
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error handling invoice payment success:', error);
      throw error;
    }
  }
  
  /**
   * Handle invoice.payment_failed event
   * @param {Object} invoice - Stripe invoice
   * @returns {Promise<void>}
   */
  static async handleInvoicePaymentFailed(invoice) {
    try {
      // Get the organization ID from the customer metadata
      const customer = await stripe.customers.retrieve(invoice.customer);
      const organizationId = customer.metadata.organization_id;
      
      if (!organizationId) {
        throw new Error(`No organization ID found for customer: ${invoice.customer}`);
      }
      
      // Create an invoice record in our database
      const { error } = await supabase
        .from('subscription_invoices')
        .insert({
          organization_id: organizationId,
          subscription_id: invoice.subscription,
          amount: invoice.amount_due / 100, // Convert from cents to dollars
          status: 'unpaid',
          due_date: new Date(invoice.due_date * 1000).toISOString(),
          invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          provider_invoice_id: invoice.id
        });
      
      if (error) throw error;
      
      // TODO: Send notification to organization admin about failed payment
    } catch (error) {
      console.error('Error handling invoice payment failure:', error);
      throw error;
    }
  }
}

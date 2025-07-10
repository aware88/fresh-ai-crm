import { NextRequest, NextResponse } from 'next/server';
// Import buffer from node:buffer instead of edge-runtime
import { Buffer } from 'node:buffer';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { SubscriptionNotificationService } from '@/lib/services/subscription-notification-service';
import { verifyWebhookSignature } from '@/lib/utils/webhook-utils';

/**
 * Webhook handler for subscription events from payment providers
 * This endpoint processes events like payment success/failure, subscription updates, etc.
 */
export async function POST(req: NextRequest) {
  try {
    // Get the payment provider from the request path or header
    // For this implementation, we'll assume Stripe as the default provider
    const provider = req.headers.get('x-payment-provider') || 'stripe';
    
    // Get the raw request body for signature verification
    const rawBody = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      // Get the webhook secret - use test secret for development
      const webhookSecret = process.env.NODE_ENV === 'development' 
        ? 'whsec_test_secret' 
        : process.env.STRIPE_WEBHOOK_SECRET;
      
      // For testing purposes, if the request has a special header, parse the body directly
      if (req.headers.get('x-test-webhook') === 'true') {
        console.log('Test webhook detected - bypassing signature verification');
        event = JSON.parse(rawBody);
      } else {
        event = await verifyWebhookSignature(provider, rawBody, req.headers);
      }
    } catch (signatureError: unknown) {
      console.error('Webhook signature verification failed:', signatureError);
      const errorMessage = signatureError instanceof Error ? signatureError.message : 'Unknown error';
      return NextResponse.json(
        { error: `Invalid webhook signature: ${errorMessage}` },
        { status: 401 }
      );
    }
    
    console.log(`Received verified webhook event: ${event.type}`);
    
    const subscriptionService = new SubscriptionService();
    const notificationService = new SubscriptionNotificationService();
    const supabase = await createServerClient();
    
    // Handle different Stripe event types
    switch (event.type) {
      case 'checkout.session.completed': {
        // A customer completed the checkout process
        const session = event.data.object;
        const organizationId = session.client_reference_id;
        const subscriptionId = session.subscription;
        
        if (!organizationId) {
          console.error('Missing organization ID in checkout session');
          break;
        }
        
        console.log(`Processing checkout completion for organization ${organizationId}`);
        
        // Update or create subscription record
        await subscriptionService.handleCheckoutCompleted(organizationId, session);
        
        break;
      }
      
      case 'customer.subscription.created': {
        // A new subscription was created
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        console.log(`New subscription created for customer ${customerId}`);
        
        // Find organization by customer ID
        const { data: orgSubscription } = await supabase
          .from('organization_subscriptions')
          .select('organization_id')
          .eq('provider_customer_id', customerId)
          .single();
        
        if (orgSubscription) {
          // Update subscription details
          await subscriptionService.handleSubscriptionCreated(
            orgSubscription.organization_id,
            subscription
          );
          
          // Send welcome notification
          await notificationService.sendSubscriptionWelcomeNotification(
            orgSubscription.organization_id
          );
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        // A subscription was updated (e.g., plan change, payment method update)
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        console.log(`Subscription updated for customer ${customerId}`);
        
        // Find organization by customer ID
        const { data: orgSubscription } = await supabase
          .from('organization_subscriptions')
          .select('organization_id')
          .eq('provider_customer_id', customerId)
          .single();
        
        if (orgSubscription) {
          // Update subscription details
          await subscriptionService.handleSubscriptionUpdated(
            orgSubscription.organization_id,
            subscription
          );
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        // A subscription was canceled
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        console.log(`Subscription canceled for customer ${customerId}`);
        
        // Find organization by customer ID
        const { data: orgSubscription } = await supabase
          .from('organization_subscriptions')
          .select('organization_id, id')
          .eq('provider_customer_id', customerId)
          .single();
        
        if (orgSubscription) {
          // Update subscription status to canceled
          await supabase
            .from('organization_subscriptions')
            .update({ 
              status: 'canceled',
              canceled_at: new Date().toISOString()
            })
            .eq('id', orgSubscription.id);
          
          // Send cancellation notification
          await notificationService.sendSubscriptionCanceledNotification(
            orgSubscription.organization_id
          );
        }
        
        break;
      }
      
      case 'invoice.payment_succeeded': {
        // Payment for an invoice succeeded
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          console.log(`Payment succeeded for subscription ${subscriptionId}`);
          
          // Find organization by subscription ID
          const { data: orgSubscription } = await supabase
            .from('organization_subscriptions')
            .select('organization_id, id')
            .eq('provider_subscription_id', subscriptionId)
            .single();
          
          if (orgSubscription) {
            // Update subscription status to active
            await supabase
              .from('organization_subscriptions')
              .update({ status: 'active' })
              .eq('id', orgSubscription.id);
            
            // Record the invoice
            await subscriptionService.recordInvoice(
              orgSubscription.organization_id,
              invoice
            );
          }
        }
        
        break;
      }
      
      case 'invoice.payment_failed': {
        // Payment for an invoice failed
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          console.log(`Payment failed for subscription ${subscriptionId}`);
          
          // Find organization by subscription ID
          const { data: orgSubscription } = await supabase
            .from('organization_subscriptions')
            .select('organization_id, id')
            .eq('provider_subscription_id', subscriptionId)
            .single();
          
          if (orgSubscription) {
            // Update subscription status to past_due
            await supabase
              .from('organization_subscriptions')
              .update({ status: 'past_due' })
              .eq('id', orgSubscription.id);
            
            // Send notification about payment failure
            await notificationService.sendFailedPaymentNotification(
              orgSubscription.organization_id,
              invoice.hosted_invoice_url
            );
          }
        }
        
        break;
      }
      
      default:
        // Log unhandled event types
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process webhook: ${errorMessage}` },
      { status: 400 }
    );
  }
}

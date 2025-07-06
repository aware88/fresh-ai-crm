import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { SubscriptionNotificationService } from '@/lib/services/subscription-notification-service';
import { createClient } from '@/lib/supabase/server';
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
      event = await verifyWebhookSignature(provider, rawBody, req.headers);
    } catch (signatureError) {
      console.error('Webhook signature verification failed:', signatureError);
      return NextResponse.json(
        { error: `Invalid webhook signature: ${signatureError.message}` },
        { status: 401 }
      );
    }
    
    // Parse the verified payload
    const payload = JSON.parse(rawBody);
    const { type, data } = payload;
    
    const subscriptionService = new SubscriptionService();
    const notificationService = new SubscriptionNotificationService();
    const supabase = createClient();
    
    // Handle different event types
    switch (type) {
      case 'payment_succeeded': {
        // Update subscription status to active if it was past_due
        const { subscription_id, organization_id } = data;
        
        await supabase
          .from('organization_subscriptions')
          .update({ status: 'active' })
          .eq('id', subscription_id);
        
        // You might want to send a receipt notification here
        break;
      }
      
      case 'payment_failed': {
        // Handle payment failure
        const { organization_id, invoice_url } = data;
        
        // Send notification about payment failure
        await notificationService.sendFailedPaymentNotification(organization_id, invoice_url);
        
        // Update subscription status to past_due
        if (data.subscription_id) {
          await supabase
            .from('organization_subscriptions')
            .update({ status: 'past_due' })
            .eq('id', data.subscription_id);
        }
        
        break;
      }
      
      case 'subscription_created': {
        // Handle new subscription
        const { organization_id, plan_id } = data;
        
        // Fetch plan details
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', plan_id)
          .single();
        
        if (plan) {
          // Send welcome notification
          await notificationService.sendSubscriptionUpgradeNotification(organization_id, plan.name);
        }
        
        break;
      }
      
      case 'subscription_updated': {
        // Handle subscription update (e.g., plan change)
        const { organization_id, plan_id } = data;
        
        // Fetch plan details
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', plan_id)
          .single();
        
        if (plan) {
          // Send notification about plan change
          await notificationService.sendSubscriptionUpgradeNotification(organization_id, plan.name);
        }
        
        break;
      }
      
      case 'subscription_canceled': {
        // Handle subscription cancellation
        const { subscription_id } = data;
        
        // Update subscription status to canceled
        await supabase
          .from('organization_subscriptions')
          .update({ status: 'canceled' })
          .eq('id', subscription_id);
        
        break;
      }
      
      case 'trial_will_end': {
        // Handle trial ending soon
        const { organization_id } = data;
        
        // This is handled by the scheduled job for trial expiration notifications
        // But you could send an immediate notification here if needed
        
        break;
      }
      
      default:
        // Unknown event type
        console.log(`Unhandled webhook event type: ${type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: `Failed to process webhook: ${error.message}` },
      { status: 400 }
    );
  }
}

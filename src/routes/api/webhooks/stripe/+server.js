/**
 * Stripe Webhook Handler
 * 
 * Processes incoming webhook events from Stripe
 */

import { json } from '@sveltejs/kit';
import { StripeService } from '$lib/services/stripe-service';

/**
 * POST /api/webhooks/stripe
 * Handle incoming Stripe webhook events
 */
export async function POST({ request }) {
  try {
    // Get the raw body and Stripe signature from the request
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('Missing Stripe signature');
      return json({ error: 'Missing Stripe signature' }, { status: 400 });
    }
    
    // Process the webhook event
    const result = await StripeService.processWebhookEvent(signature, rawBody);
    
    return json({ received: true, type: result.event.type });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return json({ error: error.message }, { status: 400 });
  }
}

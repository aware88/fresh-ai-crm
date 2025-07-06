import Stripe from 'stripe';

/**
 * Verify the signature of a Stripe webhook request
 * @param payload The raw request body as a string
 * @param signature The signature from the request headers
 * @param secret The webhook secret from environment variables
 * @returns The parsed Stripe event if signature is valid
 * @throws Error if signature is invalid
 */
export async function verifyStripeWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined
): Promise<Stripe.Event> {
  if (!signature) {
    throw new Error('No signature provided in request');
  }

  if (!secret) {
    throw new Error('Webhook secret not configured');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16', // Use the latest API version or specify as needed
  });

  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * Generic function to verify webhook signatures from different providers
 * @param provider The payment provider (e.g., 'stripe', 'paypal')
 * @param payload The raw request body
 * @param headers The request headers
 * @returns The parsed event data if signature is valid
 * @throws Error if signature is invalid or provider is not supported
 */
export async function verifyWebhookSignature(
  provider: string,
  payload: string,
  headers: Headers
): Promise<any> {
  switch (provider.toLowerCase()) {
    case 'stripe':
      return verifyStripeWebhookSignature(
        payload,
        headers.get('stripe-signature'),
        process.env.STRIPE_WEBHOOK_SECRET
      );
    // Add cases for other providers as needed
    // case 'paypal':
    //   return verifyPayPalWebhookSignature(payload, headers);
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

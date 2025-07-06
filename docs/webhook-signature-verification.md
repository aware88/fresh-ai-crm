# Webhook Signature Verification

## Overview

This document describes the webhook signature verification system implemented in the CRM Mind platform. Webhook signature verification is a security measure that ensures webhook requests are coming from legitimate sources by validating cryptographic signatures.

## Implementation

### Core Components

1. **Webhook Utilities Module**: `/src/lib/utils/webhook-utils.ts`
   - Contains reusable functions for verifying webhook signatures from different payment providers
   - Currently supports Stripe, with an extensible design for adding other providers

2. **Webhook Handler**: `/src/app/api/webhooks/subscription/route.ts`
   - Uses the verification utilities to validate incoming webhook requests
   - Rejects requests with invalid signatures (401 Unauthorized)
   - Processes verified webhook events for subscription management

### How It Works

1. When a webhook request is received, the raw request body is preserved for signature verification
2. The payment provider is determined from headers (default: Stripe)
3. The signature from the request headers is validated against the expected signature using the provider's API
4. If verification fails, the request is rejected with a 401 status code
5. If verification succeeds, the webhook payload is processed normally

### Supported Payment Providers

- **Stripe**: Uses Stripe's `webhooks.constructEvent` method to verify signatures
- Additional providers can be added by extending the `verifyWebhookSignature` function

## Configuration

### Environment Variables

- `STRIPE_SECRET_KEY`: API key for Stripe operations
- `STRIPE_WEBHOOK_SECRET`: Secret used to verify Stripe webhook signatures

### Headers

- `stripe-signature`: Signature provided by Stripe in webhook requests
- `x-payment-provider`: Optional header to specify the payment provider (default: 'stripe')

## Security Considerations

- Webhook secrets should be stored securely and never exposed in client-side code
- Different webhook endpoints should use different secrets
- Webhook signature verification helps prevent:
  - Replay attacks
  - Request forgery
  - Unauthorized webhook calls

## Testing

Test coverage for webhook signature verification includes:

1. Successful verification and processing of valid webhooks
2. Rejection of requests with invalid signatures
3. Proper error handling for various failure scenarios

## Extending for New Providers

To add support for a new payment provider:

1. Implement a new verification function in `webhook-utils.ts`
2. Add a new case in the `verifyWebhookSignature` switch statement
3. Update tests to cover the new provider

## Related Files

- `/src/lib/utils/webhook-utils.ts`: Core verification utilities
- `/src/app/api/webhooks/subscription/route.ts`: Webhook handler implementation
- `/src/app/api/webhooks/subscription/__tests__/route.test.ts`: Tests for webhook handling

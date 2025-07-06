import { NextRequest, NextResponse } from 'next/server';
import { WebhookSecurityService } from '@/lib/services/webhook-security-service';

/**
 * Middleware to verify webhook signatures
 * 
 * @param req - The incoming request
 * @param webhookIdParam - The name of the parameter containing the webhook ID
 * @param signatureHeader - The name of the header containing the signature
 * @param timestampHeader - Optional name of the header containing the timestamp
 * @returns A function that verifies the signature and calls the handler if valid
 */
export function withWebhookSignatureVerification(
  handler: (req: NextRequest) => Promise<NextResponse>,
  webhookIdParam: string = 'webhookId',
  signatureHeader: string = 'x-webhook-signature',
  timestampHeader?: string
) {
  return async (req: NextRequest) => {
    try {
      // Get the webhook ID from the URL
      const url = new URL(req.url);
      const webhookId = url.searchParams.get(webhookIdParam);
      
      if (!webhookId) {
        return NextResponse.json(
          { error: 'Missing webhook ID' },
          { status: 400 }
        );
      }

      // Get the signature from the headers
      const signature = req.headers.get(signatureHeader);
      if (!signature) {
        return NextResponse.json(
          { error: 'Missing signature header' },
          { status: 401 }
        );
      }

      // Get the timestamp if a header is specified
      const timestamp = timestampHeader ? req.headers.get(timestampHeader) : undefined;

      // Clone the request to get the body as text
      const clonedReq = req.clone();
      const payload = await clonedReq.text();

      // Verify the signature
      const isValid = await WebhookSecurityService.verifySignature(
        payload,
        signature,
        webhookId,
        timestamp || undefined
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }

      // If signature is valid, proceed with the handler
      return handler(req);
    } catch (error) {
      console.error('Error in webhook signature verification:', error);
      return NextResponse.json(
        { error: 'Internal server error during signature verification' },
        { status: 500 }
      );
    }
  };
}

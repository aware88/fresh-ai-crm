import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

/**
 * Service for handling webhook security, including signature verification
 * and secret key management.
 */
export class WebhookSecurityService {
  /**
   * Verifies a webhook signature using HMAC-SHA256
   * 
   * @param payload - The raw request body as a string
   * @param signature - The signature provided in the request header
   * @param webhookId - The ID of the webhook configuration to get the secret for
   * @param timestamp - Optional timestamp from the request for preventing replay attacks
   * @returns Promise<boolean> - Whether the signature is valid
   */
  static async verifySignature(
    payload: string,
    signature: string,
    webhookId: string,
    timestamp?: string
  ): Promise<boolean> {
    try {
      // Get the webhook secret from the database
      const supabase = createClient();
      const { data: webhook, error } = await supabase
        .from('webhook_configurations')
        .select('secret_key')
        .eq('id', webhookId)
        .single();

      if (error || !webhook) {
        console.error('Error fetching webhook configuration:', error);
        return false;
      }

      // If timestamp is provided, verify it's not too old (within 5 minutes)
      if (timestamp) {
        const timestampMs = parseInt(timestamp, 10);
        const now = Date.now();
        const fiveMinutesMs = 5 * 60 * 1000;
        
        if (isNaN(timestampMs) || now - timestampMs > fiveMinutesMs) {
          console.error('Webhook timestamp is invalid or too old');
          return false;
        }
      }

      // Create the signature using the secret key
      const signaturePayload = timestamp ? `${timestamp}.${payload}` : payload;
      const expectedSignature = crypto
        .createHmac('sha256', webhook.secret_key)
        .update(signaturePayload)
        .digest('hex');

      // Compare signatures using a constant-time comparison to prevent timing attacks
      return this.constantTimeCompare(signature, expectedSignature);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Generate a new webhook secret key
   * 
   * @returns string - A new random secret key
   */
  static generateSecretKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Constant-time comparison of two strings to prevent timing attacks
   * 
   * @param a - First string to compare
   * @param b - Second string to compare
   * @returns boolean - Whether the strings are equal
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
}

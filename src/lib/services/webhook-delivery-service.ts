import { createClient } from '@/lib/supabase/server';
import { WebhookSecurityService } from './webhook-security-service';

interface ProcessWebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
}

/**
 * Service for processing webhook deliveries
 */
export class WebhookDeliveryService {
  /**
   * Process pending webhook deliveries
   * 
   * @param limit - Maximum number of deliveries to process
   * @returns Number of deliveries processed
   */
  static async processPendingDeliveries(limit: number = 50): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    const supabase = createClient();
    
    // Get pending deliveries
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select('*, webhook_configurations!inner(*)')
      .eq('status', 'pending')
      .is('next_retry_at', null)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching pending webhook deliveries:', error);
      throw new Error(`Failed to fetch pending webhook deliveries: ${error.message}`);
    }
    
    if (!deliveries || deliveries.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }
    
    let succeeded = 0;
    let failed = 0;
    
    // Process each delivery
    for (const delivery of deliveries) {
      try {
        const result = await this.processDelivery(delivery);
        
        // Update the delivery status
        await this.updateDeliveryStatus(delivery.id, result);
        
        // Update the webhook configuration's last_triggered_at and failure_count
        await this.updateWebhookStatus(
          delivery.webhook_id,
          result.success,
          result.statusCode
        );
        
        if (result.success) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error processing webhook delivery ${delivery.id}:`, error);
        failed++;
        
        // Update the delivery as failed
        await this.updateDeliveryStatus(delivery.id, {
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    return {
      processed: deliveries.length,
      succeeded,
      failed,
    };
  }
  
  /**
   * Process a webhook delivery
   * 
   * @param delivery - The webhook delivery to process
   * @returns Result of the delivery attempt
   */
  private static async processDelivery(
    delivery: any
  ): Promise<ProcessWebhookDeliveryResult> {
    const webhook = delivery.webhook_configurations;
    
    if (!webhook || !webhook.is_active) {
      return {
        success: false,
        errorMessage: 'Webhook configuration is inactive or not found',
      };
    }
    
    try {
      // Prepare the payload
      const payload = JSON.stringify(delivery.payload);
      
      // Generate a timestamp for the request
      const timestamp = Date.now().toString();
      
      // Generate a signature for the payload
      const signature = await this.generateSignature(
        payload,
        webhook.secret_key,
        timestamp
      );
      
      // Send the webhook
      const response = await fetch(webhook.endpoint_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp,
          'X-Webhook-ID': delivery.webhook_id,
          'X-Event-Type': delivery.event_type,
          'User-Agent': 'FreshAI-CRM-Webhook/1.0',
        },
        body: payload,
      });
      
      // Get the response body
      let responseBody = '';
      try {
        responseBody = await response.text();
      } catch (e) {
        // Ignore errors when reading the response body
      }
      
      // Check if the request was successful
      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          responseBody,
        };
      } else {
        return {
          success: false,
          statusCode: response.status,
          responseBody,
          errorMessage: `HTTP error ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Update the status of a webhook delivery
   * 
   * @param deliveryId - The webhook delivery ID
   * @param result - The result of the delivery attempt
   */
  private static async updateDeliveryStatus(
    deliveryId: string,
    result: ProcessWebhookDeliveryResult
  ): Promise<void> {
    const supabase = createClient();
    
    const updates: any = {
      status: result.success ? 'success' : 'failed',
      attempt_count: supabase.rpc('increment', { inc: 1 }),
      completed_at: result.success ? new Date().toISOString() : null,
    };
    
    if (result.statusCode) {
      updates.status_code = result.statusCode;
    }
    
    if (result.responseBody) {
      updates.response_body = result.responseBody;
    }
    
    if (result.errorMessage) {
      updates.error_message = result.errorMessage;
    }
    
    // If failed, set next retry time based on attempt count
    if (!result.success) {
      const { data: delivery } = await supabase
        .from('webhook_deliveries')
        .select('attempt_count')
        .eq('id', deliveryId)
        .single();
      
      if (delivery) {
        const attemptCount = delivery.attempt_count + 1; // Add 1 for the current attempt
        
        // Exponential backoff: 5min, 15min, 1hr, 6hrs, 24hrs
        const retryDelays = [5, 15, 60, 360, 1440];
        const delayMinutes = retryDelays[Math.min(attemptCount - 1, retryDelays.length - 1)];
        
        if (attemptCount <= retryDelays.length) {
          const nextRetryAt = new Date();
          nextRetryAt.setMinutes(nextRetryAt.getMinutes() + delayMinutes);
          updates.next_retry_at = nextRetryAt.toISOString();
        } else {
          // No more retries
          updates.next_retry_at = null;
        }
      }
    }
    
    // Update the delivery
    const { error } = await supabase
      .from('webhook_deliveries')
      .update(updates)
      .eq('id', deliveryId);
    
    if (error) {
      console.error('Error updating webhook delivery status:', error);
      throw new Error(`Failed to update webhook delivery status: ${error.message}`);
    }
  }
  
  /**
   * Update the status of a webhook configuration
   * 
   * @param webhookId - The webhook configuration ID
   * @param success - Whether the delivery was successful
   * @param statusCode - The HTTP status code of the response
   */
  private static async updateWebhookStatus(
    webhookId: string,
    success: boolean,
    statusCode?: number
  ): Promise<void> {
    const supabase = createClient();
    
    const updates: any = {
      last_triggered_at: new Date().toISOString(),
    };
    
    if (!success) {
      updates.failure_count = supabase.rpc('increment', { inc: 1 });
    } else {
      updates.failure_count = 0;
    }
    
    const { error } = await supabase
      .from('webhook_configurations')
      .update(updates)
      .eq('id', webhookId);
    
    if (error) {
      console.error('Error updating webhook configuration status:', error);
      throw new Error(`Failed to update webhook configuration status: ${error.message}`);
    }
  }
  
  /**
   * Generate a signature for a webhook payload
   * 
   * @param payload - The payload to sign
   * @param secretKey - The webhook secret key
   * @param timestamp - The timestamp to include in the signature
   * @returns The generated signature
   */
  private static async generateSignature(
    payload: string,
    secretKey: string,
    timestamp: string
  ): Promise<string> {
    const crypto = require('crypto');
    
    // Create the signature using the secret key and timestamp
    const signaturePayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signaturePayload)
      .digest('hex');
    
    return signature;
  }
}

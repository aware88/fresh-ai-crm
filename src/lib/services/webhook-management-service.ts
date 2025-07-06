import { createClient } from '@/lib/supabase/server';
import { WebhookSecurityService } from './webhook-security-service';

interface WebhookConfiguration {
  id: string;
  organization_id: string;
  name: string;
  endpoint_url: string;
  secret_key: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_triggered_at: string | null;
  failure_count: number;
  metadata: Record<string, any> | null;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'success' | 'failed';
  status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  attempt_count: number;
  next_retry_at: string | null;
  created_at: string;
  completed_at: string | null;
}

interface CreateWebhookConfigurationParams {
  organization_id: string;
  name: string;
  endpoint_url: string;
  events: string[];
  metadata?: Record<string, any>;
}

interface UpdateWebhookConfigurationParams {
  name?: string;
  endpoint_url?: string;
  events?: string[];
  is_active?: boolean;
  metadata?: Record<string, any>;
}

interface QueueWebhookDeliveryParams {
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
}

/**
 * Service for managing webhook configurations and deliveries
 */
export class WebhookManagementService {
  /**
   * Create a new webhook configuration
   * 
   * @param params - Parameters for creating a webhook configuration
   * @returns The created webhook configuration
   */
  static async createWebhookConfiguration(
    params: CreateWebhookConfigurationParams
  ): Promise<WebhookConfiguration> {
    const supabase = createClient();
    
    // Generate a secret key for the webhook
    const secret_key = WebhookSecurityService.generateSecretKey();
    
    const { data, error } = await supabase
      .from('webhook_configurations')
      .insert({
        ...params,
        secret_key,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating webhook configuration:', error);
      throw new Error(`Failed to create webhook configuration: ${error.message}`);
    }
    
    return data as WebhookConfiguration;
  }
  
  /**
   * Get webhook configurations for an organization
   * 
   * @param organization_id - The organization ID
   * @returns Array of webhook configurations
   */
  static async getWebhookConfigurations(
    organization_id: string
  ): Promise<WebhookConfiguration[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching webhook configurations:', error);
      throw new Error(`Failed to fetch webhook configurations: ${error.message}`);
    }
    
    return data as WebhookConfiguration[];
  }
  
  /**
   * Get a webhook configuration by ID
   * 
   * @param id - The webhook configuration ID
   * @returns The webhook configuration or null if not found
   */
  static async getWebhookConfigurationById(
    id: string
  ): Promise<WebhookConfiguration | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error fetching webhook configuration:', error);
      throw new Error(`Failed to fetch webhook configuration: ${error.message}`);
    }
    
    return data as WebhookConfiguration;
  }
  
  /**
   * Update a webhook configuration
   * 
   * @param id - The webhook configuration ID
   * @param params - Parameters to update
   * @returns The updated webhook configuration
   */
  static async updateWebhookConfiguration(
    id: string,
    params: UpdateWebhookConfigurationParams
  ): Promise<WebhookConfiguration> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('webhook_configurations')
      .update({
        ...params,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating webhook configuration:', error);
      throw new Error(`Failed to update webhook configuration: ${error.message}`);
    }
    
    return data as WebhookConfiguration;
  }
  
  /**
   * Delete a webhook configuration
   * 
   * @param id - The webhook configuration ID
   * @returns True if successful
   */
  static async deleteWebhookConfiguration(id: string): Promise<boolean> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('webhook_configurations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting webhook configuration:', error);
      throw new Error(`Failed to delete webhook configuration: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Rotate the secret key for a webhook configuration
   * 
   * @param id - The webhook configuration ID
   * @returns The new secret key
   */
  static async rotateWebhookSecret(id: string): Promise<string> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('rotate_webhook_secret', { webhook_id: id });
    
    if (error) {
      console.error('Error rotating webhook secret:', error);
      throw new Error(`Failed to rotate webhook secret: ${error.message}`);
    }
    
    return data as string;
  }
  
  /**
   * Queue a webhook delivery
   * 
   * @param params - Parameters for queueing a webhook delivery
   * @returns The created webhook delivery
   */
  static async queueWebhookDelivery(
    params: QueueWebhookDeliveryParams
  ): Promise<WebhookDelivery> {
    const supabase = createClient();
    
    // Check if the webhook is active
    const { data: webhook, error: webhookError } = await supabase
      .from('webhook_configurations')
      .select('is_active, events')
      .eq('id', params.webhook_id)
      .single();
    
    if (webhookError) {
      console.error('Error fetching webhook configuration:', webhookError);
      throw new Error(`Failed to fetch webhook configuration: ${webhookError.message}`);
    }
    
    // Only queue if the webhook is active and subscribed to this event
    if (!webhook.is_active || !webhook.events.includes(params.event_type)) {
      throw new Error('Webhook is not active or not subscribed to this event');
    }
    
    // Queue the delivery
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: params.webhook_id,
        event_type: params.event_type,
        payload: params.payload,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error queueing webhook delivery:', error);
      throw new Error(`Failed to queue webhook delivery: ${error.message}`);
    }
    
    return data as WebhookDelivery;
  }
  
  /**
   * Get webhook deliveries for a webhook configuration
   * 
   * @param webhook_id - The webhook configuration ID
   * @param limit - Maximum number of deliveries to return
   * @param offset - Offset for pagination
   * @returns Array of webhook deliveries
   */
  static async getWebhookDeliveries(
    webhook_id: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WebhookDelivery[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhook_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching webhook deliveries:', error);
      throw new Error(`Failed to fetch webhook deliveries: ${error.message}`);
    }
    
    return data as WebhookDelivery[];
  }
  
  /**
   * Get a webhook delivery by ID
   * 
   * @param id - The webhook delivery ID
   * @returns The webhook delivery or null if not found
   */
  static async getWebhookDeliveryById(id: string): Promise<WebhookDelivery | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error fetching webhook delivery:', error);
      throw new Error(`Failed to fetch webhook delivery: ${error.message}`);
    }
    
    return data as WebhookDelivery;
  }
}

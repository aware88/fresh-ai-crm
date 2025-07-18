/**
 * Organization Settings Service
 * 
 * Handles organization-specific settings and configurations
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';

// Define types for organization settings (will be added to Database types after migration)
export interface OrganizationSettings {
  id: string;
  organization_id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettingsInsert {
  organization_id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  is_active?: boolean;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationSettingsUpdate {
  setting_value?: any;
  description?: string;
  is_active?: boolean;
  updated_at?: string;
}

export interface EmailDelayConfig {
  customer_service: {
    delay_minutes: number;
    description: string;
    enabled: boolean;
  };
  sales: {
    delay_minutes: number;
    description: string;
    enabled: boolean;
  };
  product_inquiry: {
    delay_minutes: number;
    description: string;
    enabled: boolean;
  };
  complaint: {
    delay_minutes: number;
    description: string;
    enabled: boolean;
  };
}

export interface AIProcessingConfig {
  openai_model: string;
  use_responses_api: boolean;
  enable_web_search: boolean;
  enable_function_calling: boolean;
  temperature: number;
  max_tokens: number;
  context_window: number;
}

export interface AutomotiveMatchingConfig {
  enabled: boolean;
  supported_brands: string[];
  product_categories: string[];
  year_range: {
    min: number;
    max: number;
  };
  matching_algorithm: string;
  confidence_threshold: number;
}

export interface UpsellingFrameworkConfig {
  enabled: boolean;
  strategies: {
    complementary_products: {
      enabled: boolean;
      weight: number;
      description: string;
    };
    premium_versions: {
      enabled: boolean;
      weight: number;
      description: string;
    };
    seasonal_items: {
      enabled: boolean;
      weight: number;
      description: string;
    };
    maintenance_products: {
      enabled: boolean;
      weight: number;
      description: string;
    };
  };
  max_suggestions: number;
  min_confidence: number;
}

export interface CommunicationPreferences {
  default_language: string;
  supported_languages: string[];
  business_hours: {
    timezone: string;
    [key: string]: any;
  };
  email_signature: {
    enabled: boolean;
    template: string;
  };
  auto_response_tone: string;
}

export interface IntegrationsConfig {
  metakocka: {
    enabled: boolean;
    sync_products: boolean;
    sync_contacts: boolean;
    sync_orders: boolean;
    sync_inventory: boolean;
    auto_sync_interval: number;
  };
  magento: {
    enabled: boolean;
    sync_products: boolean;
    sync_inventory: boolean;
    sync_customers: boolean;
    auto_sync_interval: number;
  };
}

export class OrganizationSettingsService {
  private supabase: ReturnType<typeof createLazyServerClient>;

  constructor() {
    this.supabase = createLazyServerClient();
  }

  /**
   * Get a specific setting for an organization
   */
  async getSetting<T = any>(
    organizationId: string,
    settingKey: string
  ): Promise<T | null> {
    const supabase = await this.supabase;
    
    const { data, error } = await supabase
      .from('organization_settings')
      .select('setting_value')
      .eq('organization_id', organizationId)
      .eq('setting_key', settingKey)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error(`Error getting setting ${settingKey}:`, error);
      return null;
    }

    return data?.setting_value as T || null;
  }

  /**
   * Get all settings for an organization
   */
  async getAllSettings(organizationId: string): Promise<Record<string, any>> {
    const supabase = await this.supabase;
    
    const { data, error } = await supabase
      .from('organization_settings')
      .select('setting_key, setting_value')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Error getting all settings:', error);
      return {};
    }

    return data?.reduce((acc, item) => {
      acc[item.setting_key] = item.setting_value;
      return acc;
    }, {} as Record<string, any>) || {};
  }

  /**
   * Update or create a setting for an organization
   */
  async updateSetting(
    organizationId: string,
    settingKey: string,
    settingValue: any,
    userId: string,
    description?: string
  ): Promise<boolean> {
    const supabase = await this.supabase;
    
    const { error } = await supabase
      .from('organization_settings')
      .upsert({
        organization_id: organizationId,
        setting_key: settingKey,
        setting_value: settingValue,
        description: description || null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`Error updating setting ${settingKey}:`, error);
      return false;
    }

    return true;
  }

  /**
   * Get email delay configuration for an organization
   */
  async getEmailDelayConfig(organizationId: string): Promise<EmailDelayConfig | null> {
    return await this.getSetting<EmailDelayConfig>(organizationId, 'email_delays');
  }

  /**
   * Get AI processing configuration for an organization
   */
  async getAIProcessingConfig(organizationId: string): Promise<AIProcessingConfig | null> {
    return await this.getSetting<AIProcessingConfig>(organizationId, 'ai_processing');
  }

  /**
   * Get automotive matching configuration for an organization
   */
  async getAutomotiveMatchingConfig(organizationId: string): Promise<AutomotiveMatchingConfig | null> {
    return await this.getSetting<AutomotiveMatchingConfig>(organizationId, 'automotive_matching');
  }

  /**
   * Get upselling framework configuration for an organization
   */
  async getUpsellingFrameworkConfig(organizationId: string): Promise<UpsellingFrameworkConfig | null> {
    return await this.getSetting<UpsellingFrameworkConfig>(organizationId, 'upselling_framework');
  }

  /**
   * Get communication preferences for an organization
   */
  async getCommunicationPreferences(organizationId: string): Promise<CommunicationPreferences | null> {
    return await this.getSetting<CommunicationPreferences>(organizationId, 'communication_preferences');
  }

  /**
   * Get integrations configuration for an organization
   */
  async getIntegrationsConfig(organizationId: string): Promise<IntegrationsConfig | null> {
    return await this.getSetting<IntegrationsConfig>(organizationId, 'integrations');
  }

  /**
   * Get email delay in minutes for a specific email type
   */
  async getEmailDelayForType(
    organizationId: string,
    emailType: 'customer_service' | 'sales' | 'product_inquiry' | 'complaint'
  ): Promise<number> {
    const config = await this.getEmailDelayConfig(organizationId);
    
    if (!config || !config[emailType] || !config[emailType].enabled) {
      return 0; // No delay by default
    }

    return config[emailType].delay_minutes;
  }

  /**
   * Check if an organization has a specific feature enabled
   */
  async isFeatureEnabled(
    organizationId: string,
    featurePath: string
  ): Promise<boolean> {
    const settings = await this.getAllSettings(organizationId);
    
    // Parse the feature path (e.g., "automotive_matching.enabled")
    const pathParts = featurePath.split('.');
    let current = settings;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }
    
    return Boolean(current);
  }

  /**
   * Get the default email delay configuration
   */
  static getDefaultEmailDelayConfig(): EmailDelayConfig {
    return {
      customer_service: {
        delay_minutes: 0,
        description: 'No delay for customer service emails',
        enabled: true
      },
      sales: {
        delay_minutes: 0,
        description: 'No delay for sales emails',
        enabled: true
      },
      product_inquiry: {
        delay_minutes: 0,
        description: 'No delay for product inquiry emails',
        enabled: true
      },
      complaint: {
        delay_minutes: 0,
        description: 'No delay for complaint emails',
        enabled: true
      }
    };
  }

  /**
   * Get the default AI processing configuration
   */
  static getDefaultAIProcessingConfig(): AIProcessingConfig {
    return {
      openai_model: 'gpt-4o',
      use_responses_api: true,
      enable_web_search: false,
      enable_function_calling: true,
      temperature: 0.7,
      max_tokens: 1000,
      context_window: 8000
    };
  }
} 
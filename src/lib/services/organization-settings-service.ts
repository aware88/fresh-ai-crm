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
  
  // Enhanced universal upsell settings
  discount_strategy: {
    enabled: boolean;
    max_discount_percent: number;
    offer_after_rejection: boolean;
    escalation_steps: Array<{
      step: number;
      discount_percent: number;
      trigger: 'rejection' | 'hesitation' | 'price_inquiry';
    }>;
  };
  
  // Product relationship mappings
  product_relationships: Array<{
    id: string;
    source_product_keywords: string[];
    target_product_id?: string;
    target_product_keywords: string[];
    relationship_type: 'complementary' | 'premium' | 'accessory' | 'bundle';
    confidence_score: number;
    auto_discovered: boolean; // true if discovered via email learning
    created_at: string;
    updated_at: string;
  }>;
  
  // Learning from email patterns
  email_learning: {
    enabled: boolean;
    learn_from_sent_emails: boolean;
    learn_from_successful_sales: boolean;
    min_pattern_confidence: number;
  };
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

export interface EULanguageConfig {
  enabled: boolean;
  languages: {
    [key: string]: {
      code: string;
      name: string;
      nativeName: string;
      enabled: boolean;
      defaultCurrency: string;
      businessHours: string;
      timeZone: string;
      vatRate: number;
      shippingDays: number;
      returnDays: number;
      formalityLevel: 'formal' | 'informal' | 'mixed';
      culturalNotes: string;
    };
  };
}

export interface EUCurrencyConfig {
  enabled: boolean;
  baseCurrency: string;
  supportedCurrencies: {
    [key: string]: {
      code: string;
      name: string;
      symbol: string;
      enabled: boolean;
      exchangeRateSource: string;
      decimalPlaces: number;
    };
  };
}

export interface EUCountryConfig {
  enabled: boolean;
  countries: {
    [key: string]: {
      code: string;
      name: string;
      language: string;
      currency: string;
      timeZone: string;
      businessHours: string;
      vatRate: number;
      shippingDays: number;
      returnDays: number;
      postalCodeFormat: string;
      phoneFormat: string;
      addressFormat: string;
      holidayCalendar: string[];
      shippingRestrictions: string[];
      paymentMethods: string[];
    };
  };
}

export interface SeasonalRecommendationConfig {
  enabled: boolean;
  seasons: {
    [key: string]: {
      name: string;
      startMonth: number;
      endMonth: number;
      productCategories: string[];
      upsellStrategies: string[];
      marketingMessages: {
        [language: string]: string;
      };
    };
  };
  weatherBasedRecommendations: boolean;
  maintenanceScheduleIntegration: boolean;
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
   * Get organization settings (alias for getAllSettings for compatibility)
   */
  async getSettings(organizationId: string): Promise<any> {
    const settings = await this.getAllSettings(organizationId);
    
    // Return default AI processing config if no settings exist
    if (Object.keys(settings).length === 0) {
      return OrganizationSettingsService.getDefaultAIProcessingConfig();
    }
    
    // Merge with defaults to ensure required properties exist
    const defaults = OrganizationSettingsService.getDefaultAIProcessingConfig();
    return {
      ...defaults,
      ...settings
    };
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
    const config = await this.getSetting<UpsellingFrameworkConfig>(organizationId, 'upselling_framework');
    
    // Return default configuration if none exists
    if (!config) {
      return this.getDefaultUpsellingConfig();
    }
    
    return config;
  }

  /**
   * Get default upselling framework configuration
   */
  private getDefaultUpsellingConfig(): UpsellingFrameworkConfig {
    return {
      enabled: true,
      strategies: {
        complementary_products: {
          enabled: true,
          weight: 0.8,
          description: 'Products that work well together'
        },
        premium_versions: {
          enabled: true,
          weight: 0.7,
          description: 'Higher-end versions of the same product'
        },
        seasonal_items: {
          enabled: false,
          weight: 0.6,
          description: 'Seasonal or time-sensitive items'
        },
        maintenance_products: {
          enabled: false,
          weight: 0.5,
          description: 'Maintenance or care products'
        }
      },
      max_suggestions: 3,
      min_confidence: 0.6,
      discount_strategy: {
        enabled: true,
        max_discount_percent: 15,
        offer_after_rejection: true,
        escalation_steps: [
          {
            step: 1,
            discount_percent: 5,
            trigger: 'price_inquiry'
          },
          {
            step: 1,
            discount_percent: 10,
            trigger: 'rejection'
          },
          {
            step: 2,
            discount_percent: 15,
            trigger: 'rejection'
          }
        ]
      },
      product_relationships: [],
      email_learning: {
        enabled: true,
        learn_from_sent_emails: true,
        learn_from_successful_sales: true,
        min_pattern_confidence: 0.7
      }
    };
  }

  /**
   * Add a product relationship for upselling
   */
  async addProductRelationship(
    organizationId: string,
    sourceProductKeywords: string[],
    targetProductKeywords: string[],
    relationshipType: 'complementary' | 'premium' | 'accessory' | 'bundle',
    confidenceScore: number = 0.8,
    targetProductId?: string
  ): Promise<void> {
    const config = await this.getUpsellingFrameworkConfig(organizationId);
    if (!config) return;

    const newRelationship = {
      id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_product_keywords: sourceProductKeywords,
      target_product_id: targetProductId,
      target_product_keywords: targetProductKeywords,
      relationship_type: relationshipType,
      confidence_score: confidenceScore,
      auto_discovered: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    config.product_relationships.push(newRelationship);
    
    await this.updateSetting(organizationId, 'upselling_framework', config);
  }

  /**
   * Update upselling framework configuration
   */
  async updateUpsellingFrameworkConfig(
    organizationId: string,
    config: Partial<UpsellingFrameworkConfig>
  ): Promise<void> {
    const currentConfig = await this.getUpsellingFrameworkConfig(organizationId);
    if (!currentConfig) return;

    const updatedConfig = { ...currentConfig, ...config };
    await this.updateSetting(organizationId, 'upselling_framework', updatedConfig);
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
   * Get EU language configuration
   */
  async getEULanguageConfig(organizationId: string): Promise<EULanguageConfig> {
    const setting = await this.getSetting(organizationId, 'eu_language_config');
    
    if (!setting) {
      return this.getDefaultEULanguageConfig();
    }
    
    return setting as EULanguageConfig;
  }

  /**
   * Get EU currency configuration
   */
  async getEUCurrencyConfig(organizationId: string): Promise<EUCurrencyConfig> {
    const setting = await this.getSetting(organizationId, 'eu_currency_config');
    
    if (!setting) {
      return this.getDefaultEUCurrencyConfig();
    }
    
    return setting as EUCurrencyConfig;
  }

  /**
   * Get EU country configuration
   */
  async getEUCountryConfig(organizationId: string): Promise<EUCountryConfig> {
    const setting = await this.getSetting(organizationId, 'eu_country_config');
    
    if (!setting) {
      return this.getDefaultEUCountryConfig();
    }
    
    return setting as EUCountryConfig;
  }

  /**
   * Get seasonal recommendation configuration
   */
  async getSeasonalRecommendationConfig(organizationId: string): Promise<SeasonalRecommendationConfig> {
    const setting = await this.getSetting(organizationId, 'seasonal_recommendation_config');
    
    if (!setting) {
      return this.getDefaultSeasonalRecommendationConfig();
    }
    
    return setting as SeasonalRecommendationConfig;
  }

  /**
   * Set EU language configuration
   */
  async setEULanguageConfig(
    organizationId: string,
    config: EULanguageConfig,
    userId: string
  ): Promise<void> {
    await this.updateSetting(
      organizationId,
      'eu_language_config',
      config,
      userId,
      'EU multilanguage support configuration'
    );
  }

  /**
   * Set EU currency configuration
   */
  async setEUCurrencyConfig(
    organizationId: string,
    config: EUCurrencyConfig,
    userId: string
  ): Promise<void> {
    await this.updateSetting(
      organizationId,
      'eu_currency_config',
      config,
      userId,
      'EU currency support configuration'
    );
  }

  /**
   * Set EU country configuration
   */
  async setEUCountryConfig(
    organizationId: string,
    config: EUCountryConfig,
    userId: string
  ): Promise<void> {
    await this.updateSetting(
      organizationId,
      'eu_country_config',
      config,
      userId,
      'EU country-specific business rules'
    );
  }

  /**
   * Set seasonal recommendation configuration
   */
  async setSeasonalRecommendationConfig(
    organizationId: string,
    config: SeasonalRecommendationConfig,
    userId: string
  ): Promise<void> {
    await this.updateSetting(
      organizationId,
      'seasonal_recommendation_config',
      config,
      userId,
      'Seasonal product recommendation configuration'
    );
  }

  /**
   * Get default EU language configuration
   */
  private getDefaultEULanguageConfig(): EULanguageConfig {
    return {
      enabled: true,
      languages: {
        'en': {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/London',
          vatRate: 0.20,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'mixed',
          culturalNotes: 'Direct communication style, punctuality valued'
        },
        'de': {
          code: 'de',
          name: 'German',
          nativeName: 'Deutsch',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Berlin',
          vatRate: 0.19,
          shippingDays: 2,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Prefer formal communication, precision and punctuality highly valued'
        },
        'fr': {
          code: 'fr',
          name: 'French',
          nativeName: 'Français',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Paris',
          vatRate: 0.20,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal communication preferred, especially in business contexts'
        },
        'it': {
          code: 'it',
          name: 'Italian',
          nativeName: 'Italiano',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Rome',
          vatRate: 0.22,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Relationship-focused, formal business communication'
        },
        'es': {
          code: 'es',
          name: 'Spanish',
          nativeName: 'Español',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Madrid',
          vatRate: 0.21,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal business communication, relationship-building important'
        },
        'nl': {
          code: 'nl',
          name: 'Dutch',
          nativeName: 'Nederlands',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Amsterdam',
          vatRate: 0.21,
          shippingDays: 2,
          returnDays: 14,
          formalityLevel: 'mixed',
          culturalNotes: 'Direct communication style, informal but respectful'
        },
        'pt': {
          code: 'pt',
          name: 'Portuguese',
          nativeName: 'Português',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Lisbon',
          vatRate: 0.23,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal business communication, relationship-oriented'
        },
        'pl': {
          code: 'pl',
          name: 'Polish',
          nativeName: 'Polski',
          enabled: true,
          defaultCurrency: 'PLN',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Warsaw',
          vatRate: 0.23,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal communication preferred, hierarchy respected'
        },
        'cs': {
          code: 'cs',
          name: 'Czech',
          nativeName: 'Čeština',
          enabled: true,
          defaultCurrency: 'CZK',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Prague',
          vatRate: 0.21,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal business communication, punctuality valued'
        },
        'sk': {
          code: 'sk',
          name: 'Slovak',
          nativeName: 'Slovenčina',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Bratislava',
          vatRate: 0.20,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal communication preferred, personal relationships important'
        },
        'hu': {
          code: 'hu',
          name: 'Hungarian',
          nativeName: 'Magyar',
          enabled: true,
          defaultCurrency: 'HUF',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Budapest',
          vatRate: 0.27,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Very formal communication, hierarchy important'
        },
        'sl': {
          code: 'sl',
          name: 'Slovenian',
          nativeName: 'Slovenščina',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Ljubljana',
          vatRate: 0.22,
          shippingDays: 2,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal business communication, punctuality and precision valued'
        },
        'ro': {
          code: 'ro',
          name: 'Romanian',
          nativeName: 'Română',
          enabled: true,
          defaultCurrency: 'RON',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Bucharest',
          vatRate: 0.19,
          shippingDays: 4,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal communication, relationship-building important'
        },
        'bg': {
          code: 'bg',
          name: 'Bulgarian',
          nativeName: 'Български',
          enabled: true,
          defaultCurrency: 'BGN',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Sofia',
          vatRate: 0.20,
          shippingDays: 4,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal communication preferred, hierarchy respected'
        },
        'hr': {
          code: 'hr',
          name: 'Croatian',
          nativeName: 'Hrvatski',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Zagreb',
          vatRate: 0.25,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal business communication, personal relationships valued'
        },
        'lv': {
          code: 'lv',
          name: 'Latvian',
          nativeName: 'Latviešu',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Riga',
          vatRate: 0.21,
          shippingDays: 4,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal communication, punctuality highly valued'
        },
        'lt': {
          code: 'lt',
          name: 'Lithuanian',
          nativeName: 'Lietuvių',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Vilnius',
          vatRate: 0.21,
          shippingDays: 4,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal communication, conservative business approach'
        },
        'et': {
          code: 'et',
          name: 'Estonian',
          nativeName: 'Eesti',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Tallinn',
          vatRate: 0.20,
          shippingDays: 4,
          returnDays: 14,
          formalityLevel: 'mixed',
          culturalNotes: 'Direct communication, digital-first approach'
        },
        'fi': {
          code: 'fi',
          name: 'Finnish',
          nativeName: 'Suomi',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Helsinki',
          vatRate: 0.24,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'mixed',
          culturalNotes: 'Direct communication, silence is acceptable'
        },
        'sv': {
          code: 'sv',
          name: 'Swedish',
          nativeName: 'Svenska',
          enabled: true,
          defaultCurrency: 'SEK',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Stockholm',
          vatRate: 0.25,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'informal',
          culturalNotes: 'Informal communication, consensus-building important'
        },
        'da': {
          code: 'da',
          name: 'Danish',
          nativeName: 'Dansk',
          enabled: true,
          defaultCurrency: 'DKK',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Copenhagen',
          vatRate: 0.25,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'informal',
          culturalNotes: 'Informal communication, direct and honest approach'
        },
        'el': {
          code: 'el',
          name: 'Greek',
          nativeName: 'Ελληνικά',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Athens',
          vatRate: 0.24,
          shippingDays: 4,
          returnDays: 14,
          formalityLevel: 'formal',
          culturalNotes: 'Formal communication, relationship-building crucial'
        },
        'mt': {
          code: 'mt',
          name: 'Maltese',
          nativeName: 'Malti',
          enabled: true,
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Malta',
          vatRate: 0.18,
          shippingDays: 4,
          returnDays: 14,
          formalityLevel: 'mixed',
          culturalNotes: 'Mix of formal and informal, relationship-focused'
        },
        'ga': {
          code: 'ga',
          name: 'Irish',
          nativeName: 'Gaeilge',
          enabled: false, // Usually handled in English
          defaultCurrency: 'EUR',
          businessHours: '09:00-17:00',
          timeZone: 'Europe/Dublin',
          vatRate: 0.23,
          shippingDays: 3,
          returnDays: 14,
          formalityLevel: 'mixed',
          culturalNotes: 'Generally use English for business communication'
        }
      }
    };
  }

  /**
   * Get default EU currency configuration
   */
  private getDefaultEUCurrencyConfig(): EUCurrencyConfig {
    return {
      enabled: true,
      baseCurrency: 'EUR',
      supportedCurrencies: {
        'EUR': {
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'USD': {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'GBP': {
          code: 'GBP',
          name: 'British Pound',
          symbol: '£',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'CHF': {
          code: 'CHF',
          name: 'Swiss Franc',
          symbol: 'CHF',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'SEK': {
          code: 'SEK',
          name: 'Swedish Krona',
          symbol: 'kr',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'DKK': {
          code: 'DKK',
          name: 'Danish Krone',
          symbol: 'kr',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'NOK': {
          code: 'NOK',
          name: 'Norwegian Krone',
          symbol: 'kr',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'PLN': {
          code: 'PLN',
          name: 'Polish Zloty',
          symbol: 'zł',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'CZK': {
          code: 'CZK',
          name: 'Czech Koruna',
          symbol: 'Kč',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'HUF': {
          code: 'HUF',
          name: 'Hungarian Forint',
          symbol: 'Ft',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 0
        },
        'RON': {
          code: 'RON',
          name: 'Romanian Leu',
          symbol: 'lei',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        },
        'BGN': {
          code: 'BGN',
          name: 'Bulgarian Lev',
          symbol: 'лв',
          enabled: true,
          exchangeRateSource: 'ECB',
          decimalPlaces: 2
        }
      }
    };
  }

  /**
   * Get default EU country configuration
   */
  private getDefaultEUCountryConfig(): EUCountryConfig {
    return {
      enabled: true,
      countries: {
        'DE': {
          code: 'DE',
          name: 'Germany',
          language: 'de',
          currency: 'EUR',
          timeZone: 'Europe/Berlin',
          businessHours: '09:00-17:00',
          vatRate: 0.19,
          shippingDays: 2,
          returnDays: 14,
          postalCodeFormat: '\\d{5}',
          phoneFormat: '+49 \\d{2,4} \\d{6,8}',
          addressFormat: 'street, postalCode city',
          holidayCalendar: ['2024-01-01', '2024-12-25', '2024-12-26'],
          shippingRestrictions: [],
          paymentMethods: ['credit_card', 'paypal', 'bank_transfer', 'sofort']
        },
        'FR': {
          code: 'FR',
          name: 'France',
          language: 'fr',
          currency: 'EUR',
          timeZone: 'Europe/Paris',
          businessHours: '09:00-17:00',
          vatRate: 0.20,
          shippingDays: 3,
          returnDays: 14,
          postalCodeFormat: '\\d{5}',
          phoneFormat: '+33 \\d{1} \\d{8}',
          addressFormat: 'street, postalCode city',
          holidayCalendar: ['2024-01-01', '2024-12-25'],
          shippingRestrictions: [],
          paymentMethods: ['credit_card', 'paypal', 'bank_transfer']
        },
        'IT': {
          code: 'IT',
          name: 'Italy',
          language: 'it',
          currency: 'EUR',
          timeZone: 'Europe/Rome',
          businessHours: '09:00-17:00',
          vatRate: 0.22,
          shippingDays: 3,
          returnDays: 14,
          postalCodeFormat: '\\d{5}',
          phoneFormat: '+39 \\d{2,4} \\d{6,8}',
          addressFormat: 'street, postalCode city',
          holidayCalendar: ['2024-01-01', '2024-12-25', '2024-12-26'],
          shippingRestrictions: [],
          paymentMethods: ['credit_card', 'paypal', 'bank_transfer']
        },
        'ES': {
          code: 'ES',
          name: 'Spain',
          language: 'es',
          currency: 'EUR',
          timeZone: 'Europe/Madrid',
          businessHours: '09:00-17:00',
          vatRate: 0.21,
          shippingDays: 3,
          returnDays: 14,
          postalCodeFormat: '\\d{5}',
          phoneFormat: '+34 \\d{9}',
          addressFormat: 'street, postalCode city',
          holidayCalendar: ['2024-01-01', '2024-12-25'],
          shippingRestrictions: [],
          paymentMethods: ['credit_card', 'paypal', 'bank_transfer']
        },
        'NL': {
          code: 'NL',
          name: 'Netherlands',
          language: 'nl',
          currency: 'EUR',
          timeZone: 'Europe/Amsterdam',
          businessHours: '09:00-17:00',
          vatRate: 0.21,
          shippingDays: 2,
          returnDays: 14,
          postalCodeFormat: '\\d{4}[A-Z]{2}',
          phoneFormat: '+31 \\d{2} \\d{7}',
          addressFormat: 'street, postalCode city',
          holidayCalendar: ['2024-01-01', '2024-12-25', '2024-12-26'],
          shippingRestrictions: [],
          paymentMethods: ['credit_card', 'paypal', 'bank_transfer', 'ideal']
        },
        'SI': {
          code: 'SI',
          name: 'Slovenia',
          language: 'sl',
          currency: 'EUR',
          timeZone: 'Europe/Ljubljana',
          businessHours: '09:00-17:00',
          vatRate: 0.22,
          shippingDays: 2,
          returnDays: 14,
          postalCodeFormat: '\\d{4}',
          phoneFormat: '+386 \\d{2} \\d{6}',
          addressFormat: 'street, postalCode city',
          holidayCalendar: ['2024-01-01', '2024-12-25', '2024-12-26'],
          shippingRestrictions: [],
          paymentMethods: ['credit_card', 'paypal', 'bank_transfer']
        }
        // Add more countries as needed
      }
    };
  }

  /**
   * Get default seasonal recommendation configuration
   */
  private getDefaultSeasonalRecommendationConfig(): SeasonalRecommendationConfig {
    return {
      enabled: true,
      seasons: {
        'winter': {
          name: 'Winter',
          startMonth: 12,
          endMonth: 2,
          productCategories: ['winter_tires', 'antifreeze', 'car_heaters', 'ice_scrapers', 'winter_accessories'],
          upsellStrategies: ['cold_weather_protection', 'winter_maintenance', 'safety_equipment'],
          marketingMessages: {
            'en': 'Prepare your car for winter with our cold weather essentials',
            'de': 'Bereiten Sie Ihr Auto mit unseren Winterartikeln auf die kalte Jahreszeit vor',
            'fr': 'Préparez votre voiture pour l\'hiver avec nos articles de saison froide',
            'it': 'Prepara la tua auto per l\'inverno con i nostri articoli per il freddo',
            'es': 'Prepara tu coche para el invierno con nuestros artículos de clima frío',
            'sl': 'Pripravite svoj avtomobil na zimo z našimi zimskimi artikli'
          }
        },
        'spring': {
          name: 'Spring',
          startMonth: 3,
          endMonth: 5,
          productCategories: ['spring_maintenance', 'car_wash', 'filters', 'fluids', 'spring_tires'],
          upsellStrategies: ['maintenance_refresh', 'spring_cleaning', 'performance_optimization'],
          marketingMessages: {
            'en': 'Spring into action with our maintenance essentials',
            'de': 'Starten Sie mit unseren Wartungsartikeln in den Frühling',
            'fr': 'Démarrez le printemps avec nos produits d\'entretien',
            'it': 'Inizia la primavera con i nostri articoli per la manutenzione',
            'es': 'Comienza la primavera con nuestros artículos de mantenimiento',
            'sl': 'Začnite pomlad z našimi vzdrževalnimi artikli'
          }
        },
        'summer': {
          name: 'Summer',
          startMonth: 6,
          endMonth: 8,
          productCategories: ['summer_tires', 'cooling_system', 'air_conditioning', 'sun_protection', 'travel_accessories'],
          upsellStrategies: ['cooling_solutions', 'travel_preparation', 'performance_enhancement'],
          marketingMessages: {
            'en': 'Beat the heat with our summer driving essentials',
            'de': 'Trotzen Sie der Hitze mit unseren Sommer-Fahrartikeln',
            'fr': 'Battez la chaleur avec nos articles de conduite d\'été',
            'it': 'Affronta il caldo con i nostri articoli per la guida estiva',
            'es': 'Vence el calor con nuestros artículos de conducción de verano',
            'sl': 'Premagajte vročino z našimi poletnimi voznimi artikli'
          }
        },
        'autumn': {
          name: 'Autumn',
          startMonth: 9,
          endMonth: 11,
          productCategories: ['autumn_maintenance', 'tire_change', 'lighting', 'wipers', 'preparation'],
          upsellStrategies: ['winter_preparation', 'maintenance_check', 'safety_upgrade'],
          marketingMessages: {
            'en': 'Prepare for winter with our autumn maintenance essentials',
            'de': 'Bereiten Sie sich mit unseren Herbst-Wartungsartikeln auf den Winter vor',
            'fr': 'Préparez-vous pour l\'hiver avec nos articles d\'entretien d\'automne',
            'it': 'Preparati per l\'inverno con i nostri articoli per la manutenzione autunnale',
            'es': 'Prepárate para el invierno con nuestros artículos de mantenimiento de otoño',
            'sl': 'Pripravite se na zimo z našimi jesenskimi vzdrževalnimi artikli'
          }
        }
      },
      weatherBasedRecommendations: true,
      maintenanceScheduleIntegration: true
    };
  }

  /**
   * Get language settings for a specific language code
   */
  async getLanguageSettings(organizationId: string, languageCode: string): Promise<any> {
    const config = await this.getEULanguageConfig(organizationId);
    return config.languages[languageCode] || config.languages['en'];
  }

  /**
   * Get country settings for a specific country code
   */
  async getCountrySettings(organizationId: string, countryCode: string): Promise<any> {
    const config = await this.getEUCountryConfig(organizationId);
    return config.countries[countryCode];
  }

  /**
   * Get currency settings for a specific currency code
   */
  async getCurrencySettings(organizationId: string, currencyCode: string): Promise<any> {
    const config = await this.getEUCurrencyConfig(organizationId);
    return config.supportedCurrencies[currencyCode];
  }

  /**
   * Get seasonal recommendations for current date
   */
  async getCurrentSeasonalRecommendations(organizationId: string): Promise<any> {
    const config = await this.getSeasonalRecommendationConfig(organizationId);
    const currentMonth = new Date().getMonth() + 1;
    
    for (const [seasonKey, season] of Object.entries(config.seasons)) {
      if (currentMonth >= season.startMonth && currentMonth <= season.endMonth) {
        return season;
      }
    }
    
    return null;
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
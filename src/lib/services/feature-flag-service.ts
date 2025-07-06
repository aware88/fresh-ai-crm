import { SubscriptionStatusService } from './subscription-status-service';

/**
 * Feature definitions with their default values and descriptions
 */
export const FEATURES = {
  // Core Features
  CONTACTS: { default: true, description: 'Access to contacts management' },
  SALES_DOCUMENTS: { default: true, description: 'Access to sales documents' },
  PRODUCTS: { default: true, description: 'Access to product management' },
  
  // Metakocka Integration Features
  METAKOCKA_INTEGRATION: { default: false, description: 'Access to Metakocka ERP integration' },
  METAKOCKA_PRODUCT_SYNC: { default: false, description: 'Sync products with Metakocka' },
  METAKOCKA_CONTACT_SYNC: { default: false, description: 'Sync contacts with Metakocka' },
  METAKOCKA_SALES_DOCUMENT_SYNC: { default: false, description: 'Sync sales documents with Metakocka' },
  METAKOCKA_ORDER_MANAGEMENT: { default: false, description: 'Order management with Metakocka' },
  
  // AI Features
  AI_EMAIL_RESPONSES: { default: false, description: 'AI-powered email responses' },
  AI_PRODUCT_RECOMMENDATIONS: { default: false, description: 'AI product recommendations' },
  AI_SALES_INSIGHTS: { default: false, description: 'AI sales insights and analytics' },
  
  // Advanced Features
  BULK_OPERATIONS: { default: false, description: 'Bulk operations for contacts and products' },
  ADVANCED_REPORTING: { default: false, description: 'Advanced reporting and analytics' },
  API_ACCESS: { default: false, description: 'API access for custom integrations' },
  CUSTOM_FIELDS: { default: false, description: 'Custom fields for contacts and products' },
  
  // Usage Limits (numbers represent limits)
  MAX_CONTACTS: { default: 100, description: 'Maximum number of contacts' },
  MAX_PRODUCTS: { default: 50, description: 'Maximum number of products' },
  MAX_SALES_DOCUMENTS: { default: 100, description: 'Maximum number of sales documents' },
  MAX_STORAGE_GB: { default: 1, description: 'Maximum storage in GB' },
  MAX_USERS: { default: 2, description: 'Maximum number of users' },
} as const;

export type FeatureKey = keyof typeof FEATURES;

export class FeatureFlagService {
  private subscriptionStatusService: SubscriptionStatusService;
  
  constructor() {
    this.subscriptionStatusService = new SubscriptionStatusService();
  }

  /**
   * Check if a feature is enabled for an organization
   */
  async isFeatureEnabled(organizationId: string, featureKey: FeatureKey): Promise<boolean> {
    // For features that should always be enabled regardless of subscription
    if (this.isAlwaysEnabledFeature(featureKey)) {
      return true;
    }
    
    const { hasAccess } = await this.subscriptionStatusService.hasFeatureAccess(organizationId, featureKey);
    return hasAccess;
  }

  /**
   * Get the limit for a specific feature
   */
  async getFeatureLimit(organizationId: string, featureKey: FeatureKey): Promise<number> {
    const limit = await this.subscriptionStatusService.getFeatureLimit(organizationId, featureKey);
    
    // If no limit is defined in the subscription, use the default
    if (limit === null) {
      const defaultLimit = FEATURES[featureKey].default;
      return typeof defaultLimit === 'number' ? defaultLimit : Infinity;
    }
    
    return limit;
  }

  /**
   * Check if the organization has exceeded a limit
   */
  async hasExceededLimit(
    organizationId: string, 
    featureKey: FeatureKey, 
    currentUsage: number
  ): Promise<boolean> {
    const limit = await this.getFeatureLimit(organizationId, featureKey);
    return currentUsage >= limit;
  }

  /**
   * Get all features and their status for an organization
   */
  async getAllFeatureStatuses(organizationId: string): Promise<Record<FeatureKey, { enabled: boolean; limit?: number }>> {
    const result: Partial<Record<FeatureKey, { enabled: boolean; limit?: number }>> = {};
    
    for (const featureKey of Object.keys(FEATURES) as FeatureKey[]) {
      const enabled = await this.isFeatureEnabled(organizationId, featureKey);
      
      if (typeof FEATURES[featureKey].default === 'number') {
        const limit = await this.getFeatureLimit(organizationId, featureKey);
        result[featureKey] = { enabled, limit };
      } else {
        result[featureKey] = { enabled };
      }
    }
    
    return result as Record<FeatureKey, { enabled: boolean; limit?: number }>;
  }

  /**
   * Check if a feature should always be enabled regardless of subscription
   */
  private isAlwaysEnabledFeature(featureKey: FeatureKey): boolean {
    // Core features that should always be available
    const alwaysEnabledFeatures: FeatureKey[] = [
      'CONTACTS',
      'SALES_DOCUMENTS',
      'PRODUCTS'
    ];
    
    return alwaysEnabledFeatures.includes(featureKey);
  }
}

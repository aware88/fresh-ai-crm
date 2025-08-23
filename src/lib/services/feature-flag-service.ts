/**
 * Feature Flag Service
 * 
 * This service handles feature availability based on subscription plans
 * and enforces restrictions for different tiers.
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getSubscriptionPlan } from '@/lib/subscription-plans';
import { proBoostService } from '@/lib/services/pro-boost-service';

export interface FeatureCheck {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentPlan?: string;
  requiredPlan?: string;
}

export class FeatureFlagService {
  // createClient() returns a Promise-wrapped client; store and await where needed
  private supabasePromise = createClient();

  /**
   * Check if organization has access to a specific feature
   */
  async hasFeatureAccess(
    organizationId: string, 
    feature: string
  ): Promise<FeatureCheck> {
    try {
      // Get organization's subscription plan
      const supabase = await this.supabasePromise;
      const { data: org, error } = await supabase
        .from('organizations')
        .select('subscription_tier')
        .eq('id', organizationId)
        .single();

      if (error || !org) {
        return {
          hasAccess: false,
          reason: 'Organization not found',
          upgradeRequired: false
        };
      }

      const plan = getSubscriptionPlan(org.subscription_tier.toLowerCase());
      if (!plan) {
        return {
          hasAccess: false,
          reason: 'Invalid subscription plan',
          upgradeRequired: true,
          currentPlan: org.subscription_tier
        };
      }

      let hasAccess = !!plan.features[feature];

      if (!hasAccess) {
        // Allow feature temporarily if Pro Boost is active
        const proBoost = await proBoostService.getStatus(organizationId);
        if (proBoost.active) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        // Determine which plan is required for this feature
        let requiredPlan = 'Pro';
        if (feature === 'ERP_INTEGRATION' || feature === 'WHITE_LABEL' || feature === 'CUSTOM_INTEGRATIONS' || feature === 'WHATSAPP_INTEGRATION') {
          requiredPlan = 'Premium';
        }

        return {
          hasAccess: false,
          reason: `Feature '${feature}' requires ${requiredPlan} plan`,
          upgradeRequired: true,
          currentPlan: plan.name,
          requiredPlan
        };
      }

      return {
        hasAccess: true,
        currentPlan: plan.name
      };

    } catch (error) {
      console.error('Error checking feature access:', error);
      return {
        hasAccess: false,
        reason: 'Error checking feature access',
        upgradeRequired: false
      };
    }
  }

  /**
   * Check psychological profiling access
   */
  async canUsePsychologicalProfiling(organizationId: string): Promise<FeatureCheck> {
    return this.hasFeatureAccess(organizationId, 'PSYCHOLOGICAL_PROFILING');
  }

  /**
   * Check CRM Assistant access
   */
  async canUseCRMAssistant(organizationId: string): Promise<FeatureCheck> {
    return this.hasFeatureAccess(organizationId, 'CRM_ASSISTANT');
  }

  /**
   * Check AI Drafting Assistance access
   */
  async canUseAIDrafting(organizationId: string): Promise<FeatureCheck> {
    return this.hasFeatureAccess(organizationId, 'AI_DRAFTING_ASSISTANCE');
  }

  /**
   * Check Sales Tactics access
   */
  async canUseSalesTactics(organizationId: string): Promise<FeatureCheck> {
    return this.hasFeatureAccess(organizationId, 'SALES_TACTICS');
  }

  /**
   * Check Personality Insights access
   */
  async canUsePersonalityInsights(organizationId: string): Promise<FeatureCheck> {
    return this.hasFeatureAccess(organizationId, 'PERSONALITY_INSIGHTS');
  }

  /**
   * Check ERP Integration access
   */
  async canUseERPIntegration(organizationId: string): Promise<FeatureCheck> {
    return this.hasFeatureAccess(organizationId, 'ERP_INTEGRATION');
  }

  /**
   * Check AI Future access
   */
  async canUseAIFuture(organizationId: string): Promise<FeatureCheck> {
    return this.hasFeatureAccess(organizationId, 'AI_FUTURE_ACCESS');
  }

  /**
   * Get all feature restrictions for an organization
   */
  async getFeatureRestrictions(organizationId: string): Promise<{
    plan: string;
    features: Record<string, boolean>;
    restrictions: string[];
    upgradeRecommendations: string[];
  }> {
    try {
      const supabase = await this.supabasePromise;
      const { data: org, error } = await supabase
        .from('organizations')
        .select('subscription_tier')
        .eq('id', organizationId)
        .single();

      if (error || !org) {
        return {
          plan: 'Unknown',
          features: {},
          restrictions: ['Organization not found'],
          upgradeRecommendations: []
        };
      }

      const plan = getSubscriptionPlan(org.subscription_tier.toLowerCase());
      if (!plan) {
        return {
          plan: org.subscription_tier,
          features: {},
          restrictions: ['Invalid subscription plan'],
          upgradeRecommendations: ['Contact support to resolve plan issues']
        };
      }

      const restrictions: string[] = [];
      const upgradeRecommendations: string[] = [];

      // Check key features and build restrictions list
      const keyFeatures = [
        'PSYCHOLOGICAL_PROFILING',
        'CRM_ASSISTANT', 
        'AI_DRAFTING_ASSISTANCE',
        'SALES_TACTICS',
        'PERSONALITY_INSIGHTS',
        'ERP_INTEGRATION',
        'AI_FUTURE_ACCESS'
      ];

      keyFeatures.forEach(feature => {
        if (!plan.features[feature]) {
          switch (feature) {
            case 'PSYCHOLOGICAL_PROFILING':
              restrictions.push('Psychological profiling not available');
              upgradeRecommendations.push('Upgrade to Pro for psychological profiling');
              break;
            case 'CRM_ASSISTANT':
              restrictions.push('CRM Assistant not available');
              upgradeRecommendations.push('Upgrade to Pro for CRM Assistant');
              break;
            case 'AI_DRAFTING_ASSISTANCE':
              restrictions.push('AI drafting assistance not available');
              upgradeRecommendations.push('Upgrade to Pro for AI drafting assistance');
              break;
            case 'SALES_TACTICS':
              restrictions.push('Sales tactics not available');
              upgradeRecommendations.push('Upgrade to Pro for sales tactics');
              break;
            case 'PERSONALITY_INSIGHTS':
              restrictions.push('Personality insights not available');
              upgradeRecommendations.push('Upgrade to Pro for personality insights');
              break;
            case 'ERP_INTEGRATION':
              restrictions.push('ERP integration not available');
              upgradeRecommendations.push('Upgrade to Premium for ERP integration');
              break;
            case 'AI_FUTURE_ACCESS':
              restrictions.push('AI Future not available');
              upgradeRecommendations.push('Upgrade to Pro for AI Future access');
              break;
          }
        }
      });

      return {
        plan: plan.name,
        features: plan.features,
        restrictions,
        upgradeRecommendations
      };

    } catch (error) {
      console.error('Error getting feature restrictions:', error);
      return {
        plan: 'Error',
        features: {},
        restrictions: ['Error checking features'],
        upgradeRecommendations: []
      };
    }
  }

  /**
   * Get user's organization ID from user ID
   */
  async getUserOrganization(userId: string): Promise<string | null> {
    try {
      // Use service role client to bypass RLS for organization lookup
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No organization membership found - this is normal for some users
          console.log('No organization found for user:', userId);
          return null;
        }
        console.error('Error getting user organization:', error);
        return null;
      }

      return data?.organization_id || null;
    } catch (error) {
      console.error('Exception getting user organization:', error);
      return null;
    }
  }

  /**
   * Check multiple features at once
   */
  async checkMultipleFeatures(
    organizationId: string, 
    features: string[]
  ): Promise<Record<string, FeatureCheck>> {
    const results: Record<string, FeatureCheck> = {};
    
    for (const feature of features) {
      results[feature] = await this.hasFeatureAccess(organizationId, feature);
    }

    return results;
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();
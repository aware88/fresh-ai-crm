/**
 * AI Usage Tracking Service
 * 
 * This service handles tracking AI message usage per organization
 * and enforcing subscription limits.
 */

import { createClient } from '@/lib/supabase/server';
import { getSubscriptionPlan } from '@/lib/subscription-plans';

export interface AIUsageStats {
  currentMessages: number;
  currentTokens: number;
  currentCost: number;
  periodStart: string;
  periodEnd: string;
}

export interface AILimitCheck {
  limitExceeded: boolean;
  currentUsage: number;
  limitAmount: number;
  remaining: number;
}

export interface AIUsageRecord {
  id: string;
  organizationId: string;
  userId: string;
  messageType: string;
  tokensUsed: number;
  costUsd: number;
  featureUsed?: string;
  requestMetadata?: Record<string, any>;
  createdAt: string;
}

export class AIUsageService {
  private supabasePromise = createClient();

  /**
   * Log AI usage for an organization
   */
  async logUsage({
    organizationId,
    userId,
    messageType,
    tokensUsed = 1,
    costUsd = 0,
    featureUsed,
    metadata = {}
  }: {
    organizationId: string;
    userId: string;
    messageType: 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting';
    tokensUsed?: number;
    costUsd?: number;
    featureUsed?: string;
    metadata?: Record<string, any>;
  }): Promise<string | null> {
    try {
      const supabase = await this.supabasePromise;
      const { data, error } = await supabase.rpc('log_ai_usage', {
        org_id: organizationId,
        user_id: userId,
        msg_type: messageType,
        tokens: tokensUsed,
        cost: costUsd,
        feature: featureUsed,
        metadata: metadata
      });

      if (error) {
        console.error('Error logging AI usage:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception logging AI usage:', error);
      return null;
    }
  }

  /**
   * Get current AI usage stats for an organization
   */
  async getCurrentUsage(organizationId: string): Promise<AIUsageStats | null> {
    try {
      const supabase = await this.supabasePromise;
      
      // Try RPC function first, fallback to direct query if it fails
      try {
        const { data, error } = await supabase.rpc('get_current_ai_usage', {
          org_id: organizationId
        });

        if (!error && data && data.length > 0) {
          const usage = data[0];
          return {
            currentMessages: usage.current_messages || 0,
            currentTokens: usage.current_tokens || 0,
            currentCost: parseFloat(usage.current_cost || '0'),
            periodStart: usage.period_start,
            periodEnd: usage.period_end
          };
        }
      } catch (rpcError) {
        console.error('RPC function failed, using fallback query:', rpcError);
      }

      // Fallback: Direct query to get current month usage
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: usageData, error: queryError } = await supabase
        .from('ai_usage_tracking')
        .select('tokens_used, cost_usd')
        .eq('organization_id', organizationId)
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString());

      if (queryError) {
        console.error('Error with fallback query:', queryError);
      }

      const totalMessages = usageData?.length || 0;
      const totalTokens = usageData?.reduce((sum, row) => sum + (row.tokens_used || 0), 0) || 0;
      const totalCost = usageData?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0;

      return {
        currentMessages: totalMessages,
        currentTokens: totalTokens,
        currentCost: totalCost,
        periodStart: firstDayOfMonth.toISOString().split('T')[0],
        periodEnd: lastDayOfMonth.toISOString().split('T')[0]
      };

    } catch (error) {
      console.error('Exception getting current AI usage:', error);
      return {
        currentMessages: 0,
        currentTokens: 0,
        currentCost: 0,
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0]
      };
    }
  }

  /**
   * Check if organization has exceeded their AI message limit
   */
  async checkLimitExceeded(organizationId: string): Promise<AILimitCheck | null> {
    try {
      const supabase = await this.supabasePromise;
      
      // Try RPC function first, fallback to direct logic if it fails
      try {
        const { data, error } = await supabase.rpc('check_ai_limit_exceeded', {
          org_id: organizationId
        });

        if (!error && data && data.length > 0) {
          const check = data[0];
          return {
            limitExceeded: check.limit_exceeded || false,
            currentUsage: check.current_usage || 0,
            limitAmount: check.limit_amount || 50,
            remaining: check.remaining || 0
          };
        }
      } catch (rpcError) {
        console.error('RPC function failed, using fallback logic:', rpcError);
      }

      // Fallback: Get current usage and check against default limits
      const currentUsage = await this.getCurrentUsage(organizationId);
      const currentMessages = currentUsage?.currentMessages || 0;
      
      // Default limits based on subscription (simplified)
      const defaultLimit = 50; // Starter plan default
      const remaining = Math.max(0, defaultLimit - currentMessages);
      const limitExceeded = currentMessages >= defaultLimit;

      return {
        limitExceeded,
        currentUsage: currentMessages,
        limitAmount: defaultLimit,
        remaining
      };

    } catch (error) {
      console.error('Exception checking AI limit:', error);
      return {
        limitExceeded: false,
        currentUsage: 0,
        limitAmount: 50,
        remaining: 50
      };
    }
  }

  /**
   * Check if organization can make an AI request
   * Returns true if allowed, false if limit exceeded
   */
  async canMakeRequest(organizationId: string): Promise<boolean> {
    const limitCheck = await this.checkLimitExceeded(organizationId);
    return limitCheck ? !limitCheck.limitExceeded : false;
  }

  /**
   * Get usage percentage for display
   */
  async getUsagePercentage(organizationId: string): Promise<number> {
    const limitCheck = await this.checkLimitExceeded(organizationId);
    
    if (!limitCheck || limitCheck.limitAmount === -1) {
      return 0; // Unlimited plan
    }

    if (limitCheck.limitAmount === 0) {
      return 100; // No limit means 100% used
    }

    return Math.round((limitCheck.currentUsage / limitCheck.limitAmount) * 100);
  }

  /**
   * Get detailed usage history for an organization
   */
  async getUsageHistory(
    organizationId: string, 
    limit: number = 100,
    offset: number = 0
  ): Promise<AIUsageRecord[]> {
    try {
      const supabase = await this.supabasePromise;
      const { data, error } = await supabase
        .from('ai_usage_tracking')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting usage history:', error);
        return [];
      }

      return data.map(record => ({
        id: record.id,
        organizationId: record.organization_id,
        userId: record.user_id,
        messageType: record.message_type,
        tokensUsed: record.tokens_used,
        costUsd: parseFloat(record.cost_usd || '0'),
        featureUsed: record.feature_used,
        requestMetadata: record.request_metadata,
        createdAt: record.created_at
      }));
    } catch (error) {
      console.error('Exception getting usage history:', error);
      return [];
    }
  }

  /**
   * Get monthly usage summary
   */
  async getMonthlyUsage(organizationId: string): Promise<{
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    breakdown: Record<string, number>;
  } | null> {
    try {
      const supabase = await this.supabasePromise;
      const { data, error } = await supabase
        .from('ai_usage_monthly_summary')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('period_start', new Date().toISOString().split('T')[0].slice(0, 8) + '01') // First day of current month
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error getting monthly usage:', error);
        return null;
      }

      if (!data) {
        return {
          totalMessages: 0,
          totalTokens: 0,
          totalCost: 0,
          breakdown: {}
        };
      }

      return {
        totalMessages: data.total_messages || 0,
        totalTokens: data.total_tokens || 0,
        totalCost: parseFloat(data.total_cost_usd || '0'),
        breakdown: data.message_breakdown || {}
      };
    } catch (error) {
      console.error('Exception getting monthly usage:', error);
      return null;
    }
  }

  /**
   * Get organization's AI message limit from subscription plan
   */
  async getMessageLimit(organizationId: string): Promise<number> {
    try {
      const supabase = await this.supabasePromise;
      const { data: org, error } = await supabase
        .from('organizations')
        .select('subscription_tier')
        .eq('id', organizationId)
        .single();

      if (error || !org) {
        console.error('Error getting organization:', error);
        return 50; // Default to starter limit
      }

      const plan = getSubscriptionPlan(org.subscription_tier.toLowerCase());
      if (!plan) {
        return 50; // Default to starter limit
      }

      const limit = plan.features.AI_MESSAGES_LIMIT;
      return typeof limit === 'number' ? limit : 50;
    } catch (error) {
      console.error('Exception getting message limit:', error);
      return 50;
    }
  }

  /**
   * Check if feature is available for organization's subscription plan
   */
  async hasFeatureAccess(
    organizationId: string, 
    feature: string
  ): Promise<boolean> {
    try {
      const supabase = await this.supabasePromise;
      const { data: org, error } = await supabase
        .from('organizations')
        .select('subscription_tier')
        .eq('id', organizationId)
        .single();

      if (error || !org) {
        console.error('Error getting organization for feature check:', error);
        return false;
      }

      const plan = getSubscriptionPlan(org.subscription_tier.toLowerCase());
      if (!plan) {
        return false;
      }

      return !!plan.features[feature];
    } catch (error) {
      console.error('Exception checking feature access:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiUsageService = new AIUsageService();
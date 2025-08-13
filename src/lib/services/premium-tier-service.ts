/**
 * Premium Tier Service
 * 
 * This service handles Premium tier detection, recommendations, and pricing logic
 * based on organization size, usage patterns, and needs.
 */

import { createClient } from '@/lib/supabase/server';
import { 
  subscriptionPlans, 
  getPremiumPlans, 
  recommendPremiumTier,
  type SubscriptionPlanDefinition 
} from '@/lib/subscription-plans-v2';

export interface OrganizationMetrics {
  userCount: number;
  monthlyAIMessages: number;
  contactCount: number;
  averageDailyMessages: number;
  peakUsageDays: number;
  growthRate: number; // Percentage growth month-over-month
  teamSize: number;
  industryType?: string;
}

export interface PremiumTierRecommendation {
  recommendedTier: SubscriptionPlanDefinition;
  currentFit: 'perfect' | 'tight' | 'over' | 'under';
  reasoning: string;
  costAnalysis: {
    currentCost: number;
    recommendedCost: number;
    savings: number;
    costPerUser: number;
    costPerMessage: number;
  };
  alternatives: SubscriptionPlanDefinition[];
  urgency: 'low' | 'medium' | 'high';
  benefits: string[];
  migrationPath: string;
}

export interface TierComparisonMatrix {
  basic: {
    plan: SubscriptionPlanDefinition;
    fit: number; // 0-100 score
    pros: string[];
    cons: string[];
  };
  advanced: {
    plan: SubscriptionPlanDefinition;
    fit: number;
    pros: string[];
    cons: string[];
  };
  enterprise: {
    plan: SubscriptionPlanDefinition;
    fit: number;
    pros: string[];
    cons: string[];
  };
}

export class PremiumTierService {
  private supabasePromise = createClient();

  /**
   * Get organization metrics for tier recommendation
   */
  async getOrganizationMetrics(organizationId: string): Promise<OrganizationMetrics | null> {
    try {
      const supabase = await this.supabasePromise;
      // Get user count
      const { data: userCount, error: userError } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (userError) {
        console.error('Error getting user count:', userError);
        return null;
      }

      // Get contact count
      const { data: contactCount, error: contactError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (contactError) {
        console.error('Error getting contact count:', contactError);
        return null;
      }

      // Get AI usage data for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: aiUsage, error: usageError } = await supabase
        .from('ai_usage_tracking')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (usageError) {
        console.error('Error getting AI usage:', usageError);
        return null;
      }

      // Calculate metrics
      const totalMessages = aiUsage?.length || 0;
      const averageDailyMessages = totalMessages / 30;
      
      // Calculate peak usage days (days with >2x average usage)
      const dailyUsage: Record<string, number> = {};
      aiUsage?.forEach(usage => {
        const date = usage.created_at.split('T')[0];
        dailyUsage[date] = (dailyUsage[date] || 0) + 1;
      });
      
      const peakThreshold = averageDailyMessages * 2;
      const peakUsageDays = Object.values(dailyUsage).filter(count => count > peakThreshold).length;

      // Calculate growth rate (simplified - compare first half vs second half of month)
      const midMonth = new Date(thirtyDaysAgo);
      midMonth.setDate(midMonth.getDate() + 15);
      
      const firstHalfMessages = aiUsage?.filter(u => new Date(u.created_at) < midMonth).length || 0;
      const secondHalfMessages = aiUsage?.filter(u => new Date(u.created_at) >= midMonth).length || 0;
      
      const growthRate = firstHalfMessages > 0 
        ? ((secondHalfMessages - firstHalfMessages) / firstHalfMessages) * 100 
        : 0;

      return {
        userCount: userCount?.count || 0,
        monthlyAIMessages: totalMessages,
        contactCount: contactCount?.count || 0,
        averageDailyMessages,
        peakUsageDays,
        growthRate,
        teamSize: userCount?.count || 0,
      };

    } catch (error) {
      console.error('Exception getting organization metrics:', error);
      return null;
    }
  }

  /**
   * Get Premium tier recommendation based on organization metrics
   */
  async getTierRecommendation(organizationId: string): Promise<PremiumTierRecommendation | null> {
    const metrics = await this.getOrganizationMetrics(organizationId);
    if (!metrics) return null;

    // Get recommended tier
    const recommendedTier = recommendPremiumTier(metrics.userCount, metrics.monthlyAIMessages);
    const premiumPlans = getPremiumPlans();

    // Determine current fit
    let currentFit: 'perfect' | 'tight' | 'over' | 'under' = 'perfect';
    let reasoning = '';
    let urgency: 'low' | 'medium' | 'high' = 'low';
    let benefits: string[] = [];

    // Analyze fit based on usage
    const userUtilization = metrics.userCount / (recommendedTier.userLimit || 1);
    const messageUtilization = metrics.monthlyAIMessages / (recommendedTier.features.AI_MESSAGES_LIMIT as number || 1);

    if (userUtilization > 0.9 || messageUtilization > 0.9) {
      currentFit = 'tight';
      urgency = 'high';
      reasoning = 'Your current usage is very close to the limits. Consider upgrading soon to avoid restrictions.';
    } else if (userUtilization > 0.7 || messageUtilization > 0.7) {
      currentFit = 'tight';
      urgency = 'medium';
      reasoning = 'You\'re using a significant portion of your limits. An upgrade might be beneficial.';
    } else if (userUtilization < 0.3 && messageUtilization < 0.3) {
      currentFit = 'over';
      urgency = 'low';
      reasoning = 'You might be over-provisioned. Consider if a lower tier could meet your needs.';
    } else {
      currentFit = 'perfect';
      urgency = 'low';
      reasoning = 'Your current plan seems well-suited to your usage patterns.';
    }

    // Generate benefits based on tier
    if (recommendedTier.premiumTier === 'basic') {
      benefits = [
        'ERP integration (Metakocka)',
        'Advanced analytics',
        'Priority support with phone access',
        '5,000 AI messages/month',
        'Up to 20 team members'
      ];
    } else if (recommendedTier.premiumTier === 'advanced') {
      benefits = [
        'Custom integrations',
        'White label options',
        'AI customization',
        'Dedicated success agent',
        '15,000 AI messages/month',
        'Up to 50 team members'
      ];
    } else {
      benefits = [
        'Unlimited AI messages',
        'Up to 100 team members',
        'All advanced features',
        'Priority everything',
        'Custom enterprise features'
      ];
    }

    // Calculate cost analysis
    const currentCost = 0; // They're in beta, so current cost is 0
    const recommendedCost = recommendedTier.monthlyPrice;
    const costPerUser = recommendedCost / Math.max(metrics.userCount, 1);
    const costPerMessage = recommendedTier.features.AI_MESSAGES_LIMIT === -1 
      ? 0 
      : recommendedCost / (recommendedTier.features.AI_MESSAGES_LIMIT as number);

    // Get alternatives (other Premium tiers)
    const alternatives = premiumPlans.filter(p => p.id !== recommendedTier.id);

    return {
      recommendedTier,
      currentFit,
      reasoning,
      costAnalysis: {
        currentCost,
        recommendedCost,
        savings: currentCost - recommendedCost, // Negative = cost increase
        costPerUser,
        costPerMessage
      },
      alternatives,
      urgency,
      benefits,
      migrationPath: this.generateMigrationPath(recommendedTier, metrics)
    };
  }

  /**
   * Compare all Premium tiers for an organization
   */
  async compareTiers(organizationId: string): Promise<TierComparisonMatrix | null> {
    const metrics = await this.getOrganizationMetrics(organizationId);
    if (!metrics) return null;

    const premiumPlans = getPremiumPlans();
    const basicPlan = premiumPlans.find(p => p.premiumTier === 'basic')!;
    const advancedPlan = premiumPlans.find(p => p.premiumTier === 'advanced')!;
    const enterprisePlan = premiumPlans.find(p => p.premiumTier === 'enterprise')!;

    return {
      basic: {
        plan: basicPlan,
        fit: this.calculateFitScore(basicPlan, metrics),
        pros: this.generatePros(basicPlan, metrics),
        cons: this.generateCons(basicPlan, metrics)
      },
      advanced: {
        plan: advancedPlan,
        fit: this.calculateFitScore(advancedPlan, metrics),
        pros: this.generatePros(advancedPlan, metrics),
        cons: this.generateCons(advancedPlan, metrics)
      },
      enterprise: {
        plan: enterprisePlan,
        fit: this.calculateFitScore(enterprisePlan, metrics),
        pros: this.generatePros(enterprisePlan, metrics),
        cons: this.generateCons(enterprisePlan, metrics)
      }
    };
  }

  /**
   * Calculate fit score (0-100) for a plan based on metrics
   */
  private calculateFitScore(plan: SubscriptionPlanDefinition, metrics: OrganizationMetrics): number {
    let score = 100;

    // Check user limit fit
    const userUtilization = metrics.userCount / (plan.userLimit || 1);
    if (userUtilization > 1) {
      score -= 30; // Over limit
    } else if (userUtilization > 0.8) {
      score -= 10; // Close to limit
    } else if (userUtilization < 0.2) {
      score -= 15; // Over-provisioned
    }

    // Check message limit fit
    const messageLimit = plan.features.AI_MESSAGES_LIMIT as number;
    if (messageLimit !== -1) {
      const messageUtilization = metrics.monthlyAIMessages / messageLimit;
      if (messageUtilization > 1) {
        score -= 30; // Over limit
      } else if (messageUtilization > 0.8) {
        score -= 10; // Close to limit
      } else if (messageUtilization < 0.2) {
        score -= 15; // Over-provisioned
      }
    }

    // Growth consideration
    if (metrics.growthRate > 50) {
      // High growth - prefer higher tiers
      if (plan.premiumTier === 'basic') score -= 20;
      if (plan.premiumTier === 'enterprise') score += 10;
    }

    // Peak usage consideration
    if (metrics.peakUsageDays > 5) {
      // Frequent peak usage - prefer higher limits
      if (plan.premiumTier === 'basic') score -= 15;
      if (plan.premiumTier === 'enterprise') score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate pros for a plan based on metrics
   */
  private generatePros(plan: SubscriptionPlanDefinition, metrics: OrganizationMetrics): string[] {
    const pros: string[] = [];

    if (plan.premiumTier === 'basic') {
      pros.push('Most cost-effective Premium option');
      pros.push('Perfect for growing teams');
      pros.push('Includes essential enterprise features');
      if (metrics.userCount <= 15) pros.push('Room to grow your team');
    }

    if (plan.premiumTier === 'advanced') {
      pros.push('Advanced customization options');
      pros.push('White label capabilities');
      pros.push('Dedicated success support');
      if (metrics.userCount > 20) pros.push('Better fit for larger teams');
    }

    if (plan.premiumTier === 'enterprise') {
      pros.push('Unlimited AI messages');
      pros.push('No usage restrictions');
      pros.push('Maximum team size support');
      pros.push('All premium features included');
    }

    // Usage-based pros
    const messageLimit = plan.features.AI_MESSAGES_LIMIT as number;
    if (messageLimit === -1) {
      pros.push('Never worry about message limits');
    } else if (messageLimit > metrics.monthlyAIMessages * 2) {
      pros.push('Plenty of room for growth');
    }

    return pros;
  }

  /**
   * Generate cons for a plan based on metrics
   */
  private generateCons(plan: SubscriptionPlanDefinition, metrics: OrganizationMetrics): string[] {
    const cons: string[] = [];

    // User limit cons
    if (plan.userLimit !== -1 && metrics.userCount > plan.userLimit * 0.8) {
      cons.push('Close to user limit');
    }

    if (plan.userLimit !== -1 && metrics.userCount > plan.userLimit) {
      cons.push('Exceeds user limit');
    }

    // Message limit cons
    const messageLimit = plan.features.AI_MESSAGES_LIMIT as number;
    if (messageLimit !== -1 && metrics.monthlyAIMessages > messageLimit * 0.8) {
      cons.push('Close to message limit');
    }

    if (messageLimit !== -1 && metrics.monthlyAIMessages > messageLimit) {
      cons.push('Exceeds message limit');
    }

    // Cost cons
    if (plan.premiumTier === 'enterprise' && metrics.userCount < 30) {
      cons.push('May be over-provisioned for current team size');
    }

    if (plan.premiumTier === 'basic' && metrics.growthRate > 50) {
      cons.push('May outgrow this tier quickly');
    }

    // Feature gaps
    if (plan.premiumTier === 'basic') {
      cons.push('No white label options');
      cons.push('No custom integrations');
    }

    if (plan.premiumTier !== 'enterprise' && metrics.peakUsageDays > 10) {
      cons.push('Message limits during peak usage');
    }

    return cons;
  }

  /**
   * Generate migration path recommendation
   */
  private generateMigrationPath(plan: SubscriptionPlanDefinition, metrics: OrganizationMetrics): string {
    if (plan.premiumTier === 'basic') {
      return 'Start with Premium Basic to get enterprise features, then upgrade to Advanced as your team grows beyond 20 users.';
    }

    if (plan.premiumTier === 'advanced') {
      return 'Premium Advanced provides the perfect balance of features and capacity for growing organizations. Upgrade to Enterprise when you need unlimited usage.';
    }

    return 'Premium Enterprise gives you unlimited capacity and all features. Perfect for large organizations with high AI usage.';
  }

  /**
   * Get pricing calculator for different scenarios
   */
  async getPricingCalculator(organizationId: string): Promise<{
    currentScenario: { plan: string; cost: number; fit: string };
    projectedScenarios: Array<{
      timeframe: string;
      projectedUsers: number;
      projectedMessages: number;
      recommendedPlan: SubscriptionPlanDefinition;
      cost: number;
      reasoning: string;
    }>;
  } | null> {
    const metrics = await this.getOrganizationMetrics(organizationId);
    if (!metrics) return null;

    const currentRecommendation = await this.getTierRecommendation(organizationId);
    if (!currentRecommendation) return null;

    // Project growth scenarios
    const projectedScenarios = [
      {
        timeframe: '3 months',
        userGrowthFactor: 1.2,
        messageGrowthFactor: 1.3
      },
      {
        timeframe: '6 months', 
        userGrowthFactor: 1.5,
        messageGrowthFactor: 1.6
      },
      {
        timeframe: '12 months',
        userGrowthFactor: 2.0,
        messageGrowthFactor: 2.2
      }
    ].map(scenario => {
      const projectedUsers = Math.ceil(metrics.userCount * scenario.userGrowthFactor);
      const projectedMessages = Math.ceil(metrics.monthlyAIMessages * scenario.messageGrowthFactor);
      const recommendedPlan = recommendPremiumTier(projectedUsers, projectedMessages);
      
      return {
        timeframe: scenario.timeframe,
        projectedUsers,
        projectedMessages,
        recommendedPlan,
        cost: recommendedPlan.monthlyPrice,
        reasoning: `Based on ${Math.round((scenario.userGrowthFactor - 1) * 100)}% user growth and ${Math.round((scenario.messageGrowthFactor - 1) * 100)}% message growth`
      };
    });

    return {
      currentScenario: {
        plan: currentRecommendation.recommendedTier.name,
        cost: currentRecommendation.recommendedTier.monthlyPrice,
        fit: currentRecommendation.currentFit
      },
      projectedScenarios
    };
  }
}

// Export singleton instance
export const premiumTierService = new PremiumTierService();
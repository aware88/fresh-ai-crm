/**
 * Premium Tier Recommendation API
 * 
 * GET: Returns personalized Premium tier recommendations based on usage and organization metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUID } from '@/lib/auth/utils';
import { featureFlagService } from '@/lib/services/feature-flag-service';
import { premiumTierService } from '@/lib/services/premium-tier-service';
import { formatPriceEUR } from '@/lib/subscription-plans-v2';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const organizationId = await featureFlagService.getUserOrganization(uid);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get tier recommendation
    const recommendation = await premiumTierService.getTierRecommendation(organizationId);
    if (!recommendation) {
      return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 });
    }

    // Get tier comparison matrix
    const tierComparison = await premiumTierService.compareTiers(organizationId);
    
    // Get pricing calculator
    const pricingCalculator = await premiumTierService.getPricingCalculator(organizationId);

    // Format recommendation for response
    const formattedRecommendation = {
      recommended: {
        tier: recommendation.recommendedTier.premiumTier,
        plan: {
          id: recommendation.recommendedTier.id,
          name: recommendation.recommendedTier.name,
          description: recommendation.recommendedTier.description,
          monthlyPrice: recommendation.recommendedTier.monthlyPrice,
          monthlyPriceFormatted: formatPriceEUR(recommendation.recommendedTier.monthlyPrice),
          annualPrice: recommendation.recommendedTier.annualPrice,
          annualPriceFormatted: formatPriceEUR(recommendation.recommendedTier.annualPrice),
          annualSavings: formatPriceEUR(recommendation.recommendedTier.monthlyPrice * 12 - recommendation.recommendedTier.annualPrice * 12),
          userLimit: recommendation.recommendedTier.userLimit,
          aiMessagesLimit: recommendation.recommendedTier.features.AI_MESSAGES_LIMIT,
          additionalUserPrice: recommendation.recommendedTier.additionalUserPrice
        },
        fit: recommendation.currentFit,
        reasoning: recommendation.reasoning,
        urgency: recommendation.urgency,
        benefits: recommendation.benefits,
        migrationPath: recommendation.migrationPath
      },
      costAnalysis: {
        currentCost: recommendation.costAnalysis.currentCost,
        currentCostFormatted: formatPriceEUR(recommendation.costAnalysis.currentCost),
        recommendedCost: recommendation.costAnalysis.recommendedCost,
        recommendedCostFormatted: formatPriceEUR(recommendation.costAnalysis.recommendedCost),
        costIncrease: recommendation.costAnalysis.recommendedCost - recommendation.costAnalysis.currentCost,
        costIncreaseFormatted: formatPriceEUR(Math.abs(recommendation.costAnalysis.recommendedCost - recommendation.costAnalysis.currentCost)),
        costPerUser: recommendation.costAnalysis.costPerUser,
        costPerUserFormatted: formatPriceEUR(recommendation.costAnalysis.costPerUser),
        costPerMessage: recommendation.costAnalysis.costPerMessage,
        roi: {
          betaDiscount: 'As a beta user, you\'ll get special pricing when upgrading',
          valueProposition: 'Unlock enterprise features and scale without limits'
        }
      },
      alternatives: recommendation.alternatives.map(alt => ({
        id: alt.id,
        name: alt.name,
        description: alt.description,
        monthlyPrice: alt.monthlyPrice,
        monthlyPriceFormatted: formatPriceEUR(alt.monthlyPrice),
        annualPrice: alt.annualPrice,
        annualPriceFormatted: formatPriceEUR(alt.annualPrice),
        tier: alt.premiumTier,
        userLimit: alt.userLimit,
        aiMessagesLimit: alt.features.AI_MESSAGES_LIMIT,
        suitability: alt.userLimit === -1 ? 'large_enterprise' : 
                    alt.userLimit > 50 ? 'large_team' : 'medium_team'
      }))
    };

    // Format tier comparison if available
    const formattedComparison = tierComparison ? {
      basic: {
        plan: {
          id: tierComparison.basic.plan.id,
          name: tierComparison.basic.plan.name,
          monthlyPrice: tierComparison.basic.plan.monthlyPrice,
          monthlyPriceFormatted: formatPriceEUR(tierComparison.basic.plan.monthlyPrice),
          userLimit: tierComparison.basic.plan.userLimit,
          aiMessagesLimit: tierComparison.basic.plan.features.AI_MESSAGES_LIMIT
        },
        fit: tierComparison.basic.fit,
        pros: tierComparison.basic.pros,
        cons: tierComparison.basic.cons
      },
      advanced: {
        plan: {
          id: tierComparison.advanced.plan.id,
          name: tierComparison.advanced.plan.name,
          monthlyPrice: tierComparison.advanced.plan.monthlyPrice,
          monthlyPriceFormatted: formatPriceEUR(tierComparison.advanced.plan.monthlyPrice),
          userLimit: tierComparison.advanced.plan.userLimit,
          aiMessagesLimit: tierComparison.advanced.plan.features.AI_MESSAGES_LIMIT
        },
        fit: tierComparison.advanced.fit,
        pros: tierComparison.advanced.pros,
        cons: tierComparison.advanced.cons
      },
      enterprise: {
        plan: {
          id: tierComparison.enterprise.plan.id,
          name: tierComparison.enterprise.plan.name,
          monthlyPrice: tierComparison.enterprise.plan.monthlyPrice,
          monthlyPriceFormatted: formatPriceEUR(tierComparison.enterprise.plan.monthlyPrice),
          userLimit: tierComparison.enterprise.plan.userLimit,
          aiMessagesLimit: tierComparison.enterprise.plan.features.AI_MESSAGES_LIMIT
        },
        fit: tierComparison.enterprise.fit,
        pros: tierComparison.enterprise.pros,
        cons: tierComparison.enterprise.cons
      }
    } : null;

    const response = {
      recommendation: formattedRecommendation,
      comparison: formattedComparison,
      pricingCalculator: pricingCalculator ? {
        current: pricingCalculator.currentScenario,
        projections: pricingCalculator.projectedScenarios.map(proj => ({
          timeframe: proj.timeframe,
          projectedUsers: proj.projectedUsers,
          projectedMessages: proj.projectedMessages,
          recommendedPlan: {
            name: proj.recommendedPlan.name,
            monthlyPrice: proj.recommendedPlan.monthlyPrice,
            monthlyPriceFormatted: formatPriceEUR(proj.recommendedPlan.monthlyPrice)
          },
          reasoning: proj.reasoning
        }))
      } : null,
      actions: {
        canUpgrade: true,
        upgradeUrl: '/api/premium/upgrade',
        compareUrl: '/pricing',
        contactSales: formattedRecommendation.recommended.tier === 'enterprise'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in Premium recommendation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
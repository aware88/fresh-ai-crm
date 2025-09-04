/**
 * Usage Dashboard API
 * 
 * Provides comprehensive usage statistics and limits for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUID } from '@/lib/auth/utils';
import { aiUsageService } from '@/lib/services/ai-usage-service';
import { featureFlagService } from '@/lib/services/feature-flag-service';

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

    // Get current usage stats
    const currentUsage = await aiUsageService.getCurrentUsage(organizationId);
    const limitCheck = await aiUsageService.checkLimitExceeded(organizationId);
    const monthlyUsage = await aiUsageService.getMonthlyUsage(organizationId);
    const usageHistory = await aiUsageService.getUsageHistory(organizationId, 10); // Last 10 requests
    const featureRestrictions = await featureFlagService.getFeatureRestrictions(organizationId);

    // Calculate usage percentage
    const usagePercentage = await aiUsageService.getUsagePercentage(organizationId);

    // Get organization details
    const supabase = await createClient();
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, subscription_tier, subscription_status')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
    }

    // Build response
    const response = {
      organization: {
        id: organizationId,
        name: org?.name || 'Unknown',
        subscriptionTier: org?.subscription_tier || 'starter',
        subscriptionStatus: org?.subscription_status || 'active'
      },
      usage: {
        current: {
          messages: currentUsage?.currentMessages || 0,
          tokens: currentUsage?.currentTokens || 0,
          cost: currentUsage?.currentCost || 0,
          periodStart: currentUsage?.periodStart,
          periodEnd: currentUsage?.periodEnd
        },
        limits: {
          messages: limitCheck?.limitAmount || 50,
          unlimited: limitCheck?.limitAmount === -1,
          remaining: limitCheck?.remaining || 0,
          exceeded: limitCheck?.limitExceeded || false
        },
        percentage: usagePercentage,
        monthly: {
          totalMessages: monthlyUsage?.totalMessages || 0,
          totalTokens: monthlyUsage?.totalTokens || 0,
          totalCost: monthlyUsage?.totalCost || 0,
          breakdown: monthlyUsage?.breakdown || {}
        }
      },
      features: {
        plan: featureRestrictions.plan,
        available: featureRestrictions.features,
        restrictions: featureRestrictions.restrictions,
        upgradeRecommendations: featureRestrictions.upgradeRecommendations
      },
      recentActivity: usageHistory.map(activity => ({
        id: activity.id,
        type: activity.messageType,
        feature: activity.featureUsed,
        tokens: activity.tokensUsed,
        cost: activity.costUsd,
        timestamp: activity.createdAt
      })),
      alerts: []
    };

    // Add usage alerts
    if (usagePercentage >= 80 && usagePercentage < 100) {
      response.alerts.push({
        type: 'warning',
        message: `You've used ${usagePercentage}% of your AI message limit this month`,
        action: 'Consider upgrading your plan'
      });
    }

    if (limitCheck?.limitExceeded) {
      response.alerts.push({
        type: 'error',
        message: 'AI message limit exceeded',
        action: 'Upgrade your plan to continue using AI features'
      });
    }

    if (featureRestrictions.restrictions.length > 0) {
      response.alerts.push({
        type: 'info',
        message: `${featureRestrictions.restrictions.length} premium features are not available in your current plan`,
        action: 'Upgrade to unlock all features'
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in usage dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
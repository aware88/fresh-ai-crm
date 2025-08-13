/**
 * Comprehensive Usage Status API
 * 
 * GET: Returns complete usage status including subscription limits and top-up balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUID } from '@/lib/auth/utils';
import { featureFlagService } from '@/lib/services/feature-flag-service';
import { getUsageStatus } from '@/lib/middleware/ai-limit-middleware-v2';
import { topUpService } from '@/lib/services/topup-service';
import { aiUsageService } from '@/lib/services/ai-usage-service';
import { formatPriceEUR } from '@/lib/subscription-plans-v2';
import { proBoostService } from '@/lib/services/pro-boost-service';

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

    // Get comprehensive usage status and Pro Boost
    const [usageStatus, proBoostStatus] = await Promise.all([
      getUsageStatus(organizationId),
      proBoostService.getStatus(organizationId)
    ]);
    if (!usageStatus) {
      return NextResponse.json({ error: 'Failed to get usage status' }, { status: 500 });
    }

    // Get additional context
    const [currentUsage, topupRecommendation] = await Promise.all([
      aiUsageService.getCurrentUsage(organizationId),
      topUpService.recommendTopUp(organizationId, usageStatus.subscription.current, usageStatus.subscription.limit)
    ]);

    // Calculate usage patterns
    const usagePercentage = usageStatus.subscription.limit > 0 
      ? Math.round((usageStatus.subscription.current / usageStatus.subscription.limit) * 100)
      : 0;

    const daysIntoMonth = new Date().getDate();
    const dailyAverage = usageStatus.subscription.current / daysIntoMonth;
    const projectedMonthlyUsage = Math.round(dailyAverage * 30);

    // Determine status and alerts
    let status: 'healthy' | 'warning' | 'critical' | 'blocked' = 'healthy';
    const alerts: Array<{
      type: 'info' | 'warning' | 'error';
      message: string;
      action?: string;
    }> = [];

    if (!usageStatus.total.canMakeRequest) {
      status = 'blocked';
      alerts.push({
        type: 'error',
        message: 'No AI messages available. Purchase a top-up to continue. You still have a small grace buffer for urgent replies.',
        action: 'Purchase Top-Up'
      });
    } else if (usageStatus.subscription.exceeded && usageStatus.topup.available < 10) {
      status = 'critical';
      alerts.push({
        type: 'error',
        message: 'Subscription limit exceeded and low on top-up messages.',
        action: 'Purchase More Top-Ups'
      });
    } else if (usageStatus.subscription.exceeded) {
      status = 'warning';
      alerts.push({
        type: 'warning',
        message: 'Using top-up messages. Consider upgrading your plan to save costs.',
        action: 'Upgrade Plan'
      });
    } else if (usagePercentage >= 80) {
      status = 'warning';
      alerts.push({
        type: 'warning',
        message: `You've used ${usagePercentage}% of your monthly AI messages. Unlock more with a quick top-up.`,
        action: 'Consider Top-Up'
      });
    } else if (usagePercentage >= 50) {
      alerts.push({
        type: 'info',
        message: `You've used 50% of your monthly AI messages. Keep building momentum.`,
        action: 'Explore Pro'
      });
    }

    // Add growth-based alerts
    if (projectedMonthlyUsage > usageStatus.subscription.limit * 1.2) {
      alerts.push({
        type: 'info',
        message: 'Based on current usage, you may exceed your limit this month.',
        action: 'Plan Ahead'
      });
    }

    // Pro Boost surfaced
    if (proBoostStatus?.active) {
      alerts.push({
        type: 'success',
        message: `Pro Boost active until ${proBoostStatus.endAt?.slice(0,10)}.`,
        action: 'Upgrade Now'
      });
    }

    const response = {
      status,
      usage: {
        subscription: {
          current: usageStatus.subscription.current,
          limit: usageStatus.subscription.limit,
          remaining: usageStatus.subscription.remaining,
          percentage: usagePercentage,
          exceeded: usageStatus.subscription.exceeded,
          unlimited: usageStatus.subscription.limit === -1
        },
        topup: {
          available: usageStatus.topup.available,
          totalSpent: usageStatus.topup.totalSpent,
          totalSpentFormatted: formatPriceEUR(usageStatus.topup.totalSpent),
          totalPurchases: usageStatus.topup.totalPurchases,
          hasBalance: usageStatus.topup.available > 0,
          lowBalance: usageStatus.topup.available < 10
        },
        total: {
          available: usageStatus.total.available,
          canMakeRequest: usageStatus.total.canMakeRequest
        },
        patterns: {
          dailyAverage: Math.round(dailyAverage),
          projectedMonthly: projectedMonthlyUsage,
          daysIntoMonth,
          utilizationTrend: projectedMonthlyUsage > usageStatus.subscription.limit ? 'increasing' : 'stable'
        }
      },
      period: {
        start: currentUsage?.periodStart,
        end: currentUsage?.periodEnd,
        daysRemaining: currentUsage?.periodEnd ? 
          Math.ceil((new Date(currentUsage.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
          null
      },
      alerts,
      recommendations: {
        topup: topupRecommendation ? {
          package: topupRecommendation.recommended,
          reasoning: topupRecommendation.reasoning,
          urgency: topupRecommendation.urgency
        } : null,
        upgrade: usageStatus.subscription.exceeded || projectedMonthlyUsage > usageStatus.subscription.limit ? {
          recommended: true,
          reason: 'Consider upgrading to a higher plan for better value',
          estimatedSavings: null // Would calculate based on usage vs top-up costs
        } : null
      },
      actions: {
        canPurchaseTopup: true,
        canUpgrade: true,
        purchaseTopupUrl: '/api/topup/packages',
        upgradeUrl: '/pricing',
        usageHistoryUrl: '/api/usage/dashboard'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in usage status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
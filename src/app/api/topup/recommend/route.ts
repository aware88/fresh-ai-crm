/**
 * Top-Up Recommendation API
 * 
 * GET: Returns personalized top-up recommendations based on usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUID } from '@/lib/auth/utils';
import { topUpService } from '@/lib/services/topup-service';
import { featureFlagService } from '@/lib/services/feature-flag-service';
import { aiUsageService } from '@/lib/services/ai-usage-service';
import { formatPriceEUR, recommendTopUpPackage } from '@/lib/subscription-plans-v2';

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

    // Get current usage and limits
    const currentUsage = await aiUsageService.getCurrentUsage(organizationId);
    const limitCheck = await aiUsageService.checkLimitExceeded(organizationId);
    const topupBalance = await topUpService.getBalance(organizationId);

    if (!currentUsage || !limitCheck || !topupBalance) {
      return NextResponse.json({ error: 'Failed to get usage data' }, { status: 500 });
    }

    // Calculate recommendation based on current situation
    let recommendationType: 'immediate' | 'preventive' | 'optimization' | 'none' = 'none';
    let urgency: 'low' | 'medium' | 'high' = 'low';
    let reasoning = '';
    let recommendedPackage = topUpService.getAvailablePackages()[0]; // Default to smallest

    // Determine recommendation type and urgency
    if (limitCheck.limitExceeded || topupBalance.totalMessagesAvailable === 0) {
      recommendationType = 'immediate';
      urgency = 'high';
      reasoning = 'You\'ve reached your AI message limit. Purchase top-up messages to continue using AI features.';
      
      // Recommend based on typical usage
      const typicalMonthlyUsage = currentUsage.currentMessages * 2; // Estimate
      recommendedPackage = recommendTopUpPackage(Math.max(100, typicalMonthlyUsage));
      
    } else if (limitCheck.remaining < 10 || topupBalance.totalMessagesAvailable < 10) {
      recommendationType = 'preventive';
      urgency = 'medium';
      reasoning = 'You\'re running low on AI messages. Consider purchasing a top-up to avoid interruptions.';
      
      const needed = Math.max(50, limitCheck.limitAmount * 0.2); // 20% of limit or 50, whichever is higher
      recommendedPackage = recommendTopUpPackage(needed);
      
    } else if (currentUsage.currentMessages > limitCheck.limitAmount * 0.7) {
      recommendationType = 'preventive';
      urgency = 'medium';
      reasoning = 'You\'ve used 70% of your monthly AI messages. A top-up can provide peace of mind.';
      
      recommendedPackage = recommendTopUpPackage(limitCheck.remaining);
      
    } else {
      recommendationType = 'optimization';
      urgency = 'low';
      reasoning = 'Your usage is within limits, but you can always stock up on AI messages for future needs.';
      
      recommendedPackage = topUpService.getAvailablePackages()[0]; // Smallest package
    }

    // Get usage statistics for better recommendations
    const statistics = await topUpService.getStatistics(organizationId);
    
    // Calculate projected needs based on growth
    const dailyAverage = currentUsage.currentMessages / new Date().getDate();
    const projectedMonthlyUsage = dailyAverage * 30;
    const growthFactor = projectedMonthlyUsage / (statistics.averagePackageSize || 100);

    // Adjust recommendation based on growth
    if (growthFactor > 1.5) {
      const packages = topUpService.getAvailablePackages();
      const largerPackageIndex = packages.findIndex(p => p.id === recommendedPackage.id) + 1;
      if (largerPackageIndex < packages.length) {
        recommendedPackage = packages[largerPackageIndex];
        reasoning += ' Based on your growth trend, we recommend a larger package for better value.';
      }
    }

    // Alternative recommendations
    const allPackages = topUpService.getAvailablePackages();
    const alternatives = allPackages
      .filter(pkg => pkg.id !== recommendedPackage.id)
      .map(pkg => ({
        ...pkg,
        priceFormatted: formatPriceEUR(pkg.priceEur),
        costPerMessage: pkg.pricePerMessage,
        savings: pkg.discountPercent ? {
          percent: pkg.discountPercent,
          amount: formatPriceEUR(pkg.messages * 0.05 - pkg.priceEur)
        } : null,
        suitability: pkg.messages < recommendedPackage.messages ? 'lighter_usage' : 'heavier_usage'
      }));

    // Usage insights
    const insights = {
      averageDailyUsage: Math.round(dailyAverage),
      projectedMonthlyUsage: Math.round(projectedMonthlyUsage),
      utilizationRate: limitCheck.limitAmount > 0 
        ? Math.round((currentUsage.currentMessages / limitCheck.limitAmount) * 100)
        : 0,
      daysUntilLimit: limitCheck.remaining > 0 && dailyAverage > 0 
        ? Math.floor(limitCheck.remaining / dailyAverage)
        : null,
      costEfficiency: {
        currentPlan: limitCheck.limitAmount > 0 
          ? (0 / limitCheck.limitAmount).toFixed(4) // Current plan is free during beta
          : 'N/A',
        withTopup: recommendedPackage.pricePerMessage.toFixed(4)
      }
    };

    const response = {
      recommendation: {
        type: recommendationType,
        urgency,
        reasoning,
        package: {
          ...recommendedPackage,
          priceFormatted: formatPriceEUR(recommendedPackage.priceEur),
          costPerMessage: recommendedPackage.pricePerMessage,
          savings: recommendedPackage.discountPercent ? {
            percent: recommendedPackage.discountPercent,
            amount: formatPriceEUR(recommendedPackage.messages * 0.05 - recommendedPackage.priceEur),
            description: `Save ${recommendedPackage.discountPercent}% vs base pricing`
          } : null
        }
      },
      alternatives,
      insights,
      currentStatus: {
        messagesUsed: currentUsage.currentMessages,
        messagesRemaining: limitCheck.remaining,
        limitAmount: limitCheck.limitAmount,
        topupBalance: topupBalance.totalMessagesAvailable,
        totalAvailable: limitCheck.remaining + topupBalance.totalMessagesAvailable
      },
      actions: {
        immediate: recommendationType === 'immediate',
        canPurchase: true,
        purchaseUrl: '/api/topup/purchase',
        viewBalance: '/api/topup/balance'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in top-up recommendation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
/**
 * Enhanced Usage Dashboard API V2
 * 
 * Provides comprehensive usage statistics, top-up information, and Premium recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUID } from '@/lib/auth/utils';
import { aiUsageService } from '@/lib/services/ai-usage-service';
import { featureFlagService } from '@/lib/services/feature-flag-service';
import { topUpService } from '@/lib/services/topup-service';
import { premiumTierService } from '@/lib/services/premium-tier-service';
import { getUsageStatus } from '@/lib/middleware/ai-limit-middleware-v2';
import { formatPriceEUR } from '@/lib/subscription-plans-v2';
import { proBoostService } from '@/lib/services/pro-boost-service';
import { OrganizationSettingsService } from '@/lib/services/organization-settings-service';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session (prefer NextAuth), fallback to Supabase auth
    const session = await import('next-auth/next').then(m => m.getServerSession?.(require('@/app/api/auth/[...nextauth]/route').authOptions as any)).catch(() => null);
    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.userId;
    const uid = sessionUserId || await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization (optional for independent users)
    const organizationId = await featureFlagService.getUserOrganization(uid);
    
    // If no organization, create a fallback organization ID or handle independent users
    if (!organizationId) {
      console.log(`User ${uid} has no organization, providing fallback AI usage data`);
      
      // Return empty but valid AI usage structure for independent users
      return NextResponse.json({
        savings: {
          timeSavedMinutes: 0,
          costSavedUsd: 0,
          tasksCompleted: 0,
          headline: "Connect to an organization to track AI savings",
          topContributor: null
        },
        quality: {
          autoApproved: 0,
          requiresReview: 0,
          completed: 0
        },
        usage: {
          current: { requests: 0, tokens: 0, costUsd: 0 },
          limit: { requests: 1000, tokens: 100000, costUsd: 50 },
          limitExceeded: false,
          monthlyUsage: []
        },
        insights: {
          efficiency: {
            mostUsedFeature: null,
            averageTaskTime: 0,
            peakUsageHour: null
          },
          savings: {
            headline: "Start using AI features to see savings",
            topContributor: null
          }
        },
        organization: null,
        proBoost: { active: false, expiresAt: null, remainingCredits: 0 }
      });
    }

    // Get all data in parallel for better performance
    const [
      currentUsage,
      limitCheck,
      monthlyUsage,
      usageHistory,
      featureRestrictions,
      usageStatus,
      topupBalance,
      topupRecommendation,
      premiumRecommendation,
      organizationData,
      proBoostStatus
    ] = await Promise.all([
      aiUsageService.getCurrentUsage(organizationId),
      aiUsageService.checkLimitExceeded(organizationId),
      aiUsageService.getMonthlyUsage(organizationId),
      aiUsageService.getUsageHistory(organizationId, 10),
      featureFlagService.getFeatureRestrictions(organizationId),
      getUsageStatus(organizationId),
      topUpService.getBalance(organizationId),
      topUpService.recommendTopUp(organizationId, 0, 50), // Will be updated with real values
      premiumTierService.getTierRecommendation(organizationId),
      (async () => {
        const supabase = await createClient();
        const { data: org } = await supabase
          .from('organizations')
          .select('name, subscription_tier, subscription_status, beta_early_adopter')
          .eq('id', organizationId)
          .single();
        return org;
      })(),
      proBoostService.getStatus(organizationId)
    ]);

    if (!currentUsage || !limitCheck || !usageStatus || !topupBalance) {
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }

    // Update top-up recommendation with real usage data
    const updatedTopupRecommendation = await topUpService.recommendTopUp(
      organizationId,
      limitCheck.currentUsage,
      limitCheck.limitAmount
    );

    // Calculate usage patterns and insights
    const usagePercentage = limitCheck.limitAmount > 0 
      ? Math.round((limitCheck.currentUsage / limitCheck.limitAmount) * 100)
      : 0;

    const daysIntoMonth = new Date().getDate();
    const dailyAverage = limitCheck.currentUsage / daysIntoMonth;
    const projectedMonthlyUsage = Math.round(dailyAverage * 30);

    // Determine overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' | 'blocked' = 'healthy';
    const alerts: Array<{
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      action?: {
        label: string;
        url: string;
      };
    }> = [];

    // Status and alerts logic
    if (!usageStatus.total.canMakeRequest) {
      overallStatus = 'blocked';
      alerts.push({
        type: 'error',
        title: 'No AI Messages Available',
        message: 'You\'ve exhausted both your subscription limit and top-up balance.',
        action: {
          label: 'Purchase Top-Up',
          url: '/api/topup/packages'
        }
      });
    } else if (usageStatus.subscription.exceeded && topupBalance.totalMessagesAvailable < 10) {
      overallStatus = 'critical';
      alerts.push({
        type: 'error',
        title: 'Low on Top-Up Messages',
        message: 'You\'re using top-up messages and running low. Consider purchasing more.',
        action: {
          label: 'Buy More Top-Ups',
          url: '/api/topup/packages'
        }
      });
    } else if (usageStatus.subscription.exceeded) {
      overallStatus = 'warning';
      alerts.push({
        type: 'warning',
        title: 'Using Top-Up Messages',
        message: 'You\'ve exceeded your subscription limit and are now using purchased top-ups. Upgrade to reduce per-message cost.',
        action: {
          label: 'Upgrade Plan',
          url: '/pricing'
        }
      });
    } else if (usagePercentage >= 90) {
      overallStatus = 'warning';
      alerts.push({
        type: 'warning',
        title: 'Approaching Limit',
        message: `You've used ${usagePercentage}% of your monthly AI messages.`,
        action: {
          label: 'Consider Top-Up',
          url: '/api/topup/recommend'
        }
      });
    } else if (usagePercentage >= 70) {
      alerts.push({
        type: 'info',
        title: 'Usage Update',
        message: `You've used ${usagePercentage}% of your monthly AI messages. Keep momentum going with a small top-up.`,
      });
    } else if (usagePercentage >= 50) {
      alerts.push({
        type: 'info',
        title: 'Halfway There',
        message: `You've used 50% of your monthly AI messages. Explore Pro to unlock more capacity.`,
        action: {
          label: 'Explore Pro',
          url: '/pricing'
        }
      });
    }

    // Add growth-based alerts
    if (projectedMonthlyUsage > limitCheck.limitAmount * 1.5) {
      alerts.push({
        type: 'info',
        title: 'Growth Projection',
        message: 'Based on current usage, you may significantly exceed your limit this month.',
        action: {
          label: 'Plan Upgrade',
          url: '/api/premium/recommend'
        }
      });
    }

    // Add beta user benefits
    if (organizationData?.beta_early_adopter) {
      alerts.push({
        type: 'success',
        title: 'Beta Early Adopter',
        message: 'You\'ll receive special pricing when upgrading from beta.',
      });
    }

    // Show Pro Boost active alert
    if (proBoostStatus?.active) {
      alerts.push({
        type: 'success',
        title: 'Pro Boost Active',
        message: `Enjoy Pro features until ${proBoostStatus.endAt?.slice(0,10)}.`,
        action: {
          label: 'Upgrade Now',
          url: '/pricing'
        }
      });
    }

    // Build comprehensive response
    // Compute quality metrics from learning data and queue statuses (last 30 days)
    const supabaseClient = await createClient();
    const thirtyDaysAgoISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    // Get organization users
    const { data: orgMembers } = await supabaseClient
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId);
    const orgUserIds = (orgMembers || []).map((m: any) => m.user_id);

    // Learning quality: acceptance/edit stats using ai_learning_data for org users
    let qualityMetrics = {
      acceptanceRate: 0,
      sampleSize: 0,
      avgChanges: 0,
      avgLengthChangePct: 0
    };
    if (orgUserIds.length > 0) {
      const { data: learningRows } = await supabaseClient
        .from('ai_learning_data')
        .select('learning_metrics')
        .in('user_id', orgUserIds)
        .gte('created_at', thirtyDaysAgoISO);
      if (learningRows && learningRows.length > 0) {
        const sampleSize = learningRows.length;
        let accepted = 0;
        let totalChanges = 0;
        let totalPct = 0;
        for (const row of learningRows) {
          const m = row.learning_metrics || {};
          if ((m.totalChanges || 0) === 0) accepted++;
          totalChanges += m.totalChanges || 0;
          totalPct += typeof m.lengthChangePercentage === 'number' ? m.lengthChangePercentage : 0;
        }
        qualityMetrics = {
          acceptanceRate: Math.round((accepted / sampleSize) * 100),
          sampleSize,
          avgChanges: Math.round((totalChanges / sampleSize) * 10) / 10,
          avgLengthChangePct: Math.round((totalPct / sampleSize) * 10) / 10
        };
      }
    }

    // Auto vs semi-auto split from email_queue
    const { data: queueRows } = await supabaseClient
      .from('email_queue')
      .select('status')
      .eq('organization_id', organizationId)
      .gte('created_at', thirtyDaysAgoISO);
    const autoSemi = { autoApproved: 0, requiresReview: 0, completed: 0 };
    if (queueRows) {
      for (const r of queueRows) {
        const s = (r.status || '').toLowerCase();
        if (s === 'approved') autoSemi.autoApproved++;
        else if (s === 'requires_review') autoSemi.requiresReview++;
        else if (s === 'completed') autoSemi.completed++;
      }
    }
    // Compute time and cost savings (estimates)
    const orgSettings = new OrganizationSettingsService();
    const savingsConfig = (await orgSettings.getSetting<any>(organizationId, 'ai_savings_config')) || {};
    const hourlyRateUsdSetting = await orgSettings.getSetting<number>(organizationId, 'ai_savings_hourly_rate_usd');
    const hourlyRateUsd = typeof hourlyRateUsdSetting === 'number' && hourlyRateUsdSetting > 0 ? hourlyRateUsdSetting : 30; // default $30/h

    const defaultMinutesPerType: Record<string, number> = {
      email_response: savingsConfig.email_response_minutes ?? 7,
      drafting: savingsConfig.drafting_minutes ?? 8,
      ai_future: savingsConfig.ai_future_minutes ?? 5,
      profiling: savingsConfig.profiling_minutes ?? 2,
      general: savingsConfig.general_minutes ?? 3
    };

    const breakdown = monthlyUsage?.breakdown || {};
    const minutesSavedByType = Object.entries(breakdown).reduce<Record<string, number>>((acc, [type, count]) => {
      const minutesPer = defaultMinutesPerType[type] ?? 3;
      const messages = typeof count === 'number' ? count : 0;
      acc[type] = messages * minutesPer;
      return acc;
    }, {});

    const totalMinutesSaved = Object.values(minutesSavedByType).reduce((a, b) => a + b, 0);
    const totalHoursSaved = totalMinutesSaved / 60;
    const costSavedUsd = (totalMinutesSaved / 60) * hourlyRateUsd;

    const response = {
      status: overallStatus,
      organization: {
        id: organizationId,
        name: organizationData?.name || 'Unknown',
        subscriptionTier: organizationData?.subscription_tier || 'starter',
        subscriptionStatus: organizationData?.subscription_status || 'active',
        betaEarlyAdopter: organizationData?.beta_early_adopter || false
      },
      usage: {
        subscription: {
          current: limitCheck.currentUsage,
          limit: limitCheck.limitAmount,
          remaining: Math.max(0, limitCheck.remaining),
          percentage: usagePercentage,
          exceeded: limitCheck.limitExceeded,
          unlimited: limitCheck.limitAmount === -1
        },
        topup: {
          available: topupBalance.totalMessagesAvailable,
          totalSpent: topupBalance.totalSpentEur,
          totalSpentFormatted: formatPriceEUR(topupBalance.totalSpentEur),
          totalPurchases: topupBalance.totalPurchases,
          activeTopups: topupBalance.activeTopups,
          hasBalance: topupBalance.totalMessagesAvailable > 0,
          lowBalance: topupBalance.totalMessagesAvailable < 10
        },
        total: {
          available: usageStatus.total.available,
          canMakeRequest: usageStatus.total.canMakeRequest
        },
        patterns: {
          dailyAverage: Math.round(dailyAverage),
          projectedMonthly: projectedMonthlyUsage,
          daysIntoMonth,
          utilizationTrend: projectedMonthlyUsage > limitCheck.limitAmount ? 'increasing' : 'stable',
          peakUsage: Math.max(...(usageHistory.map(h => 1) || [0])), // Simplified
          averageTokensPerMessage: monthlyUsage?.totalTokens && monthlyUsage.totalMessages > 0 
            ? Math.round(monthlyUsage.totalTokens / monthlyUsage.totalMessages) 
            : 0
        }
      },
      savings: {
        time: {
          minutes: Math.round(totalMinutesSaved),
          hours: Math.round(totalHoursSaved * 10) / 10,
          workDays: Math.round((totalHoursSaved / 8) * 10) / 10
        },
        cost: {
          hourlyRateUsd,
          savedUsd: Math.round(costSavedUsd * 100) / 100
        },
        breakdown: {
          minutesByType: minutesSavedByType
        }
      },
      quality: {
        acceptanceRate: qualityMetrics.acceptanceRate,
        sampleSize: qualityMetrics.sampleSize,
        avgChanges: qualityMetrics.avgChanges,
        avgLengthChangePct: qualityMetrics.avgLengthChangePct,
        autoVsSemi: autoSemi
      },
      period: {
        start: currentUsage.periodStart,
        end: currentUsage.periodEnd,
        daysRemaining: currentUsage.periodEnd ? 
          Math.ceil((new Date(currentUsage.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
          null
      },
      features: {
        plan: featureRestrictions.plan,
        available: featureRestrictions.features,
        restrictions: featureRestrictions.restrictions,
        upgradeRecommendations: featureRestrictions.upgradeRecommendations
      },
      recommendations: {
        topup: updatedTopupRecommendation ? {
          package: {
            ...updatedTopupRecommendation.recommended,
            priceFormatted: formatPriceEUR(updatedTopupRecommendation.recommended.priceEur)
          },
          reasoning: updatedTopupRecommendation.reasoning,
          urgency: updatedTopupRecommendation.urgency
        } : null,
        premium: premiumRecommendation ? {
          tier: premiumRecommendation.recommendedTier.premiumTier,
          plan: premiumRecommendation.recommendedTier.name,
          monthlyPrice: premiumRecommendation.recommendedTier.monthlyPrice,
          monthlyPriceFormatted: formatPriceEUR(premiumRecommendation.recommendedTier.monthlyPrice),
          reasoning: premiumRecommendation.reasoning,
          urgency: premiumRecommendation.urgency,
          benefits: premiumRecommendation.benefits.slice(0, 3) // Top 3 benefits
        } : null
      },
      recentActivity: usageHistory.map(activity => ({
        id: activity.id,
        type: activity.messageType,
        feature: activity.featureUsed,
        tokens: activity.tokensUsed,
        cost: activity.costUsd,
        timestamp: activity.createdAt
      })),
      alerts,
      actions: {
        canPurchaseTopup: true,
        canUpgrade: true,
        purchaseTopupUrl: '/api/topup/packages',
        upgradeUrl: '/pricing',
        usageHistoryUrl: '/api/usage/dashboard-v2',
        topupRecommendUrl: '/api/topup/recommend',
        premiumRecommendUrl: '/api/premium/recommend',
      proBoostActivateUrl: '/api/pro-boost/activate'
      },
      proBoost: proBoostStatus,
      insights: {
        costOptimization: {
          currentMonthCost: topupBalance.totalSpentEur,
          projectedCost: projectedMonthlyUsage > limitCheck.limitAmount 
            ? (projectedMonthlyUsage - limitCheck.limitAmount) * 0.05 
            : 0,
          potentialSavings: premiumRecommendation 
            ? `Upgrading to ${premiumRecommendation.recommendedTier.name} could save money with high usage`
            : null
        },
        efficiency: {
          averageTokensPerMessage: monthlyUsage?.totalTokens && monthlyUsage.totalMessages > 0 
            ? Math.round(monthlyUsage.totalTokens / monthlyUsage.totalMessages) 
            : 0,
          mostUsedFeature: monthlyUsage?.breakdown 
            ? Object.entries(monthlyUsage.breakdown).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0]
            : 'email_response'
        },
        savings: {
          headline: `Saved ~${Math.round(totalHoursSaved)} hours (${Math.round(costSavedUsd)} USD) this month`,
          topContributor: Object.entries(minutesSavedByType).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || null
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in enhanced usage dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
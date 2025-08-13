/**
 * Top-Up Balance API
 * 
 * GET: Returns organization's current top-up balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUID } from '@/lib/auth/utils';
import { topUpService } from '@/lib/services/topup-service';
import { featureFlagService } from '@/lib/services/feature-flag-service';
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

    // Get top-up balance
    const balance = await topUpService.getBalance(organizationId);
    if (!balance) {
      return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 });
    }

    // Get statistics
    const statistics = await topUpService.getStatistics(organizationId);

    // Format response
    const response = {
      balance: {
        totalMessages: balance.totalMessagesAvailable,
        totalPurchases: balance.totalPurchases,
        totalSpent: balance.totalSpentEur,
        totalSpentFormatted: formatPriceEUR(balance.totalSpentEur),
        activeTopups: balance.activeTopups.map(topup => ({
          id: topup.id,
          packageId: topup.packageId,
          messagesRemaining: topup.messagesRemaining,
          expiresAt: topup.expiresAt,
          createdAt: topup.createdAt
        }))
      },
      statistics: {
        totalPurchased: statistics.totalPurchased,
        totalUsed: statistics.totalUsed,
        totalSpent: statistics.totalSpent,
        totalSpentFormatted: formatPriceEUR(statistics.totalSpent),
        averagePackageSize: Math.round(statistics.averagePackageSize),
        mostPopularPackage: statistics.mostPopularPackage,
        monthlySpending: statistics.monthlySpending,
        monthlySpendingFormatted: formatPriceEUR(statistics.monthlySpending),
        utilizationRate: statistics.totalPurchased > 0 
          ? Math.round((statistics.totalUsed / statistics.totalPurchased) * 100)
          : 0
      },
      hasBalance: balance.totalMessagesAvailable > 0,
      lowBalance: balance.totalMessagesAvailable < 10,
      needsTopup: balance.totalMessagesAvailable === 0
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in top-up balance API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
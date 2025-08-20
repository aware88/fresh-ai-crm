/**
 * Top-Up Purchase API
 * 
 * POST: Create a new top-up purchase
 * GET: Get purchase history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUID } from '@/lib/auth/utils';
import { topUpService } from '@/lib/services/topup-service';
import { featureFlagService } from '@/lib/services/feature-flag-service';
import { formatPriceUSD } from '@/lib/subscription-plans-v2';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { 
      packageId,
      paymentProvider = 'stripe',
      returnUrl,
      cancelUrl
    } = body;

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    // Validate package exists
    const packageInfo = topUpService.getPackage(packageId);
    if (!packageInfo) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
    }

    // Enforce Starter monthly cap on top-ups (psychological guardrail)
    // Starter can top-up max 300 messages per calendar month to avoid perpetual free usage
    try {
      const supabase = await createServerClient();
      const { data: org } = await supabase
        .from('organizations')
        .select('subscription_tier')
        .eq('id', organizationId)
        .single();

      const tier = (org?.subscription_tier || '').toLowerCase();
      if (tier === 'starter') {
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        const purchases = await topUpService.getPurchaseHistory(organizationId, 100, 0);
        const monthlyPurchased = purchases
          .filter(p => p.paymentStatus === 'completed' && new Date(p.createdAt) >= startOfMonth)
          .reduce((sum, p) => sum + p.messagesPurchased, 0);

        const MONTHLY_CAP = 300;
        if (monthlyPurchased >= MONTHLY_CAP || monthlyPurchased + packageInfo.messages > MONTHLY_CAP) {
          return NextResponse.json({
            error: 'Starter top-up monthly cap reached',
            details: {
              monthlyCap: MONTHLY_CAP,
              purchasedThisMonth: monthlyPurchased,
              packageMessages: packageInfo.messages
            }
          }, { status: 403 });
        }
      }
    } catch (capError) {
      console.warn('Starter top-up cap check failed:', capError);
      // Do not block purchase if cap check fails
    }

    // Create pending purchase
    const purchaseId = await topUpService.createPurchase(
      organizationId,
      uid,
      packageId,
      paymentProvider
    );

    if (!purchaseId) {
      return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
    }

    // In a real implementation, you would integrate with Stripe here
    // For now, we'll return the purchase details for frontend processing
    const response = {
      purchaseId,
      package: {
        id: packageInfo.id,
        name: packageInfo.name,
        description: packageInfo.description,
        messages: packageInfo.messages,
        priceUsd: packageInfo.priceUsd,
        priceFormatted: formatPriceUSD(packageInfo.priceUsd)
      },
      paymentProvider,
      status: 'pending',
      // In real implementation, these would be Stripe payment URLs
      paymentUrl: `/api/topup/payment/${purchaseId}`,
      returnUrl: returnUrl || '/dashboard/usage',
      cancelUrl: cancelUrl || '/dashboard/usage',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      instructions: 'Complete payment to activate your AI message top-up'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating top-up purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // pending, completed, failed, refunded

    // Get purchase history
    let purchases = await topUpService.getPurchaseHistory(organizationId, limit, offset);

    // Filter by status if specified
    if (status) {
      purchases = purchases.filter(p => p.paymentStatus === status);
    }

    // Format purchases for response
    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      packageId: purchase.packageId,
      messagesPurchased: purchase.messagesPurchased,
      messagesRemaining: purchase.messagesRemaining,
      messagesUsed: purchase.messagesPurchased - purchase.messagesRemaining,
      pricePaid: purchase.pricePaidEur,
      pricePaidFormatted: formatPriceEUR(purchase.pricePaidEur),
      paymentStatus: purchase.paymentStatus,
      paymentProvider: purchase.paymentProvider,
      expiresAt: purchase.expiresAt,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      utilizationRate: purchase.messagesPurchased > 0 
        ? Math.round(((purchase.messagesPurchased - purchase.messagesRemaining) / purchase.messagesPurchased) * 100)
        : 0
    }));

    // Get totals
    const totals = {
      totalPurchases: purchases.length,
      totalSpent: purchases.reduce((sum, p) => sum + p.pricePaidEur, 0),
      totalMessages: purchases.reduce((sum, p) => sum + p.messagesPurchased, 0),
      totalRemaining: purchases.filter(p => p.paymentStatus === 'completed')
        .reduce((sum, p) => sum + p.messagesRemaining, 0)
    };

    return NextResponse.json({
      purchases: formattedPurchases,
      totals: {
        ...totals,
        totalSpentFormatted: formatPriceEUR(totals.totalSpent)
      },
      pagination: {
        limit,
        offset,
        hasMore: purchases.length === limit
      }
    });

  } catch (error) {
    console.error('Error getting purchase history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
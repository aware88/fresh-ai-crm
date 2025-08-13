/**
 * AI Message Top-Up Service
 * 
 * This service handles purchasing and managing AI message top-ups
 */

import { createClient } from '@/lib/supabase/server';
import { topUpPackages, getTopUpPackage, type TopUpPackage } from '@/lib/subscription-plans-v2';

export interface TopUpBalance {
  totalMessagesAvailable: number;
  totalPurchases: number;
  totalSpentEur: number;
  activeTopups: Array<{
    id: string;
    packageId: string;
    messagesRemaining: number;
    expiresAt?: string;
    createdAt: string;
  }>;
}

export interface TopUpPurchase {
  id: string;
  organizationId: string;
  userId: string;
  packageId: string;
  messagesPurchased: number;
  messagesRemaining: number;
  pricePaidEur: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentProvider?: string;
  paymentProviderId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopUpUsageResult {
  messagesUsed: number;
  topupsUsed: Array<{
    topupId: string;
    packageId: string;
    messagesUsed: number;
  }>;
  success: boolean;
}

export class TopUpService {
  private async getClient() {
    return await createClient();
  }

  /**
   * Get available top-up packages
   */
  getAvailablePackages(): TopUpPackage[] {
    return topUpPackages;
  }

  /**
   * Get top-up package by ID
   */
  getPackage(packageId: string): TopUpPackage | null {
    return getTopUpPackage(packageId);
  }

  /**
   * Get organization's top-up balance
   */
  async getBalance(organizationId: string): Promise<TopUpBalance | null> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.rpc('get_topup_balance', {
        org_id: organizationId
      });

      if (error) {
        console.error('Error getting top-up balance:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          totalMessagesAvailable: 0,
          totalPurchases: 0,
          totalSpentEur: 0,
          activeTopups: []
        };
      }

      const balance = data[0];
      return {
        totalMessagesAvailable: balance.total_messages_available || 0,
        totalPurchases: balance.total_purchases || 0,
        totalSpentEur: parseFloat(balance.total_spent_eur || '0'),
        activeTopups: balance.active_topups || []
      };
    } catch (error) {
      console.error('Exception getting top-up balance:', error);
      return null;
    }
  }

  /**
   * Check if organization has available top-up messages
   */
  async hasAvailableMessages(organizationId: string, messagesNeeded: number = 1): Promise<boolean> {
    const balance = await this.getBalance(organizationId);
    return balance ? balance.totalMessagesAvailable >= messagesNeeded : false;
  }

  /**
   * Use top-up messages (FIFO order)
   */
  async useMessages(
    organizationId: string,
    userId: string,
    messagesNeeded: number,
    usageTrackingId?: string
  ): Promise<TopUpUsageResult | null> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.rpc('use_topup_messages', {
        org_id: organizationId,
        user_id: userId,
        messages_needed: messagesNeeded,
        usage_tracking_id: usageTrackingId || null
      });

      if (error) {
        console.error('Error using top-up messages:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          messagesUsed: 0,
          topupsUsed: [],
          success: false
        };
      }

      const result = data[0];
      return {
        messagesUsed: result.messages_used || 0,
        topupsUsed: result.topups_used || [],
        success: result.success || false
      };
    } catch (error) {
      console.error('Exception using top-up messages:', error);
      return null;
    }
  }

  /**
   * Create a pending top-up purchase
   */
  async createPurchase(
    organizationId: string,
    userId: string,
    packageId: string,
    paymentProvider: string = 'stripe'
  ): Promise<string | null> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.rpc('create_topup_purchase', {
        org_id: organizationId,
        user_id: userId,
        package_id_param: packageId,
        payment_provider_param: paymentProvider
      });

      if (error) {
        console.error('Error creating top-up purchase:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception creating top-up purchase:', error);
      return null;
    }
  }

  /**
   * Complete a top-up purchase after successful payment
   */
  async completePurchase(purchaseId: string, paymentProviderId: string): Promise<boolean> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.rpc('complete_topup_purchase', {
        purchase_id: purchaseId,
        payment_provider_id_param: paymentProviderId
      });

      if (error) {
        console.error('Error completing top-up purchase:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Exception completing top-up purchase:', error);
      return false;
    }
  }

  /**
   * Get organization's purchase history
   */
  async getPurchaseHistory(
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TopUpPurchase[]> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('ai_topup_purchases')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting purchase history:', error);
        return [];
      }

      return data.map((purchase: any) => ({
        id: purchase.id,
        organizationId: purchase.organization_id,
        userId: purchase.user_id,
        packageId: purchase.package_id,
        messagesPurchased: purchase.messages_purchased,
        messagesRemaining: purchase.messages_remaining,
        pricePaidEur: parseFloat(purchase.price_paid_eur || '0'),
        paymentStatus: purchase.payment_status,
        paymentProvider: purchase.payment_provider,
        paymentProviderId: purchase.payment_provider_id,
        expiresAt: purchase.expires_at,
        createdAt: purchase.created_at,
        updatedAt: purchase.updated_at
      }));
    } catch (error) {
      console.error('Exception getting purchase history:', error);
      return [];
    }
  }

  /**
   * Get pending purchases for an organization
   */
  async getPendingPurchases(organizationId: string): Promise<TopUpPurchase[]> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('ai_topup_purchases')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting pending purchases:', error);
        return [];
      }

      return data.map((purchase: any) => ({
        id: purchase.id,
        organizationId: purchase.organization_id,
        userId: purchase.user_id,
        packageId: purchase.package_id,
        messagesPurchased: purchase.messages_purchased,
        messagesRemaining: purchase.messages_remaining,
        pricePaidEur: parseFloat(purchase.price_paid_eur || '0'),
        paymentStatus: purchase.payment_status,
        paymentProvider: purchase.payment_provider,
        paymentProviderId: purchase.payment_provider_id,
        expiresAt: purchase.expires_at,
        createdAt: purchase.created_at,
        updatedAt: purchase.updated_at
      }));
    } catch (error) {
      console.error('Exception getting pending purchases:', error);
      return [];
    }
  }

  /**
   * Calculate recommended top-up based on usage patterns
   */
  async recommendTopUp(
    organizationId: string,
    currentUsage: number,
    limit: number
  ): Promise<{
    recommended: TopUpPackage;
    reasoning: string;
    urgency: 'low' | 'medium' | 'high';
  }> {
    const remaining = limit - currentUsage;
    const usagePercent = (currentUsage / limit) * 100;

    // Calculate how many messages they might need
    let estimatedNeed = 0;
    let urgency: 'low' | 'medium' | 'high' = 'low';
    let reasoning = '';

    if (usagePercent >= 90) {
      estimatedNeed = Math.max(100, Math.floor(limit * 0.5)); // 50% of their limit
      urgency = 'high';
      reasoning = 'You\'ve used 90%+ of your messages. We recommend purchasing extra messages now.';
    } else if (usagePercent >= 70) {
      estimatedNeed = Math.max(100, Math.floor(limit * 0.3)); // 30% of their limit
      urgency = 'medium';
      reasoning = 'You\'re approaching your limit. Consider purchasing extra messages soon.';
    } else {
      estimatedNeed = 100; // Minimum package
      urgency = 'low';
      reasoning = 'You have plenty of messages remaining, but you can always stock up.';
    }

    // Find best package for estimated need
    let recommended = topUpPackages[0]; // Default to smallest
    
    for (const pkg of topUpPackages) {
      if (pkg.messages >= estimatedNeed) {
        recommended = pkg;
        break;
      }
    }

    // If they need more than our largest package, recommend the largest
    if (estimatedNeed > topUpPackages[topUpPackages.length - 1].messages) {
      recommended = topUpPackages[topUpPackages.length - 1];
    }

    return {
      recommended,
      reasoning,
      urgency
    };
  }

  /**
   * Get top-up statistics for an organization
   */
  async getStatistics(organizationId: string): Promise<{
    totalPurchased: number;
    totalSpent: number;
    totalUsed: number;
    averagePackageSize: number;
    mostPopularPackage: string;
    monthlySpending: number;
    upgradeNudge?: {
      suggestUpgrade: boolean;
      message: string;
    };
  }> {
    try {
      // Get all completed purchases
      const purchases = await this.getPurchaseHistory(organizationId, 1000);
      const completedPurchases = purchases.filter(p => p.paymentStatus === 'completed');

      if (completedPurchases.length === 0) {
        return {
          totalPurchased: 0,
          totalSpent: 0,
          totalUsed: 0,
          averagePackageSize: 0,
          mostPopularPackage: 'none',
          monthlySpending: 0,
          upgradeNudge: { suggestUpgrade: false, message: '' }
        };
      }

      const totalPurchased = completedPurchases.reduce((sum, p) => sum + p.messagesPurchased, 0);
      const totalSpent = completedPurchases.reduce((sum, p) => sum + p.pricePaidEur, 0);
      const totalRemaining = completedPurchases.reduce((sum, p) => sum + p.messagesRemaining, 0);
      const totalUsed = totalPurchased - totalRemaining;

      const averagePackageSize = totalPurchased / completedPurchases.length;

      // Find most popular package
      const packageCounts: Record<string, number> = {};
      completedPurchases.forEach(p => {
        packageCounts[p.packageId] = (packageCounts[p.packageId] || 0) + 1;
      });
      
      const mostPopularPackage = Object.entries(packageCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

      // Calculate monthly spending (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPurchases = completedPurchases.filter(p => 
        new Date(p.createdAt) >= thirtyDaysAgo
      );
      const monthlySpending = recentPurchases.reduce((sum, p) => sum + p.pricePaidEur, 0);

      // Simple upgrade nudge: if monthly spending approaches Pro monthly price (29 EUR), suggest upgrade
      const nudgeThreshold = 20; // EUR
      const suggestUpgrade = monthlySpending >= nudgeThreshold;
      const message = suggestUpgrade ? 'You might save by upgrading your plan based on recent top-up spending.' : '';

      return {
        totalPurchased,
        totalSpent,
        totalUsed,
        averagePackageSize,
        mostPopularPackage,
        monthlySpending,
        upgradeNudge: { suggestUpgrade, message }
      };
    } catch (error) {
      console.error('Exception getting top-up statistics:', error);
      return {
        totalPurchased: 0,
        totalSpent: 0,
        totalUsed: 0,
        averagePackageSize: 0,
        mostPopularPackage: 'none',
        monthlySpending: 0
      };
    }
  }
}

// Export singleton instance
export const topUpService = new TopUpService();
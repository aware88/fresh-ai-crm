import { createClient } from '@/lib/supabase/server';
import { SubscriptionPlan } from './subscription-service';

/**
 * Admin extension for the SubscriptionService class
 * Contains methods for administrative subscription management
 */
export class SubscriptionServiceAdmin {
  /**
   * Get all subscription plans, including inactive ones if requested
   * @param includeInactive Whether to include inactive plans
   */
  async getAllSubscriptionPlans(includeInactive: boolean = false): Promise<SubscriptionPlan[]> {
    const supabase = createClient();
    
    let query = supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });
    
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
    
    return data as SubscriptionPlan[];
  }

  /**
   * Create a new subscription plan
   * @param plan The plan data to create
   */
  async createSubscriptionPlan(plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        name: plan.name,
        description: plan.description || '',
        price: plan.price || 0,
        billing_interval: plan.billing_interval || 'monthly',
        features: plan.features || {},
        is_active: plan.is_active !== undefined ? plan.is_active : true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating subscription plan:', error);
      throw new Error('Failed to create subscription plan');
    }
    
    return data as SubscriptionPlan;
  }

  /**
   * Update an existing subscription plan
   * @param id The ID of the plan to update
   * @param updates The updates to apply
   */
  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        name: updates.name,
        description: updates.description,
        price: updates.price,
        billing_interval: updates.billing_interval,
        features: updates.features,
        is_active: updates.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating subscription plan:', error);
      throw new Error('Failed to update subscription plan');
    }
    
    return data as SubscriptionPlan;
  }

  /**
   * Change an organization's subscription plan
   * @param subscriptionId The ID of the subscription to update
   * @param newPlanId The ID of the new plan
   */
  async changeSubscriptionPlan(subscriptionId: string, newPlanId: string) {
    const supabase = createClient();
    
    // Get the new plan details
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', newPlanId)
      .single();
    
    if (planError || !planData) {
      console.error('Error fetching new plan:', planError);
      throw new Error('Failed to fetch new plan details');
    }
    
    // Update the subscription
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .update({
        subscription_plan_id: newPlanId,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select(`
        *,
        organization:organizations(*),
        subscription_plan:subscription_plans(*)
      `)
      .single();
    
    if (error) {
      console.error('Error changing subscription plan:', error);
      throw new Error('Failed to change subscription plan');
    }
    
    return data;
  }

  /**
   * Cancel a subscription
   * @param subscriptionId The ID of the subscription to cancel
   * @param cancelAtPeriodEnd Whether to cancel at the end of the billing period
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    const supabase = createClient();
    
    let updates: any = {
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString()
    };
    
    // If immediate cancellation, update status
    if (!cancelAtPeriodEnd) {
      updates.status = 'canceled';
    }
    
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select(`
        *,
        organization:organizations(*),
        subscription_plan:subscription_plans(*)
      `)
      .single();
    
    if (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
    
    return data;
  }

  /**
   * Reactivate a canceled subscription
   * @param subscriptionId The ID of the subscription to reactivate
   */
  async reactivateSubscription(subscriptionId: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .update({
        cancel_at_period_end: false,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select(`
        *,
        organization:organizations(*),
        subscription_plan:subscription_plans(*)
      `)
      .single();
    
    if (error) {
      console.error('Error reactivating subscription:', error);
      throw new Error('Failed to reactivate subscription');
    }
    
    return data;
  }

  /**
   * Get subscription analytics data
   * @param startDate The start date for analytics data
   */
  async getSubscriptionAnalytics(startDate: Date) {
    const supabase = createClient();
    
    // Get subscription counts by status
    const { data: subscriptionCounts, error: countError } = await supabase
      .from('organization_subscriptions')
      .select('status')
      .gte('created_at', startDate.toISOString());
    
    if (countError) {
      console.error('Error fetching subscription counts:', countError);
      throw new Error('Failed to fetch subscription analytics');
    }
    
    // Get subscription counts by plan
    const { data: planCounts, error: planError } = await supabase
      .from('organization_subscriptions')
      .select('subscription_plan_id, subscription_plans(name)')
      .gte('created_at', startDate.toISOString());
    
    if (planError) {
      console.error('Error fetching plan counts:', planError);
      throw new Error('Failed to fetch subscription analytics');
    }
    
    // Get subscriptions by month
    const { data: subscriptionsByDate, error: dateError } = await supabase
      .from('organization_subscriptions')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (dateError) {
      console.error('Error fetching subscriptions by date:', dateError);
      throw new Error('Failed to fetch subscription analytics');
    }
    
    // Get MRR data
    const { data: mrrData, error: mrrError } = await supabase
      .from('organization_subscriptions')
      .select('subscription_plans(price, billing_interval)')
      .in('status', ['active', 'trialing'])
      .gte('created_at', startDate.toISOString());
    
    if (mrrError) {
      console.error('Error fetching MRR data:', mrrError);
      throw new Error('Failed to fetch subscription analytics');
    }
    
    // Process subscription counts by status
    const totalSubscriptions = subscriptionCounts.length;
    const activeSubscriptions = subscriptionCounts.filter(s => s.status === 'active').length;
    const trialingSubscriptions = subscriptionCounts.filter(s => s.status === 'trialing').length;
    const canceledSubscriptions = subscriptionCounts.filter(s => s.status === 'canceled').length;
    
    // Process plan distribution
    const planDistribution: Record<string, number> = {};
    planCounts.forEach(item => {
      const planName = item.subscription_plans?.name || 'Unknown';
      planDistribution[planName] = (planDistribution[planName] || 0) + 1;
    });
    
    // Add Free plan if not present
    if (!planDistribution['Free']) {
      planDistribution['Free'] = 0;
    }
    
    // Process subscriptions by month
    const subscriptionsByMonth: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    subscriptionsByDate.forEach(item => {
      const date = new Date(item.created_at);
      const monthKey = months[date.getMonth()];
      subscriptionsByMonth[monthKey] = (subscriptionsByMonth[monthKey] || 0) + 1;
    });
    
    // Calculate MRR
    let mrr = 0;
    mrrData.forEach(item => {
      if (item.subscription_plans) {
        const price = item.subscription_plans.price || 0;
        const interval = item.subscription_plans.billing_interval;
        
        // Convert yearly to monthly
        if (interval === 'yearly') {
          mrr += price / 12;
        } else {
          mrr += price;
        }
      }
    });
    
    // Calculate retention rate (simplified)
    const retentionRate = totalSubscriptions > 0 
      ? Math.round((activeSubscriptions / totalSubscriptions) * 100) 
      : 0;
    
    return {
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      canceledSubscriptions,
      mrr: Math.round(mrr),
      planDistribution,
      subscriptionsByMonth,
      retentionRate
    };
  }
}

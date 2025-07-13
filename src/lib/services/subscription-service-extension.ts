import { SubscriptionService, SubscriptionPlan, OrganizationSubscription } from './subscription-service';
import { subscriptionPlans as predefinedPlans, SubscriptionPlanDefinition } from '@/lib/subscription-plans';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';

/**
 * Extension of the SubscriptionService class that integrates with the predefined pricing tiers
 */
export class EnhancedSubscriptionService extends SubscriptionService {
  /**
   * Initialize subscription plans in the database based on predefined plans
   * This should be run during system setup or when plans are updated
   */
  async initializePredefinedPlans(): Promise<void> {
    const supabase = await createLazyServerClient();
    
    // Get existing plans from the database
    const { data: existingPlans, error } = await supabase
      .from('subscription_plans')
      .select('id, name');
    
    if (error) {
      console.error('Error fetching existing plans:', error);
      throw new Error('Failed to initialize subscription plans');
    }
    
    // Create a map of existing plans by name for quick lookup
    const existingPlanMap = new Map<string, { id: string; name: string }>();
    existingPlans?.forEach(plan => existingPlanMap.set(plan.name, plan));
    
    // Process each predefined plan
    for (const plan of predefinedPlans) {
      // Check if a plan with this name already exists
      const existingPlan = existingPlanMap.get(plan.name);
      
      if (existingPlan) {
        // Update existing plan
        await this.updatePredefinedPlan(existingPlan.id, plan);
      } else {
        // Create new plan
        await this.createPredefinedPlan(plan);
      }
    }
  }
  
  /**
   * Create a new subscription plan from a predefined plan
   */
  private async createPredefinedPlan(plan: SubscriptionPlanDefinition): Promise<void> {
    const supabase = await createLazyServerClient();
    
    const { error } = await supabase
      .from('subscription_plans')
      .insert({
        name: plan.name,
        description: plan.description,
        price: plan.monthlyPrice,
        billing_interval: 'monthly',
        features: plan.features,
        is_active: true
      });
    
    if (error) {
      console.error(`Error creating plan ${plan.name}:`, error);
      throw new Error(`Failed to create subscription plan ${plan.name}`);
    }
    
    // If the plan has an annual option, create that as well
    if (plan.annualPrice > 0 && plan.annualPrice !== plan.monthlyPrice) {
      const { error: annualError } = await supabase
        .from('subscription_plans')
        .insert({
          name: `${plan.name} (Annual)`,
          description: plan.description,
          price: plan.annualPrice * 12, // Store the full annual price
          billing_interval: 'yearly',
          features: plan.features,
          is_active: true
        });
      
      if (annualError) {
        console.error(`Error creating annual plan for ${plan.name}:`, annualError);
        throw new Error(`Failed to create annual subscription plan for ${plan.name}`);
      }
    }
  }
  
  /**
   * Update an existing subscription plan with predefined plan data
   */
  private async updatePredefinedPlan(planId: string, plan: SubscriptionPlanDefinition): Promise<void> {
    const supabase = await createLazyServerClient();
    
    const { error } = await supabase
      .from('subscription_plans')
      .update({
        description: plan.description,
        price: plan.monthlyPrice,
        features: plan.features,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
    
    if (error) {
      console.error(`Error updating plan ${plan.name}:`, error);
      throw new Error(`Failed to update subscription plan ${plan.name}`);
    }
  }
  
  /**
   * Create a trial subscription for an organization
   */
  async createTrialSubscription(
    organizationId: string,
    planId: string
  ): Promise<{ data: OrganizationSubscription | null; error: any }> {
    // Get the plan to determine trial period
    const predefinedPlan = predefinedPlans.find(p => p.id === planId);
    const trialDays = predefinedPlan?.trialDays || 14;
    
    // Calculate trial end date
    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + trialDays);
    
    // Create the subscription with trial status
    return this.createSubscription(
      organizationId,
      planId,
      'trialing',
      trialStart,
      trialEnd
    );
  }
  
  /**
   * Calculate the price for additional users
   */
  calculateAdditionalUserPrice(
    plan: SubscriptionPlan,
    userCount: number
  ): number {
    // Find the predefined plan that matches this database plan
    const predefinedPlan = predefinedPlans.find(p => p.name === plan.name);
    
    if (!predefinedPlan) return 0;
    
    const baseUserLimit = predefinedPlan.userLimit;
    const additionalUserPrice = predefinedPlan.additionalUserPrice || 0;
    
    if (userCount <= baseUserLimit) return 0;
    
    const additionalUsers = userCount - baseUserLimit;
    return additionalUsers * additionalUserPrice;
  }
  
  /**
   * Check if an organization can add more users based on their subscription
   */
  async canAddMoreUsers(
    organizationId: string,
    currentUserCount: number
  ): Promise<{ canAdd: boolean; reason?: string }> {
    // Get the organization's subscription plan
    const { data: plan, error } = await this.getOrganizationSubscriptionPlan(organizationId);
    
    if (error || !plan) {
      return { canAdd: false, reason: 'No active subscription found' };
    }
    
    // Find the predefined plan that matches this database plan
    const predefinedPlan = predefinedPlans.find(p => p.name === plan.name);
    
    if (!predefinedPlan) {
      return { canAdd: false, reason: 'Subscription plan not recognized' };
    }
    
    // Check if the plan supports additional users
    if (predefinedPlan.additionalUserPrice) {
      // Plans with additional user pricing can always add more users
      return { canAdd: true };
    }
    
    // For plans with fixed user limits, check against the limit
    if (currentUserCount < predefinedPlan.userLimit) {
      return { canAdd: true };
    }
    
    return { 
      canAdd: false, 
      reason: `Your plan is limited to ${predefinedPlan.userLimit} users. Please upgrade to add more users.`
    };
  }
  
  /**
   * Check if an organization can add more contacts based on their subscription
   */
  async canAddMoreContacts(
    organizationId: string,
    currentContactCount: number
  ): Promise<{ canAdd: boolean; reason?: string }> {
    // Get the organization's subscription plan
    const { data: plan, error } = await this.getOrganizationSubscriptionPlan(organizationId);
    
    if (error || !plan) {
      return { canAdd: false, reason: 'No active subscription found' };
    }
    
    // Check the MAX_CONTACTS feature
    const maxContacts = plan.features?.MAX_CONTACTS;
    
    if (typeof maxContacts !== 'number') {
      return { canAdd: false, reason: 'Contact limit not defined in subscription' };
    }
    
    // -1 indicates unlimited contacts
    if (maxContacts === -1) {
      return { canAdd: true };
    }
    
    if (currentContactCount < maxContacts) {
      return { canAdd: true };
    }
    
    return { 
      canAdd: false, 
      reason: `Your plan is limited to ${maxContacts} contacts. Please upgrade to add more contacts.`
    };
  }
}

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
    
    // Clean up old plans that are no longer in the predefined list
    const predefinedPlanNames = predefinedPlans.map(p => p.name);
    const obsoletePlans = existingPlans?.filter(plan => !predefinedPlanNames.includes(plan.name)) || [];
    
    for (const obsoletePlan of obsoletePlans) {
      console.log(`Deactivating obsolete plan: ${obsoletePlan.name}`);
      await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', obsoletePlan.id);
    }
  }
  
  /**
   * Create a new subscription plan from a predefined plan
   */
  private async createPredefinedPlan(plan: SubscriptionPlanDefinition): Promise<void> {
    const supabase = await createLazyServerClient();
    
    // Create monthly plan
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
    
    // Create annual plan if different from monthly
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
   * Update an existing subscription plan from a predefined plan
   */
  private async updatePredefinedPlan(planId: string, plan: SubscriptionPlanDefinition): Promise<void> {
    const supabase = await createLazyServerClient();
    
    const { error } = await supabase
      .from('subscription_plans')
      .update({
        description: plan.description,
        price: plan.monthlyPrice,
        features: plan.features,
        is_active: true
      })
      .eq('id', planId);
    
    if (error) {
      console.error(`Error updating plan ${plan.name}:`, error);
      throw new Error(`Failed to update subscription plan ${plan.name}`);
    }
  }
  
  /**
   * Get available plans for individuals
   */
  async getIndividualPlans(): Promise<SubscriptionPlan[]> {
    const supabase = await createLazyServerClient();
    
    const individualPlanNames = predefinedPlans
      .filter(p => !p.isOrganizationPlan)
      .map(p => p.name);
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .in('name', individualPlanNames)
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (error) {
      console.error('Error fetching individual plans:', error);
      throw new Error('Failed to fetch individual plans');
    }
    
    return data as SubscriptionPlan[];
  }
  
  /**
   * Get available plans for organizations
   */
  async getOrganizationPlans(): Promise<SubscriptionPlan[]> {
    const supabase = await createLazyServerClient();
    
    const organizationPlanNames = predefinedPlans
      .filter(p => p.isOrganizationPlan)
      .map(p => p.name);
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .in('name', organizationPlanNames)
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (error) {
      console.error('Error fetching organization plans:', error);
      throw new Error('Failed to fetch organization plans');
    }
    
    return data as SubscriptionPlan[];
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
    
    // Check user limit
    const userLimit = predefinedPlan.userLimit;
    
    // -1 indicates unlimited users
    if (userLimit === -1) {
      return { canAdd: true };
    }
    
    // Check if current user count is below the limit
    if (currentUserCount < userLimit) {
      return { canAdd: true };
    }
    
    return { 
      canAdd: false, 
      reason: `Your ${predefinedPlan.name} plan is limited to ${userLimit} users. Please upgrade to add more users.`
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
    
    // Find the predefined plan for better error message
    const predefinedPlan = predefinedPlans.find(p => p.name === plan.name);
    const planName = predefinedPlan?.name || 'current';
    
    return { 
      canAdd: false, 
      reason: `Your ${planName} plan is limited to ${maxContacts} contacts. Please upgrade to add more contacts.`
    };
  }
  
  /**
   * Get the predefined plan definition for a database plan
   */
  getPredefinedPlanDefinition(planName: string): SubscriptionPlanDefinition | null {
    return predefinedPlans.find(p => p.name === planName) || null;
  }
  
  /**
   * Check if a plan is suitable for organizations
   */
  isOrganizationPlan(planName: string): boolean {
    const predefinedPlan = predefinedPlans.find(p => p.name === planName);
    return predefinedPlan?.isOrganizationPlan || false;
  }
  
  /**
   * Get the appropriate default plan for a user type
   */
  getDefaultPlan(isOrganization: boolean): SubscriptionPlanDefinition | null {
    if (isOrganization) {
      return predefinedPlans.find(p => p.isOrganizationPlan) || null;
    } else {
      return predefinedPlans.find(p => p.popular && !p.isOrganizationPlan) || 
             predefinedPlans.find(p => !p.isOrganizationPlan) || null;
    }
  }
  
  /**
   * Create a trial subscription with the appropriate plan
   */
  async createTrialSubscription(
    organizationId: string,
    planId: string,
    isOrganization: boolean = false
  ): Promise<{ data: OrganizationSubscription | null; error: any }> {
    try {
      const supabase = await createLazyServerClient();
      
      // Get the plan to ensure it exists and is appropriate
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (planError || !plan) {
        return { data: null, error: 'Invalid subscription plan' };
      }
      
      // Check if the plan is appropriate for the user type
      if (isOrganization && !this.isOrganizationPlan(plan.name)) {
        return { data: null, error: 'Selected plan is not available for organizations' };
      }
      
      if (!isOrganization && this.isOrganizationPlan(plan.name)) {
        return { data: null, error: 'Selected plan is only available for organizations' };
      }
      
      // Get the predefined plan for trial days
      const predefinedPlan = this.getPredefinedPlanDefinition(plan.name);
      const trialDays = predefinedPlan?.trialDays || 0;
      
      // Calculate trial end date
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      
      // Create the subscription
      const { data: subscription, error } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: organizationId,
          subscription_plan_id: planId,
          status: trialDays > 0 ? 'trialing' : 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndDate.toISOString(),
          cancel_at_period_end: false,
          subscription_provider: 'system',
          provider_subscription_id: `trial-${Date.now()}`,
          metadata: { 
            trial: trialDays > 0,
            trial_days: trialDays
          }
        })
        .select()
        .single();
      
      return { data: subscription, error };
    } catch (error) {
      console.error('Error creating trial subscription:', error);
      return { data: null, error };
    }
  }
}

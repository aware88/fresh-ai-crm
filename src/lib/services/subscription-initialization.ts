import { SubscriptionService } from './subscription-service';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Service for initializing subscription system
 * This ensures proper subscription plans exist and organizations have default subscriptions
 */
export class SubscriptionInitializationService {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Ensure subscription plans exist in the database
   */
  async ensureSubscriptionPlansExist(): Promise<boolean> {
    try {
      // Use service role client to bypass RLS for system operations
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      // Check if plans already exist
      const { data: existingPlans, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('name')
        .in('name', ['Starter', 'Professional', 'Premium']);
      
      if (fetchError) {
        console.error('Error checking existing plans:', fetchError);
        return false;
      }
      
      const existingPlanNames = existingPlans?.map(p => p.name) || [];
      const requiredPlans = [
        {
          name: 'Starter',
          description: 'Perfect for individual users and small teams',
          price: 0, // Free for now
          billing_interval: 'monthly' as const,
          features: {
            MAX_USERS: 2,
            MAX_CONTACTS: 1000,
            AI_MESSAGES_LIMIT: 50,
            PSYCHOLOGICAL_PROFILING: false,
            AI_FUTURE_ACCESS: false, // No CRM Assistant access
            WHATSAPP_INTEGRATION: false,
            ADVANCED_PSYCHOLOGICAL_PROFILING: false,
            EMAIL_SYNC: false,
            ERP_INTEGRATION: false,
            PRIORITY_SUPPORT: false,
            EMAIL_SUPPORT: true,
            CORE_AUTOMATION: false,
            PHONE_SUPPORT: false,
            DEDICATED_SUCCESS_AGENT: false,
            CUSTOM_INTEGRATIONS: false,
            ADVANCED_ANALYTICS: false,
            WHITE_LABEL: false,
            AI_CUSTOMIZATION: false,
            MOBILE_APP_ACCESS: true
          },
          is_active: true
        },
        {
          name: 'Professional',
          description: 'Built for growing sales teams and professionals',
          price: 0, // Free for now (will be paid later)
          billing_interval: 'monthly' as const,
          features: {
            MAX_USERS: 5,
            MAX_CONTACTS: 5000,
            AI_MESSAGES_LIMIT: 250,
            PSYCHOLOGICAL_PROFILING: true,
            AI_FUTURE_ACCESS: true, // CRM Assistant included
            AI_FUTURE_MESSAGES_LIMIT: 500,
            ADVANCED_PSYCHOLOGICAL_PROFILING: true,
            EMAIL_SYNC: true,
            ERP_INTEGRATION: true,
            WHATSAPP_INTEGRATION: true,
            PRIORITY_SUPPORT: true,
            EMAIL_SUPPORT: true,
            CORE_AUTOMATION: true,
            PHONE_SUPPORT: false,
            DEDICATED_SUCCESS_AGENT: false,
            CUSTOM_INTEGRATIONS: false,
            ADVANCED_ANALYTICS: false,
            WHITE_LABEL: false,
            AI_CUSTOMIZATION: false,
            MOBILE_APP_ACCESS: true
          },
          is_active: true
        },
        {
          name: 'Premium',
          description: 'Built for organizations - requires payment',
          price: 197, // Organizations pay for this
          billing_interval: 'monthly' as const,
          features: {
            MAX_USERS: -1, // Unlimited
            MAX_CONTACTS: -1,
            AI_MESSAGES_LIMIT: -1,
            AI_FUTURE_ACCESS: true, // Full CRM Assistant access
            AI_FUTURE_MESSAGES_LIMIT: -1,
            AI_FUTURE_PRIORITY_SUPPORT: true,
            PSYCHOLOGICAL_PROFILING: true,
            ADVANCED_PSYCHOLOGICAL_PROFILING: true,
            AI_CUSTOMIZATION: true,
            EMAIL_SYNC: true,
            ERP_INTEGRATION: true,
            WHATSAPP_INTEGRATION: true,
            PRIORITY_SUPPORT: true,
            EMAIL_SUPPORT: true,
            CORE_AUTOMATION: true,
            PHONE_SUPPORT: true,
            DEDICATED_SUCCESS_AGENT: true,
            CUSTOM_INTEGRATIONS: true,
            ADVANCED_ANALYTICS: true,
            WHITE_LABEL: true,
            MOBILE_APP_ACCESS: true
          },
          is_active: true
        }
      ];
      
      // Insert missing plans or update existing ones
      for (const plan of requiredPlans) {
        if (!existingPlanNames.includes(plan.name)) {
          console.log(`Creating ${plan.name} subscription plan...`);
          
          try {
            const { data, error: insertError } = await supabase
              .from('subscription_plans')
              .insert(plan)
              .select();
            
            if (insertError) {
              console.error(`❌ Error creating ${plan.name} plan:`, insertError);
              console.error('Plan data that failed:', JSON.stringify(plan, null, 2));
              return false;
            }
            
            console.log(`✅ Created ${plan.name} subscription plan:`, data?.[0]?.id);
          } catch (error) {
            console.error(`❌ Exception creating ${plan.name} plan:`, error);
            return false;
          }
        } else {
          console.log(`📋 ${plan.name} plan already exists, updating features...`);
          
          // Update existing plan to ensure it has the latest features
          try {
            const { error: updateError } = await supabase
              .from('subscription_plans')
              .update({ 
                features: plan.features,
                description: plan.description,
                price: plan.price,
                billing_interval: plan.billing_interval,
                is_active: plan.is_active
              })
              .eq('name', plan.name);
            
            if (updateError) {
              console.error(`❌ Error updating ${plan.name} plan:`, updateError);
              return false;
            }
            
            console.log(`✅ Updated ${plan.name} subscription plan features`);
          } catch (error) {
            console.error(`❌ Exception updating ${plan.name} plan:`, error);
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring subscription plans exist:', error);
      return false;
    }
  }

  /**
   * Get existing subscription for an organization
   * NO automatic creation - users must choose their plan at signup
   */
  async getOrganizationSubscription(organizationId: string): Promise<{
    subscription: any | null;
    plan: any | null;
    error: string | null;
  }> {
    try {
      // First, ensure subscription plans exist
      const plansExist = await this.ensureSubscriptionPlansExist();
      if (!plansExist) {
        return {
          subscription: null,
          plan: null,
          error: 'Failed to initialize subscription plans'
        };
      }

      // Try to get existing subscription
      const { data: subscription, error: subscriptionError } = 
        await this.subscriptionService.getOrganizationSubscription(organizationId);
      
      // Handle PGRST116 (no rows found) as normal case
      if (subscriptionError && subscriptionError.code === 'PGRST116') {
        console.log('📝 No subscription found for organization:', organizationId);
        return {
          subscription: null,
          plan: null,
          error: null
        };
      }
      
      // Handle other errors
      if (subscriptionError) {
        console.error('❌ Error fetching subscription:', subscriptionError);
        return {
          subscription: null,
          plan: null,
          error: 'Failed to fetch subscription'
        };
      }
      
      // If subscription exists, get the plan and return
      if (subscription) {
        const { data: plan, error: planError } = 
          await this.subscriptionService.getSubscriptionPlanById(subscription.subscription_plan_id);
        
        if (planError) {
          return {
            subscription: null,
            plan: null,
            error: 'Failed to fetch subscription plan'
          };
        }
        
        return {
          subscription,
          plan,
          error: null
        };
      }
      
      // No subscription exists - this is normal, user needs to choose a plan
      return {
        subscription: null,
        plan: null,
        error: null
      };
      
    } catch (error) {
      console.error('Error in getOrganizationSubscription:', error);
      return {
        subscription: null,
        plan: null,
        error: 'Internal error'
      };
    }
  }

  /**
   * Create a subscription for a user/organization based on their chosen plan
   * This should be called during signup process
   */
  async createSubscriptionForPlan(
    organizationId: string, 
    planName: 'Starter' | 'Professional' | 'Premium'
  ): Promise<{
    subscription: any | null;
    plan: any | null;
    error: string | null;
  }> {
    try {
      // Ensure plans exist
      await this.ensureSubscriptionPlansExist();
      
      // Get the requested plan
      const { data: plan, error: planError } = 
        await this.subscriptionService.getSubscriptionPlanByName(planName);
      
      if (planError || !plan) {
        return {
          subscription: null,
          plan: null,
          error: `${planName} plan not found`
        };
      }
      
      // Create subscription (1 year validity)
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      
      const { data: newSubscription, error: createError } = 
        await this.subscriptionService.createSubscription(
          organizationId,
          plan.id,
          'active',
          new Date(),
          periodEnd
        );
      
      if (createError) {
        return {
          subscription: null,
          plan: null,
          error: `Failed to create ${planName} subscription`
        };
      }
      
      console.log(`✅ Created ${planName} subscription for organization: ${organizationId}`);
      
      return {
        subscription: newSubscription,
        plan: plan,
        error: null
      };
      
    } catch (error) {
      console.error(`Error creating ${planName} subscription:`, error);
      return {
        subscription: null,
        plan: null,
        error: 'Internal error'
      };
    }
  }

  /**
   * Get plan by name using service role (bypasses RLS)
   */
  private async getPlanByNameWithServiceRole(planName: string) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .ilike('name', planName)
      .single();

    return { data, error };
  }

  /**
   * Create subscription using service role (bypasses RLS)
   */
  private async createSubscriptionWithServiceRole(
    organizationId: string,
    planId: string,
    status: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data, error } = await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: organizationId,
        subscription_plan_id: planId,
        status,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false
      })
      .select()
      .single();

    return { data, error };
  }

  /**
   * Create a premium subscription for development/testing
   * This should ONLY be used for specific development cases
   */
  async createDevelopmentPremiumSubscription(organizationId: string): Promise<{
    subscription: any | null;
    plan: any | null;
    error: string | null;
  }> {
    // Only allow in development and for specific org
    if (process.env.NODE_ENV !== 'development' || 
        organizationId !== '577485fb-50b4-4bb2-a4c6-54b97e1545ad') {
      return {
        subscription: null,
        plan: null,
        error: 'Development premium subscription not allowed'
      };
    }

    try {
      // Ensure plans exist (uses service role)
      const plansCreated = await this.ensureSubscriptionPlansExist();
      if (!plansCreated) {
        return {
          subscription: null,
          plan: null,
          error: 'Failed to ensure subscription plans exist'
        };
      }
      
      // Get premium plan using service role
      const { data: premiumPlan, error: premiumPlanError } = 
        await this.getPlanByNameWithServiceRole('Premium');
      
      if (premiumPlanError || !premiumPlan) {
        console.error('❌ Premium plan error:', premiumPlanError);
        return {
          subscription: null,
          plan: null,
          error: 'Premium plan not found'
        };
      }
      
      console.log('✅ Found Premium plan:', premiumPlan.id);
      
      // Create premium subscription (1 year) using service role
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      
      const { data: newSubscription, error: createError } = 
        await this.createSubscriptionWithServiceRole(
          organizationId,
          premiumPlan.id,
          'active',
          new Date(),
          periodEnd
        );
      
      if (createError) {
        console.error('❌ Subscription creation error:', createError);
        return {
          subscription: null,
          plan: null,
          error: 'Failed to create premium subscription'
        };
      }
      
      console.log('🚧 Created development premium subscription:', newSubscription.id);
      
      return {
        subscription: newSubscription,
        plan: premiumPlan,
        error: null
      };
      
    } catch (error) {
      console.error('❌ Exception in createDevelopmentPremiumSubscription:', error);
      return {
        subscription: null,
        plan: null,
        error: 'Internal error'
      };
    }
  }
}
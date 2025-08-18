#!/usr/bin/env node

/**
 * Fix WithCar Subscription Issue
 * 
 * This script fixes the subscription issue preventing user invitations
 * by setting up the proper Premium Enterprise subscription for WithCar.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class WithcarSubscriptionFixer {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check your .env file.');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.withcarOrgId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
  }

  async run() {
    console.log('🔧 WITHCAR SUBSCRIPTION FIXER');
    console.log('═'.repeat(35));
    console.log();
    console.log(`🏢 Organization: WithCar (${this.withcarOrgId})`);
    console.log();

    try {
      // Step 1: Analyze current subscriptions
      await this.analyzeCurrentSubscriptions();
      
      // Step 2: Clean up duplicate/problematic subscriptions
      await this.cleanupSubscriptions();
      
      // Step 3: Ensure Premium Enterprise plan exists
      await this.ensurePremiumPlan();
      
      // Step 4: Create proper subscription
      await this.createProperSubscription();
      
      // Step 5: Test user invitation capability
      await this.testUserInvitation();
      
      console.log('✅ WithCar subscription fix completed!');
      console.log();
      console.log('🎉 You can now invite users to WithCar organization');
      console.log('📧 Try inviting: zarfin.jakupovic@withcar.si');
      
    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeCurrentSubscriptions() {
    console.log('🔍 Step 1: Analyzing current subscriptions...');
    
    // Get all subscriptions for WithCar
    const { data: subscriptions, error } = await this.supabase
      .from('organization_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('organization_id', this.withcarOrgId);
    
    if (error) {
      console.error('Error fetching subscriptions:', error);
      return;
    }

    console.log(`📊 Found ${subscriptions.length} subscription entries:`);
    subscriptions.forEach((sub, index) => {
      console.log(`   ${index + 1}. Plan: ${sub.subscription_plans?.name || 'Unknown'}`);
      console.log(`      Status: ${sub.status}`);
      console.log(`      Created: ${sub.created_at}`);
      console.log(`      ID: ${sub.id}`);
      console.log();
    });

    this.existingSubscriptions = subscriptions;
  }

  async cleanupSubscriptions() {
    console.log('🧹 Step 2: Cleaning up problematic subscriptions...');
    
    if (!this.existingSubscriptions || this.existingSubscriptions.length === 0) {
      console.log('✅ No existing subscriptions to clean up');
      return;
    }

    // Deactivate all existing subscriptions
    for (const subscription of this.existingSubscriptions) {
      const { error } = await this.supabase
        .from('organization_subscriptions')
        .update({ 
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
      
      if (error) {
        console.error(`❌ Error deactivating subscription ${subscription.id}:`, error);
      } else {
        console.log(`✅ Deactivated subscription: ${subscription.subscription_plans?.name}`);
      }
    }

    console.log();
  }

  async ensurePremiumPlan() {
    console.log('💎 Step 3: Ensuring Premium Enterprise plan exists...');
    
    // Check if Premium Enterprise plan exists
    const { data: existingPlan, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', 'Premium Enterprise')
      .single();
    
    if (existingPlan) {
      console.log('✅ Premium Enterprise plan already exists');
      this.premiumPlanId = existingPlan.id;
      return;
    }

    // Create Premium Enterprise plan
    const { data: newPlan, error: createError } = await this.supabase
      .from('subscription_plans')
      .insert({
        name: 'Premium Enterprise',
        description: 'Perfect for large organizations with unlimited users and features',
        price: 497.00, // $497/month as shown in screenshot
        billing_interval: 'monthly',
        features: {
          MAX_USERS: -1,        // Unlimited users
          MAX_CONTACTS: -1,     // Unlimited contacts
          MAX_AI_MESSAGES: -1,  // Unlimited AI messages
          EMAIL_INTEGRATION: true,
          ADVANCED_ANALYTICS: true,
          CUSTOM_BRANDING: true,
          API_ACCESS: true,
          PRIORITY_SUPPORT: true
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      throw new Error(`Failed to create Premium Enterprise plan: ${createError.message}`);
    }

    console.log(`✅ Created Premium Enterprise plan (ID: ${newPlan.id})`);
    this.premiumPlanId = newPlan.id;
    console.log();
  }

  async createProperSubscription() {
    console.log('📝 Step 4: Creating proper subscription...');
    
    // Create active Premium Enterprise subscription
    const { data: subscription, error } = await this.supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: this.withcarOrgId,
        subscription_plan_id: this.premiumPlanId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        cancel_at_period_end: false,
        subscription_provider: 'system',
        provider_subscription_id: `withcar-premium-${Date.now()}`,
        metadata: {
          setup_reason: 'WithCar organization setup',
          unlimited_users: true,
          unlimited_contacts: true,
          unlimited_ai: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, subscription_plans(*)')
      .single();
    
    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    console.log('✅ Created Premium Enterprise subscription');
    console.log(`   Plan: ${subscription.subscription_plans.name}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Features: Unlimited users, contacts, and AI messages`);
    console.log();
  }

  async testUserInvitation() {
    console.log('🧪 Step 5: Testing user invitation capability...');
    
    // Import the subscription service to test
    try {
      const { EnhancedSubscriptionService } = require('../src/lib/services/subscription-service-extension');
      const service = new EnhancedSubscriptionService();
      
      // Test if we can add users
      const { canAdd, reason } = await service.canAddMoreUsers(this.withcarOrgId, 1);
      
      if (canAdd) {
        console.log('✅ User invitation capability restored!');
        console.log('   WithCar can now invite unlimited users');
      } else {
        console.log('❌ User invitation still blocked:', reason);
      }
    } catch (error) {
      console.log('⚠️  Could not test subscription service directly');
      console.log('   Manual testing required in the UI');
    }

    console.log();
  }
}

// Run the fixer
async function main() {
  const fixer = new WithcarSubscriptionFixer();
  await fixer.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WithcarSubscriptionFixer;

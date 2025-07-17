/**
 * Subscription Plans Initialization Script
 * 
 * This script initializes the subscription plans in the database based on the 
 * predefined 3-tier system (Starter, Pro, Premium).
 * 
 * Run this script after setting up the database schema or when updating plans.
 */

import { EnhancedSubscriptionService } from './services/subscription-service-extension';

/**
 * Initialize subscription plans in the database
 */
export async function initializeSubscriptionPlans(): Promise<void> {
  console.log('🚀 Starting subscription plans initialization...');
  
  try {
    const enhancedSubscriptionService = new EnhancedSubscriptionService();
    
    // Initialize the predefined plans
    await enhancedSubscriptionService.initializePredefinedPlans();
    
    console.log('✅ Subscription plans initialized successfully!');
    console.log('📊 Available plans:');
    console.log('   - Starter: Free (beta) - 1 user, 500 contacts, 100 AI messages');
    console.log('   - Pro: Free (beta) - 5 users, 5,000 contacts, 250 AI messages');
    console.log('   - Premium: $197/month - Unlimited users, contacts, and AI messages');
    
    // Verify plans were created
    const individualPlans = await enhancedSubscriptionService.getIndividualPlans();
    const organizationPlans = await enhancedSubscriptionService.getOrganizationPlans();
    
    console.log(`\n📈 Individual plans: ${individualPlans.length}`);
    individualPlans.forEach(plan => {
      console.log(`   - ${plan.name}: $${plan.price}/month`);
    });
    
    console.log(`\n🏢 Organization plans: ${organizationPlans.length}`);
    organizationPlans.forEach(plan => {
      console.log(`   - ${plan.name}: $${plan.price}/month`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing subscription plans:', error);
    throw error;
  }
}

/**
 * Run the initialization if this script is executed directly
 */
if (require.main === module) {
  initializeSubscriptionPlans()
    .then(() => {
      console.log('\n🎉 Subscription plans initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Subscription plans initialization failed:', error);
      process.exit(1);
    });
} 
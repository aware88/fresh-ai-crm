/**
 * Script to initialize subscription plans in the database
 * 
 * This script will create or update subscription plans in the database
 * based on the predefined plans in the subscription-plans.ts file.
 * 
 * Usage: npx ts-node scripts/initialize-subscription-plans.ts
 */

import { EnhancedSubscriptionService } from '../src/lib/services/subscription-service-extension';

async function main() {
  try {
    console.log('Initializing subscription plans...');
    
    const subscriptionService = new EnhancedSubscriptionService();
    await subscriptionService.initializePredefinedPlans();
    
    console.log('Subscription plans initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing subscription plans:', error);
    process.exit(1);
  }
}

main();

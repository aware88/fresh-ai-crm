/**
 * Test Script for New Subscription System
 * 
 * This script tests the new AI usage tracking and subscription limits
 */

import { createClient } from '@supabase/supabase-js';
import { aiUsageService } from '../src/lib/services/ai-usage-service';
import { featureFlagService } from '../src/lib/services/feature-flag-service';
import { checkAILimits } from '../src/lib/middleware/ai-limit-middleware';

// Test configuration
const TEST_ORG_ID = 'test-org-id';
const TEST_USER_ID = 'test-user-id';

async function runTests() {
  console.log('🚀 Starting Subscription System Tests\n');

  try {
    // Test 1: Check AI usage tracking
    console.log('📊 Test 1: AI Usage Tracking');
    const currentUsage = await aiUsageService.getCurrentUsage(TEST_ORG_ID);
    console.log('Current usage:', currentUsage);
    
    // Test 2: Check limit enforcement
    console.log('\n🚫 Test 2: Limit Enforcement');
    const limitCheck = await aiUsageService.checkLimitExceeded(TEST_ORG_ID);
    console.log('Limit check:', limitCheck);
    
    // Test 3: Feature flag checking
    console.log('\n🎛️ Test 3: Feature Flags');
    const psychProfilingAccess = await featureFlagService.canUsePsychologicalProfiling(TEST_ORG_ID);
    console.log('Psychological profiling access:', psychProfilingAccess);
    
    const crmAssistantAccess = await featureFlagService.canUseCRMAssistant(TEST_ORG_ID);
    console.log('CRM Assistant access:', crmAssistantAccess);
    
    // Test 4: AI limit middleware
    console.log('\n🛡️ Test 4: AI Limit Middleware');
    const emailResponseLimit = await checkAILimits(TEST_ORG_ID, TEST_USER_ID, 'email_response');
    console.log('Email response limit check:', emailResponseLimit);
    
    const profilingLimit = await checkAILimits(TEST_ORG_ID, TEST_USER_ID, 'profiling', 'PSYCHOLOGICAL_PROFILING');
    console.log('Profiling limit check:', profilingLimit);
    
    // Test 5: Usage logging
    console.log('\n📝 Test 5: Usage Logging');
    const usageId = await aiUsageService.logUsage({
      organizationId: TEST_ORG_ID,
      userId: TEST_USER_ID,
      messageType: 'email_response',
      tokensUsed: 150,
      costUsd: 0.003,
      featureUsed: 'AI_DRAFTING_ASSISTANCE',
      metadata: { test: true }
    });
    console.log('Logged usage with ID:', usageId);
    
    // Test 6: Get feature restrictions
    console.log('\n🔒 Test 6: Feature Restrictions');
    const restrictions = await featureFlagService.getFeatureRestrictions(TEST_ORG_ID);
    console.log('Feature restrictions:', restrictions);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to test different subscription tiers
async function testDifferentTiers() {
  console.log('\n🎯 Testing Different Subscription Tiers\n');
  
  const tiers = ['starter', 'pro', 'premium'];
  
  for (const tier of tiers) {
    console.log(`\n--- Testing ${tier.toUpperCase()} tier ---`);
    
    // Mock organization with different tier
    // In real implementation, this would query the database
    console.log(`Plan: ${tier}`);
    console.log(`Features available: Mocked for ${tier}`);
    console.log(`AI message limit: ${tier === 'starter' ? 50 : tier === 'pro' ? 500 : 'unlimited'}`);
  }
}

// Helper function to simulate usage scenarios
async function simulateUsageScenarios() {
  console.log('\n🎭 Simulating Usage Scenarios\n');
  
  const scenarios = [
    {
      name: 'Light User',
      dailyMessages: 2,
      features: ['email_response']
    },
    {
      name: 'Regular User',
      dailyMessages: 10,
      features: ['email_response', 'profiling']
    },
    {
      name: 'Heavy User',
      dailyMessages: 25,
      features: ['email_response', 'profiling', 'ai_future']
    }
  ];
  
  scenarios.forEach(scenario => {
    const monthlyMessages = scenario.dailyMessages * 30;
    console.log(`\n${scenario.name}:`);
    console.log(`  Monthly messages: ${monthlyMessages}`);
    console.log(`  Features used: ${scenario.features.join(', ')}`);
    console.log(`  Recommended plan: ${monthlyMessages <= 50 ? 'Starter' : monthlyMessages <= 500 ? 'Pro' : 'Premium'}`);
  });
}

// Run all tests
if (require.main === module) {
  runTests()
    .then(() => testDifferentTiers())
    .then(() => simulateUsageScenarios())
    .then(() => {
      console.log('\n🎉 All subscription system tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

export {
  runTests,
  testDifferentTiers,
  simulateUsageScenarios
};
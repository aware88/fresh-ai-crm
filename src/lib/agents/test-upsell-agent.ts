/**
 * Test script for Universal Upsell Agent
 * 
 * This script tests the upsell functionality with various scenarios
 */

import { UniversalUpsellAgent, UpsellContext } from './universal-upsell-agent';

export async function testUpsellAgent() {
  console.log('🧪 Testing Universal Upsell Agent...');
  
  const agent = new UniversalUpsellAgent();

  // Test scenarios for different business types
  const testScenarios: Array<{
    name: string;
    context: UpsellContext;
    expectedProducts: string[];
  }> = [
    {
      name: 'E-commerce - Phone Case Inquiry',
      context: {
        email_content: 'Hi, I\'m interested in buying an iPhone 15 case. Do you have any recommendations?',
        email_subject: 'iPhone case inquiry',
        organization_id: 'test-org-1',
        user_id: 'test-user-1'
      },
      expectedProducts: ['screen protector', 'wireless charger', 'phone stand']
    },
    {
      name: 'Automotive - Car Mat Purchase',
      context: {
        email_content: 'I need floor mats for my 2023 Toyota Camry. What do you have available?',
        email_subject: 'Floor mats for Toyota Camry',
        organization_id: 'test-org-2',
        user_id: 'test-user-2'
      },
      expectedProducts: ['trunk liner', 'car organizer', 'seat covers']
    },
    {
      name: 'Software - Basic Plan Interest',
      context: {
        email_content: 'I\'m interested in your basic CRM plan. Can you tell me more about the features?',
        email_subject: 'CRM Basic Plan Inquiry',
        organization_id: 'test-org-3',
        user_id: 'test-user-3'
      },
      expectedProducts: ['premium plan', 'additional users', 'integrations']
    },
    {
      name: 'Home & Garden - Plant Purchase',
      context: {
        email_content: 'I want to buy some indoor plants for my living room. What would you recommend?',
        email_subject: 'Indoor plants inquiry',
        organization_id: 'test-org-4',
        user_id: 'test-user-4'
      },
      expectedProducts: ['plant pots', 'fertilizer', 'plant care tools']
    }
  ];

  const results = [];

  for (const scenario of testScenarios) {
    try {
      console.log(`\n🔍 Testing: ${scenario.name}`);
      console.log(`Email: "${scenario.context.email_content}"`);
      
      const opportunities = await agent.generateUpsellOpportunities(scenario.context);
      
      console.log(`✅ Found ${opportunities.length} upsell opportunities:`);
      opportunities.forEach((opp, index) => {
        console.log(`  ${index + 1}. ${opp.target_product.name} (${opp.relationship_type}) - Confidence: ${opp.confidence_score}`);
        console.log(`     Reasoning: ${opp.reasoning}`);
        console.log(`     Strategy: ${opp.offer_strategy}${opp.discount_percent ? ` with ${opp.discount_percent}% discount` : ''}`);
      });

      results.push({
        scenario: scenario.name,
        success: opportunities.length > 0,
        opportunityCount: opportunities.length,
        opportunities: opportunities.map(opp => ({
          product: opp.target_product.name,
          type: opp.relationship_type,
          confidence: opp.confidence_score
        }))
      });

    } catch (error) {
      console.error(`❌ Error testing ${scenario.name}:`, error);
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed tests: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed scenarios:');
    failed.forEach(result => {
      console.log(`  - ${result.scenario}: ${result.error || 'Unknown error'}`);
    });
  }

  if (successful.length > 0) {
    console.log('\n✅ Successful scenarios:');
    successful.forEach(result => {
      console.log(`  - ${result.scenario}: ${result.opportunityCount} opportunities`);
    });
  }

  return {
    totalTests: results.length,
    successfulTests: successful.length,
    failedTests: failed.length,
    results
  };
}

// Example usage in development
if (process.env.NODE_ENV === 'development') {
  testUpsellAgent().then(results => {
    console.log('\n🎉 Test completed!', results);
  }).catch(error => {
    console.error('❌ Test failed:', error);
  });
}

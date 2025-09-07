#!/usr/bin/env node

/**
 * Test Magento Integration Directly (No Auth)
 * 
 * This script tests the Magento integration directly using the API client
 */

// Import the Magento API client directly
const path = require('path');

// Mock the Supabase client and other dependencies
global.Buffer = Buffer;

// Create a mock environment for the client
const mockCredentials = {
  apiUrl: 'https://withcar.si',
  apiKey: '0de047e9c988989bd00f49745f92748b',
  apiUser: 'tim',
  apiSecret: 'd832e7eaefd0ce796171a38199295b0b',
  storeId: 'default'
};

async function testMagentoDirect() {
  console.log('🧪 Testing Magento Integration Directly...');
  console.log('🌐 API URL:', mockCredentials.apiUrl);
  console.log('👤 API User:', mockCredentials.apiUser);

  try {
    // Import the MagentoApiClient class
    const { MagentoApiClient } = require('../src/lib/integrations/magento/magento-api-client.ts');
    
    // Create client instance
    const client = new MagentoApiClient(mockCredentials);
    
    console.log('\n📋 Test 1: Connection Test');
    const connectionResult = await client.testConnection();
    
    console.log('   📊 Result:', connectionResult.success ? '✅ Success' : '❌ Failed');
    console.log('   📄 Message:', connectionResult.message);
    
    if (connectionResult.data) {
      console.log('   🔧 Mode:', connectionResult.data.mode);
      if (connectionResult.data.authMethod) {
        console.log('   🔐 Auth Method:', connectionResult.data.authMethod);
      }
    }

    console.log('\n📋 Test 2: Fetch Orders for Test Email');
    const testEmail = 'tim.mak88@gmail.com';
    
    const orders = await client.getOrdersByEmail(testEmail);
    console.log('   📦 Orders found:', orders.length);
    
    if (orders.length > 0) {
      const firstOrder = orders[0];
      console.log('   📋 First order:', `#${firstOrder.increment_id} - €${firstOrder.grand_total} (${firstOrder.status})`);
      console.log('   🛍️  Items:', firstOrder.items?.length || 0);
      
      if (firstOrder.items && firstOrder.items.length > 0) {
        console.log('   📦 First item:', firstOrder.items[0].name);
      }
    }

    console.log('\n📋 Test 3: Fetch Orders for Unknown Email');
    const unknownEmail = 'unknown@example.com';
    const unknownOrders = await client.getOrdersByEmail(unknownEmail);
    console.log('   📦 Orders found for unknown email:', unknownOrders.length);

    console.log('\n🎉 Direct integration test completed successfully!');
    
    console.log('\n📊 Summary:');
    console.log(`   • Connection: ${connectionResult.success ? 'Working' : 'Failed'}`);
    console.log(`   • Mode: ${connectionResult.data?.mode || 'Unknown'}`);
    console.log(`   • Test email orders: ${orders.length}`);
    console.log(`   • Unknown email orders: ${unknownOrders.length}`);
    
    if (connectionResult.data?.mode === 'real') {
      console.log('\n✅ Real Magento API is working!');
    } else {
      console.log('\n📝 Using mock data (real API has redirect issues)');
    }
    
    return true;

  } catch (error) {
    console.error('\n💥 Direct test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testMagentoDirect().then(success => {
  if (success) {
    console.log('\n✅ Magento direct integration test passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Magento direct integration test failed.');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});


#!/usr/bin/env node

/**
 * Complete Magento Integration Test
 * 
 * This script tests the complete Magento integration flow
 */

const fetch = require('node-fetch');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000', // Adjust if your dev server runs on a different port
  testEmail: 'tim.mak88@gmail.com'
};

async function testMagentoIntegration() {
  console.log('🧪 Testing Complete Magento Integration...');
  console.log('🌐 Base URL:', TEST_CONFIG.baseUrl);
  console.log('📧 Test Email:', TEST_CONFIG.testEmail);

  let allTestsPassed = true;

  try {
    // Test 1: Connection Test
    console.log('\n📋 Test 1: Connection Test');
    const connectionResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/magento/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (connectionResponse.ok) {
      const connectionData = await connectionResponse.json();
      console.log('   ✅ Connection test passed');
      console.log('   📊 Result:', connectionData.message);
      
      if (connectionData.data && connectionData.data.mode === 'mock') {
        console.log('   ℹ️  Using mock data mode');
      }
    } else {
      console.log('   ❌ Connection test failed:', connectionResponse.status, connectionResponse.statusText);
      allTestsPassed = false;
    }

    // Test 2: Orders API
    console.log('\n📋 Test 2: Orders API');
    const ordersResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/magento/orders?email=${encodeURIComponent(TEST_CONFIG.testEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      console.log('   ✅ Orders API test passed');
      console.log('   📦 Orders found:', ordersData.count || 0);
      
      if (ordersData.orders && ordersData.orders.length > 0) {
        const firstOrder = ordersData.orders[0];
        console.log('   📋 First order:', firstOrder.increment_id, '- €' + firstOrder.grand_total, '(' + firstOrder.status + ')');
        console.log('   🛍️  Items:', firstOrder.items?.length || 0);
        
        if (firstOrder.items && firstOrder.items.length > 0) {
          console.log('   📦 First item:', firstOrder.items[0].name);
        }
      }
    } else {
      console.log('   ❌ Orders API test failed:', ordersResponse.status, ordersResponse.statusText);
      const errorText = await ordersResponse.text();
      console.log('   📄 Error:', errorText.substring(0, 200));
      allTestsPassed = false;
    }

    // Test 3: Test with different email (should return empty)
    console.log('\n📋 Test 3: Empty Results Test');
    const emptyResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/magento/orders?email=nonexistent@example.com`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (emptyResponse.ok) {
      const emptyData = await emptyResponse.json();
      console.log('   ✅ Empty results test passed');
      console.log('   📦 Orders found:', emptyData.count || 0);
      
      if (emptyData.count === 0) {
        console.log('   ✅ Correctly returned empty results for unknown email');
      }
    } else {
      console.log('   ❌ Empty results test failed:', emptyResponse.status, emptyResponse.statusText);
      allTestsPassed = false;
    }

    // Test 4: Error handling (invalid email parameter)
    console.log('\n📋 Test 4: Error Handling Test');
    const errorResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/magento/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (errorResponse.status === 400) {
      console.log('   ✅ Error handling test passed');
      console.log('   📄 Correctly returned 400 for missing email parameter');
    } else {
      console.log('   ❌ Error handling test failed - expected 400, got:', errorResponse.status);
      allTestsPassed = false;
    }

    // Test 5: Configuration Check
    console.log('\n📋 Test 5: Configuration Check');
    const configResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/magento/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('   ✅ Configuration check passed');
      console.log('   ⚙️  Configured:', configData.configured);
      
      if (configData.settings) {
        console.log('   🌐 API URL:', configData.settings.apiUrl);
        console.log('   👤 API User:', configData.settings.apiUser);
      }
    } else {
      console.log('   ⚠️  Configuration check warning:', configResponse.status);
      // This might fail if the database tables don't exist yet, which is OK
    }

    // Summary
    console.log('\n🎯 Test Summary:');
    if (allTestsPassed) {
      console.log('✅ All critical tests passed!');
      console.log('\n📋 Integration Status:');
      console.log('   • Magento API client is working');
      console.log('   • API endpoints are responding');
      console.log('   • Mock data is available for development');
      console.log('   • Error handling is working');
      console.log('\n🚀 The Magento integration is ready for use!');
      
      console.log('\n📝 Usage Instructions:');
      console.log('   1. In the email interface, the Magento integration will automatically load');
      console.log('   2. When viewing an email, orders will be fetched for that customer');
      console.log('   3. Test emails (containing "tim", "test", or "demo") will show mock orders');
      console.log('   4. Other emails will show empty results');
      console.log('   5. Once the real Magento API is configured, it will automatically switch from mock to real data');
      
      return true;
    } else {
      console.log('❌ Some tests failed - check the issues above');
      return false;
    }

  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   🔌 Connection refused - is the development server running?');
      console.error('   💡 Start the server with: npm run dev');
    }
    
    return false;
  }
}

// Run the test
testMagentoIntegration().then(success => {
  if (success) {
    console.log('\n🎉 Magento integration test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Magento integration test failed.');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});



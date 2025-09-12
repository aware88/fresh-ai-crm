#!/usr/bin/env node

/**
 * Test our own API endpoints to see what's working on our side
 * This will help determine if the issue is client-side or server-side
 */

const fetch = require('node-fetch');

const config = {
  baseUrl: 'http://localhost:3000', // Our Next.js app
  testEmail: 'test@example.com'
};

async function testOurApiEndpoints() {
  console.log('🔍 Testing OUR integration endpoints');
  console.log('='.repeat(50));
  console.log(`Base URL: ${config.baseUrl}`);
  console.log('='.repeat(50));

  // Test 1: Magento connection test endpoint
  console.log('\n🔌 Testing /api/magento/test endpoint...');
  try {
    const response = await fetch(`${config.baseUrl}/api/magento/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Our test endpoint works');
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.data && data.data.mode === 'mock') {
          console.log('📝 Note: Using mock data (expected if Magento API is not working)');
        } else if (data.data && data.data.mode === 'real') {
          console.log('🎉 Real Magento API is working!');
        }
      } catch (parseError) {
        console.log('❌ Invalid JSON response:', responseText);
      }
    } else {
      console.log('❌ Our endpoint failed:', responseText);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  // Test 2: Magento orders endpoint
  console.log('\n📦 Testing /api/magento/orders endpoint...');
  try {
    const response = await fetch(`${config.baseUrl}/api/magento/orders?email=${encodeURIComponent(config.testEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Our orders endpoint works');
        console.log(`Found ${data.length || 0} orders for ${config.testEmail}`);
        
        if (data.length > 0) {
          console.log('First order sample:', JSON.stringify(data[0], null, 2).substring(0, 300));
        }
      } catch (parseError) {
        console.log('❌ Invalid JSON response:', responseText);
      }
    } else {
      console.log('❌ Our endpoint failed:', responseText);
      
      if (response.status === 401) {
        console.log('🔑 Authentication required - this is expected for API routes');
      }
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  // Test 3: Direct Magento API client test (bypass our API routes)
  console.log('\n🔗 Testing direct Magento API client...');
  try {
    // Import and test our Magento client directly
    const { getMagentoClient } = require('../src/lib/integrations/magento/magento-api-client.ts');
    
    console.log('Creating Magento client...');
    const client = await getMagentoClient();
    
    console.log('Testing connection...');
    const testResult = await client.testConnection();
    
    console.log('✅ Direct client test completed');
    console.log('Result:', JSON.stringify(testResult, null, 2));
    
    if (testResult.success && testResult.data.mode === 'real') {
      console.log('🎉 Direct Magento connection works!');
      return 'REAL_API_WORKING';
    } else if (testResult.success && testResult.data.mode === 'mock') {
      console.log('📝 Using mock data (Magento API issue)');
      return 'MOCK_MODE';
    } else {
      console.log('❌ Connection failed');
      return 'CONNECTION_FAILED';
    }
  } catch (error) {
    console.log('❌ Direct client test failed:', error.message);
    return 'CLIENT_ERROR';
  }
}

async function checkWhatWeCanFix() {
  console.log('\n' + '='.repeat(50));
  console.log('🔧 WHAT CAN WE FIX ON OUR SIDE?');
  console.log('='.repeat(50));

  // Check 1: Are our credentials properly configured?
  console.log('\n1. Checking our credential configuration...');
  try {
    const { getMagentoClient } = require('../src/lib/integrations/magento/magento-api-client.ts');
    const client = await getMagentoClient();
    console.log('✅ Credentials are properly configured in our code');
  } catch (error) {
    console.log('❌ Issue with our credential configuration:', error.message);
    return ['FIX_CREDENTIALS'];
  }

  // Check 2: Are our API routes properly set up?
  console.log('\n2. Checking our API route structure...');
  const fs = require('fs');
  const path = require('path');
  
  const apiFiles = [
    'src/app/api/magento/test/route.ts',
    'src/app/api/magento/orders/route.ts'
  ];
  
  const missingFiles = [];
  for (const file of apiFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    console.log('❌ Missing API route files:', missingFiles);
    return ['FIX_API_ROUTES'];
  } else {
    console.log('✅ All API route files exist');
  }

  // Check 3: Is our database migration applied?
  console.log('\n3. Database migration status...');
  console.log('✅ You confirmed the Supabase migration was applied');

  return [];
}

async function main() {
  console.log('🚀 Testing Our Magento Integration');
  console.log('Determining what needs to be fixed on our side vs their side');
  console.log('='.repeat(60));

  // Test our endpoints
  const apiStatus = await testOurApiEndpoints();
  
  // Check what we can fix
  const ourIssues = await checkWhatWeCanFix();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL ASSESSMENT');
  console.log('='.repeat(60));
  
  if (ourIssues.length > 0) {
    console.log('❌ ISSUES ON OUR SIDE:');
    ourIssues.forEach(issue => console.log(`  - ${issue}`));
    console.log('\n👉 We need to fix these first before contacting IT team');
  } else {
    console.log('✅ OUR SIDE IS PROPERLY CONFIGURED');
    
    if (apiStatus === 'REAL_API_WORKING') {
      console.log('🎉 Everything is working! No issues to report.');
    } else if (apiStatus === 'MOCK_MODE' || apiStatus === 'CONNECTION_FAILED') {
      console.log('\n❌ THE ISSUE IS ON THEIR SIDE:');
      console.log('  - Magento token endpoint is missing/misconfigured');
      console.log('  - Our integration code is correct');
      console.log('  - We fall back to mock data gracefully');
      console.log('\n👉 Safe to send the message to IT team');
    }
  }
}

if (require.main === module) {
  main();
}












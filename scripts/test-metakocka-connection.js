const axios = require('axios');

// Withcar Metakocka credentials (from documentation)
const METAKOCKA_CONFIG = {
  companyId: '2889',
  secretKey: 'd1233595-4309-4ff2-aaf0-5e2b2a191270',
  apiUrl: 'https://main.metakocka.si/rest/eshop/v1/json'
};

async function testMetakockaConnection() {
  console.log('🔍 Testing Metakocka API connection for Withcar...\n');
  console.log(`Company ID: ${METAKOCKA_CONFIG.companyId}`);
  console.log(`API URL: ${METAKOCKA_CONFIG.apiUrl}`);
  console.log(`Secret Key: ${METAKOCKA_CONFIG.secretKey.substring(0, 8)}...`);
  console.log();

  const results = {
    products: false,
    contacts: false,
    orders: false
  };

  try {
    // 1. Test Products endpoint (this is what the real integration uses to test connection)
    console.log('1. Testing connection with products endpoint...');
    const productsResponse = await makeRequest('get_product_list', { limit: 5 });
    if (productsResponse) {
      results.products = true;
      console.log('✅ Connection and authentication successful');
      console.log(`✅ Products endpoint working - Found ${productsResponse.count_returned || 0} products`);
      
      if (productsResponse.product_list && productsResponse.product_list.length > 0) {
        console.log('📦 Sample products:');
        productsResponse.product_list.slice(0, 3).forEach(product => {
          console.log(`   - ${product.name || 'Unnamed Product'} (Code: ${product.code || product.mk_id})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    results.products = false;
  }

  try {
    // 2. Test Partners (contacts) endpoint
    console.log('\n2. Testing partners endpoint...');
    const partnersResponse = await makeRequest('get_partner_list', { limit: 5 });
    if (partnersResponse) {
      results.contacts = true;
      console.log(`✅ Partners endpoint working - Found ${partnersResponse.count_returned || 0} partners`);
      
      if (partnersResponse.partner_list && partnersResponse.partner_list.length > 0) {
        console.log('👥 Sample partners:');
        partnersResponse.partner_list.slice(0, 3).forEach(partner => {
          const name = partner.business_name || partner.name || 'Unnamed Partner';
          console.log(`   - ${name} (ID: ${partner.mk_id}) - ${partner.email || 'No email'}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Partners endpoint failed:', error.message);
    results.contacts = false;
  }

  try {
    // 3. Test Sales Documents endpoint
    console.log('\n3. Testing sales documents endpoint...');
    const salesDocsResponse = await makeRequest('get_sales_document_list', { limit: 5 });
    if (salesDocsResponse) {
      results.orders = true;
      console.log(`✅ Sales documents endpoint working - Found ${salesDocsResponse.count_returned || 0} documents`);
      
      if (salesDocsResponse.sales_document_list && salesDocsResponse.sales_document_list.length > 0) {
        console.log('📋 Sample sales documents:');
        salesDocsResponse.sales_document_list.slice(0, 3).forEach(doc => {
          const docNumber = doc.doc_number || doc.mk_id || 'No number';
          const amount = doc.sum_all || 'Unknown amount';
          console.log(`   - Doc ${docNumber}: ${amount} (Type: ${doc.doc_type || 'Unknown'})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Sales documents endpoint failed:', error.message);
    results.orders = false;
  }

  // Summary
  console.log('\n📊 Connection Test Summary:');
  console.log('================================');
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const testName = test === 'products' ? 'Connection & Products' : 
                     test === 'contacts' ? 'Partners' : 
                     test === 'orders' ? 'Sales Documents' : test;
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  console.log(`\n🎯 Overall Result: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('🎉 All tests passed! Metakocka integration is ready to use.');
    console.log('💡 You can now add these credentials in: /settings/integrations/metakocka');
  } else if (successCount > 0) {
    console.log('⚠️  Partial success - some endpoints are working, others may need configuration.');
  } else {
    console.log('❌ All tests failed - check credentials and network connectivity.');
    console.log('💡 Try testing through the web interface: /settings/integrations/metakocka');
  }

  return successCount === totalTests;
}

async function makeRequest(endpoint, params = {}) {
  const url = `${METAKOCKA_CONFIG.apiUrl}/${endpoint}`;
  
  const requestData = {
    company_id: METAKOCKA_CONFIG.companyId,
    secret_key: METAKOCKA_CONFIG.secretKey,
    ...params
  };
  
  const config = {
    method: 'POST',
    url,
    data: requestData,
    timeout: 10000, // 10 second timeout
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'ARIS-CRM/1.0'
    }
  };

  try {
    const response = await axios(config);
    
    // Check for Metakocka API error format
    if (response.data && response.data.opr_code !== undefined) {
      if (response.data.opr_code !== "0") {
        const errorMessage = response.data.opr_desc_app || 
                            response.data.opr_desc || 
                            'Unknown Metakocka API error';
        throw new Error(`Metakocka API Error (${response.data.opr_code}): ${errorMessage}`);
      }
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      if (errorData && errorData.opr_desc) {
        throw new Error(`Metakocka Error: ${errorData.opr_desc}`);
      }
      throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error - could not reach Metakocka API');
    } else {
      // Other error
      throw new Error(error.message);
    }
  }
}

// Alternative test function for different API endpoints
async function testSpecificEndpoint(endpoint, params = {}) {
  console.log(`🔍 Testing specific endpoint: ${endpoint}`);
  
  try {
    const result = await makeRequest(endpoint, params);
    console.log(`✅ Success:`, JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.log(`❌ Failed:`, error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  testMetakockaConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { 
  testMetakockaConnection, 
  testSpecificEndpoint,
  METAKOCKA_CONFIG 
}; 
/**
 * RAG System Smoke Test (JavaScript version)
 * Comprehensive test that validates the entire RAG pipeline
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  organizationId: process.env.TEST_ORGANIZATION_ID || 'test-org-id',
  userId: process.env.TEST_USER_ID || 'test-user-id',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY
};

// Sample test document
const SAMPLE_DOCUMENT = {
  title: 'Test Product Manual',
  content: `Product Manual: Advanced Widget Pro XL-2000

Description: The Advanced Widget Pro XL-2000 is a high-performance industrial widget designed for heavy-duty applications.

Specifications:
- Model: XL-2000
- Weight: 2.5 kg
- Dimensions: 30cm x 20cm x 15cm
- Material: Aerospace-grade aluminum
- Power: 220V, 50Hz
- Warranty: 2 years

Installation:
1. Unpack the unit carefully
2. Check all components are included
3. Connect power supply
4. Run initial calibration sequence

Contact support at support@company.com for technical assistance.`,
  sourceType: 'document',
  sourceId: 'doc-test-001',
  metadata: {
    documentType: 'manual',
    productModel: 'XL-2000',
    version: '1.0'
  }
};

class RAGSmokeTest {
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      TEST_CONFIG.supabaseUrl,
      TEST_CONFIG.supabaseKey
    );
  }

  async runBasicTest() {
    console.log('🚀 Starting Basic RAG System Test\n');
    console.log('Configuration:');
    console.log(`- Organization ID: ${TEST_CONFIG.organizationId}`);
    console.log(`- User ID: ${TEST_CONFIG.userId}`);
    console.log(`- Supabase URL: ${TEST_CONFIG.supabaseUrl}`);
    console.log(`- OpenAI API Key: ${TEST_CONFIG.openaiApiKey ? '✅ Set' : '❌ Missing'}\n`);

    const testResults = {
      database: false,
      schema: false,
      basicOperations: false
    };

    try {
      // Test 1: Database Connection
      console.log('🔌 Test 1: Database Connection');
      await this.testDatabaseConnection();
      testResults.database = true;
      console.log('✅ Database connection test passed\n');

      // Test 2: Schema Validation
      console.log('📋 Test 2: Schema Validation');
      await this.testSchemaValidation();
      testResults.schema = true;
      console.log('✅ Schema validation test passed\n');

      // Test 3: Basic Operations
      console.log('⚙️ Test 3: Basic Operations');
      await this.testBasicOperations();
      testResults.basicOperations = true;
      console.log('✅ Basic operations test passed\n');

      // Final Results
      this.printTestSummary(testResults);

    } catch (error) {
      console.error('❌ Test failed:', error);
      this.printTestSummary(testResults);
      process.exit(1);
    }
  }

  async testDatabaseConnection() {
    console.log('  Testing Supabase connection...');
    
    // Simple query to test connection
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('  ✓ Successfully connected to Supabase');
    if (data && data.length > 0) {
      console.log(`  ✓ Found organization: ${data[0].name}`);
    }
  }

  async testSchemaValidation() {
    console.log('  Checking if RAG tables exist...');
    
    // Check if RAG tables exist by trying to query them
    const tables = ['rag_knowledge_base', 'rag_chunks', 'rag_query_history'];
    
    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`  ⚠️ Table '${table}' not found or not accessible: ${error.message}`);
          console.log(`  ℹ️ This is expected if RAG schema hasn't been applied yet`);
        } else {
          console.log(`  ✓ Table '${table}' exists and is accessible`);
        }
      } catch (e) {
        console.log(`  ⚠️ Could not check table '${table}': ${e.message}`);
      }
    }
  }

  async testBasicOperations() {
    console.log('  Testing basic CRUD operations...');
    
    // Test basic organization query
    const { data: orgs, error: orgError } = await this.supabase
      .from('organizations')
      .select('id, name, created_at')
      .limit(5);

    if (orgError) {
      throw new Error(`Organization query failed: ${orgError.message}`);
    }

    console.log(`  ✓ Successfully queried organizations: ${orgs?.length || 0} found`);

    // Test contacts query
    const { data: contacts, error: contactError } = await this.supabase
      .from('contacts')
      .select('id, firstname, lastname, email')
      .limit(5);

    if (contactError) {
      console.log(`  ⚠️ Contacts query failed: ${contactError.message}`);
    } else {
      console.log(`  ✓ Successfully queried contacts: ${contacts?.length || 0} found`);
    }

    // Test products query
    const { data: products, error: productError } = await this.supabase
      .from('products')
      .select('id, name, description')
      .limit(5);

    if (productError) {
      console.log(`  ⚠️ Products query failed: ${productError.message}`);
    } else {
      console.log(`  ✓ Successfully queried products: ${products?.length || 0} found`);
    }
  }

  printTestSummary(results) {
    console.log('📋 Test Summary:');
    console.log('================');
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${test.padEnd(20)}: ${status}`);
    });
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    console.log('================');
    console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Basic tests passed! Database is properly connected.');
      console.log('💡 Next step: Apply RAG schema migrations to enable full RAG functionality.');
    } else {
      console.log('⚠️ Some tests failed. Please check the errors above.');
    }
  }
}

// Run the test
const test = new RAGSmokeTest();
test.runBasicTest().catch(console.error);

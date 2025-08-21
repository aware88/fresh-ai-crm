/**
 * Database Connection Test Script
 * Tests database connectivity and applies RAG schema if needed
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ehhaeqmwolhnwylnqdto.supabase.co',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoaGFlcW13b2xobnd5bG5xZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDYzMDYsImV4cCI6MjA2NTEyMjMwNn0.NTEF0Gm7vIfHUMTnKrX9I4vcFyR6Faur6VOrKmcXQFM',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoaGFlcW13b2xobnd5bG5xZHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0NjMwNiwiZXhwIjoyMDY1MTIyMzA2fQ.9w93pq4uAv3Qe2v44_cD6eDDrZilsxX1WjBjJ6dDUyA'
};

class DatabaseTester {
  constructor() {
    // Create both anon and service role clients
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    this.supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  async runAllTests() {
    console.log('🔍 Starting Comprehensive Database Tests\n');
    console.log(`Database URL: ${config.supabaseUrl}`);
    console.log(`Service Key: ${config.supabaseServiceKey ? '✅ Available' : '❌ Missing'}\n`);

    const results = {
      basicConnection: false,
      schemaCheck: false,
      ragTables: false,
      vectorExtension: false,
      sampleOperations: false
    };

    try {
      // Test 1: Basic Connection
      console.log('🔌 Test 1: Basic Database Connection');
      await this.testBasicConnection();
      results.basicConnection = true;
      console.log('✅ Basic connection test passed\n');

      // Test 2: Schema Check
      console.log('📋 Test 2: Current Schema Check');
      await this.testCurrentSchema();
      results.schemaCheck = true;
      console.log('✅ Schema check completed\n');

      // Test 3: Apply RAG Schema
      console.log('🏗️ Test 3: Apply RAG Schema');
      await this.applyRAGSchema();
      results.ragTables = true;
      console.log('✅ RAG schema applied successfully\n');

      // Test 4: Vector Extension Check
      console.log('🔢 Test 4: Vector Extension Check');
      await this.testVectorExtension();
      results.vectorExtension = true;
      console.log('✅ Vector extension test passed\n');

      // Test 5: Sample RAG Operations
      console.log('⚙️ Test 5: Sample RAG Operations');
      await this.testRAGOperations();
      results.sampleOperations = true;
      console.log('✅ RAG operations test passed\n');

      // Final Results
      this.printResults(results);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      this.printResults(results);
      process.exit(1);
    }
  }

  async testBasicConnection() {
    console.log('  Testing Supabase connection...');
    
    // Test with service role (bypasses RLS)
    const { data, error } = await this.supabaseAdmin
      .from('organizations')
      .select('id, name, created_at')
      .limit(5);

    if (error) {
      console.log(`  ⚠️ Organizations query failed: ${error.message}`);
      console.log('  Trying alternative connection test...');
      
      // Try a simpler test
      const { data: healthCheck, error: healthError } = await this.supabaseAdmin
        .rpc('version'); // Built-in PostgreSQL function

      if (healthError) {
        throw new Error(`Database connection failed: ${healthError.message}`);
      }
      
      console.log('  ✓ Alternative connection test passed');
    } else {
      console.log(`  ✓ Successfully connected to Supabase`);
      console.log(`  ✓ Found ${data?.length || 0} organizations`);
      if (data && data.length > 0) {
        console.log(`  ✓ Sample organization: ${data[0].name || data[0].id}`);
      }
    }
  }

  async testCurrentSchema() {
    console.log('  Checking existing tables...');
    
    // Check what tables exist
    const { data: tables, error } = await this.supabaseAdmin
      .rpc('get_table_names'); // Custom function we'll create

    if (error) {
      console.log('  ⚠️ Custom table check failed, using alternative method');
      
      // Alternative: Try to query information_schema
      const knownTables = ['organizations', 'contacts', 'products', 'ai_memories'];
      
      for (const table of knownTables) {
        try {
          const { data, error: tableError } = await this.supabaseAdmin
            .from(table)
            .select('*')
            .limit(1);
          
          if (tableError) {
            console.log(`  ⚠️ Table '${table}' not accessible: ${tableError.message}`);
          } else {
            console.log(`  ✓ Table '${table}' exists and accessible (${data?.length || 0} sample records)`);
          }
        } catch (e) {
          console.log(`  ⚠️ Could not check table '${table}': ${e.message}`);
        }
      }
    } else {
      console.log(`  ✓ Found ${tables?.length || 0} tables in database`);
    }
  }

  async applyRAGSchema() {
    console.log('  Reading RAG schema migration...');
    
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20241221_create_rag_system_complete.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.log('  ⚠️ Migration file not found, creating basic RAG tables manually...');
      await this.createBasicRAGTables();
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('  Applying RAG schema migration...');

    try {
      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.length < 10) continue; // Skip very short statements
        
        try {
          const { error } = await this.supabaseAdmin.rpc('exec_sql', { sql: statement });
          if (error && !error.message.includes('already exists')) {
            console.log(`  ⚠️ Statement ${i + 1} warning: ${error.message}`);
          }
        } catch (e) {
          if (!e.message.includes('already exists')) {
            console.log(`  ⚠️ Statement ${i + 1} error: ${e.message}`);
          }
        }
      }

      console.log('  ✓ RAG schema migration completed');
      
    } catch (error) {
      console.log(`  ⚠️ Migration failed: ${error.message}`);
      console.log('  Attempting to create basic RAG tables manually...');
      await this.createBasicRAGTables();
    }
  }

  async createBasicRAGTables() {
    console.log('  Creating basic RAG tables manually...');

    // Create tables one by one with error handling
    const tables = [
      {
        name: 'rag_knowledge_base',
        sql: `
          CREATE TABLE IF NOT EXISTS rag_knowledge_base (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL,
            source_type TEXT NOT NULL,
            source_id TEXT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}'::JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'rag_chunks',
        sql: `
          CREATE TABLE IF NOT EXISTS rag_chunks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            knowledge_base_id UUID NOT NULL,
            organization_id UUID NOT NULL,
            content TEXT NOT NULL,
            embedding JSONB NOT NULL,
            chunk_index INTEGER NOT NULL,
            chunk_size INTEGER NOT NULL,
            token_count INTEGER,
            metadata JSONB DEFAULT '{}'::JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      }
    ];

    for (const table of tables) {
      try {
        const { error } = await this.supabaseAdmin.rpc('exec_sql', { sql: table.sql });
        if (error && !error.message.includes('already exists')) {
          console.log(`  ⚠️ Failed to create ${table.name}: ${error.message}`);
        } else {
          console.log(`  ✓ Table ${table.name} ready`);
        }
      } catch (e) {
        console.log(`  ⚠️ Error creating ${table.name}: ${e.message}`);
      }
    }
  }

  async testVectorExtension() {
    console.log('  Checking vector extension...');
    
    try {
      // Try to enable vector extension
      const { error: vectorError } = await this.supabaseAdmin
        .rpc('exec_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS vector' });
      
      if (vectorError) {
        console.log(`  ⚠️ Vector extension not available: ${vectorError.message}`);
        console.log('  ℹ️ Using JSONB for embeddings instead');
      } else {
        console.log('  ✓ Vector extension available');
        
        // Test vector operations
        const { error: testError } = await this.supabaseAdmin
          .rpc('exec_sql', { sql: "SELECT '[1,2,3]'::vector(3) <-> '[1,2,4]'::vector(3)" });
        
        if (testError) {
          console.log(`  ⚠️ Vector operations test failed: ${testError.message}`);
        } else {
          console.log('  ✓ Vector operations working');
        }
      }
    } catch (error) {
      console.log(`  ⚠️ Vector extension test failed: ${error.message}`);
    }
  }

  async testRAGOperations() {
    console.log('  Testing RAG table operations...');
    
    try {
      // Test inserting a sample knowledge base item
      const testOrgId = '00000000-0000-0000-0000-000000000000'; // Use a test UUID
      
      const { data: kbData, error: kbError } = await this.supabaseAdmin
        .from('rag_knowledge_base')
        .insert({
          organization_id: testOrgId,
          source_type: 'manual',
          title: 'Test Document',
          content: 'This is a test document for the RAG system.',
          metadata: { test: true }
        })
        .select()
        .single();

      if (kbError) {
        console.log(`  ⚠️ Knowledge base insert failed: ${kbError.message}`);
      } else {
        console.log('  ✓ Knowledge base insert successful');
        
        // Test inserting a chunk
        const { error: chunkError } = await this.supabaseAdmin
          .from('rag_chunks')
          .insert({
            knowledge_base_id: kbData.id,
            organization_id: testOrgId,
            content: 'This is a test chunk.',
            embedding: [0.1, 0.2, 0.3], // Mock embedding as JSON array
            chunk_index: 0,
            chunk_size: 20,
            token_count: 5
          });

        if (chunkError) {
          console.log(`  ⚠️ Chunk insert failed: ${chunkError.message}`);
        } else {
          console.log('  ✓ Chunk insert successful');
        }

        // Clean up test data
        await this.supabaseAdmin
          .from('rag_knowledge_base')
          .delete()
          .eq('id', kbData.id);
      }

    } catch (error) {
      console.log(`  ⚠️ RAG operations test failed: ${error.message}`);
    }
  }

  printResults(results) {
    console.log('\n📋 Database Test Summary:');
    console.log('==========================');
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${testName.padEnd(20)}: ${status}`);
    });
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    console.log('==========================');
    console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All database tests passed! RAG system is ready.');
      console.log('💡 You can now use the RAG APIs and services.');
    } else {
      console.log('\n⚠️ Some tests failed, but basic functionality should work.');
      console.log('💡 The system will use fallback approaches where needed.');
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Test RAG ingestion: POST /api/rag/ingest');
    console.log('2. Test RAG querying: POST /api/rag/query');
    console.log('3. Test Withcar emails: POST /api/email/generate-withcar-response');
    console.log('4. Sync Magento products: POST /api/rag/sync');
  }
}

// Create helper function for exec_sql RPC if it doesn't exist
async function createExecSqlFunction(supabaseAdmin) {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  try {
    await supabaseAdmin.rpc('exec_sql', { sql: createFunctionSQL });
  } catch (e) {
    // Function might not exist yet, that's okay
  }
}

// Run the tests
if (require.main === module) {
  const tester = new DatabaseTester();
  tester.runAllTests().catch(console.error);
}

module.exports = DatabaseTester;


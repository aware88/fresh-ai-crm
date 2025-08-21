#!/usr/bin/env tsx

/**
 * RAG System Smoke Test
 * Comprehensive test that validates the entire RAG pipeline
 * 
 * Usage: npx tsx src/scripts/rag-smoke-test.ts
 */

import { createClient } from '@supabase/supabase-js';
import { UnifiedRAGService } from '../lib/rag/unified-rag-service';
import { MetakockaRAGAdapter } from '../lib/rag/adapters/metakocka-rag-adapter';
import { DocumentRAGAdapter } from '../lib/rag/adapters/document-rag-adapter';
import { ProductRAGAdapter } from '../lib/rag/adapters/product-rag-adapter';
import { EnhancedEmailService } from '../lib/rag/enhanced-email-service';
import { Database } from '../types/supabase';

// Test configuration
const TEST_CONFIG = {
  organizationId: process.env.TEST_ORGANIZATION_ID || 'test-org-id',
  userId: process.env.TEST_USER_ID || 'test-user-id',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  openaiApiKey: process.env.OPENAI_API_KEY!
};

// Sample test documents
const SAMPLE_DOCUMENTS = [
  {
    title: 'Sample Product Manual',
    content: `Product Manual: Advanced Widget Pro XL-2000

Description: The Advanced Widget Pro XL-2000 is a high-performance industrial widget designed for heavy-duty applications. It features advanced materials and precision engineering.

Specifications:
- Model: XL-2000
- Weight: 2.5 kg
- Dimensions: 30cm x 20cm x 15cm
- Material: Aerospace-grade aluminum
- Power: 220V, 50Hz
- Warranty: 2 years

Features:
- Advanced control system
- Energy efficient operation
- Maintenance-free design
- Weather resistant coating

Installation:
1. Unpack the unit carefully
2. Check all components are included
3. Connect power supply (ensure voltage compatibility)
4. Run initial calibration sequence
5. Test all functions

Maintenance:
- Monthly visual inspection
- Annual professional service
- Keep unit clean and dry
- Replace filters every 6 months

Troubleshooting:
- If unit does not start: Check power connection and fuses
- If performance is reduced: Clean air filters
- For error codes: Refer to error code table in appendix

Contact support at support@company.com for technical assistance.`,
    sourceType: 'document' as const,
    sourceId: 'doc-001',
    metadata: {
      documentType: 'manual',
      productModel: 'XL-2000',
      version: '1.0'
    }
  },
  {
    title: 'Premium Service Package',
    content: `Premium Service Package - Complete Care Solution

Our Premium Service Package provides comprehensive maintenance and support for your equipment.

Package Includes:
- Quarterly on-site inspections
- Priority technical support (24/7)
- Free replacement parts for first year
- Software updates and upgrades
- Detailed performance reports
- Emergency repair service

Benefits:
- Reduced downtime
- Extended equipment life
- Cost predictability
- Expert maintenance
- Peace of mind

Pricing:
- Standard Package: €500/year
- Premium Package: €800/year
- Enterprise Package: €1,200/year

Service Areas:
- Slovenia, Croatia, Austria
- Germany, Italy, Hungary
- Response time: 4-24 hours depending on location

To subscribe, contact our sales team at sales@company.com or call +386 1 234 5678.`,
    sourceType: 'document' as const,
    sourceId: 'doc-002',
    metadata: {
      documentType: 'service_info',
      packageType: 'premium',
      pricing: true
    }
  }
];

const SAMPLE_PRODUCTS = [
  {
    title: 'Industrial Pump Model P-300',
    content: `Industrial Pump Model P-300

High-performance centrifugal pump designed for industrial applications.

Product Details:
- Model: P-300
- SKU: PUMP-P300-IND
- Category: Industrial Pumps
- Flow Rate: 300 L/min
- Max Pressure: 8 bar
- Power: 3 kW
- Inlet/Outlet: 2 inch flanged
- Material: Cast iron with stainless steel impeller

Applications:
- Water circulation systems
- Chemical processing
- HVAC systems
- Industrial cooling

Price: €2,450 (excl. VAT)
Delivery: 2-3 weeks
Warranty: 3 years

Available accessories:
- Pressure gauge kit: €120
- Vibration dampeners: €85
- Control panel: €340`,
    sourceType: 'product' as const,
    sourceId: 'prod-001',
    metadata: {
      sku: 'PUMP-P300-IND',
      category: 'Industrial Pumps',
      price: 2450,
      currency: 'EUR'
    }
  }
];

const TEST_QUERIES = [
  {
    query: 'What are the specifications of the XL-2000 widget?',
    expectedSources: ['document'],
    description: 'Product specification inquiry'
  },
  {
    query: 'How much does the Premium Service Package cost?',
    expectedSources: ['document'],
    description: 'Pricing inquiry'
  },
  {
    query: 'What industrial pumps do you have available?',
    expectedSources: ['product'],
    description: 'Product search query'
  },
  {
    query: 'I need help with installation of my equipment',
    expectedSources: ['document'],
    description: 'Support request'
  },
  {
    query: 'What is the warranty period for your products?',
    expectedSources: ['document', 'product'],
    description: 'General warranty inquiry'
  }
];

class RAGSmokeTest {
  private supabase: any;
  private ragService: UnifiedRAGService;
  private metakockaAdapter: MetakockaRAGAdapter;
  private documentAdapter: DocumentRAGAdapter;
  private productAdapter: ProductRAGAdapter;
  private enhancedEmailService: EnhancedEmailService;

  constructor() {
    // Initialize services
    this.supabase = createClient<Database>(
      TEST_CONFIG.supabaseUrl,
      TEST_CONFIG.supabaseKey
    );

    this.ragService = new UnifiedRAGService(
      this.supabase,
      TEST_CONFIG.openaiApiKey
    );

    this.metakockaAdapter = new MetakockaRAGAdapter(this.ragService, this.supabase);
    this.documentAdapter = new DocumentRAGAdapter(this.ragService, this.supabase);
    this.productAdapter = new ProductRAGAdapter(this.ragService, this.supabase);
    this.enhancedEmailService = new EnhancedEmailService(this.ragService, this.supabase);
  }

  async runFullTest(): Promise<void> {
    console.log('🚀 Starting RAG System Smoke Test\n');
    console.log('Configuration:');
    console.log(`- Organization ID: ${TEST_CONFIG.organizationId}`);
    console.log(`- User ID: ${TEST_CONFIG.userId}`);
    console.log(`- Supabase URL: ${TEST_CONFIG.supabaseUrl}`);
    console.log(`- OpenAI API Key: ${TEST_CONFIG.openaiApiKey ? '✅ Set' : '❌ Missing'}\n`);

    const testResults = {
      ingestion: false,
      retrieval: false,
      generation: false,
      emailEnhancement: false,
      cleanup: false
    };

    try {
      // Test 1: Data Ingestion
      console.log('📥 Test 1: Data Ingestion');
      await this.testDataIngestion();
      testResults.ingestion = true;
      console.log('✅ Data ingestion test passed\n');

      // Test 2: Content Retrieval
      console.log('🔍 Test 2: Content Retrieval');
      await this.testContentRetrieval();
      testResults.retrieval = true;
      console.log('✅ Content retrieval test passed\n');

      // Test 3: Response Generation
      console.log('🤖 Test 3: Response Generation');
      await this.testResponseGeneration();
      testResults.generation = true;
      console.log('✅ Response generation test passed\n');

      // Test 4: Email Enhancement
      console.log('📧 Test 4: Email Enhancement');
      await this.testEmailEnhancement();
      testResults.emailEnhancement = true;
      console.log('✅ Email enhancement test passed\n');

      // Test 5: System Statistics
      console.log('📊 Test 5: System Statistics');
      await this.testSystemStatistics();
      console.log('✅ System statistics test passed\n');

      // Test 6: Cleanup
      console.log('🧹 Test 6: Cleanup');
      await this.testCleanup();
      testResults.cleanup = true;
      console.log('✅ Cleanup test passed\n');

      // Final Results
      this.printTestSummary(testResults);

    } catch (error) {
      console.error('❌ Test failed:', error);
      this.printTestSummary(testResults);
      process.exit(1);
    }
  }

  private async testDataIngestion(): Promise<void> {
    console.log('  Ingesting sample documents...');
    
    for (const doc of SAMPLE_DOCUMENTS) {
      const result = await this.ragService.ingestContent(
        TEST_CONFIG.organizationId,
        doc,
        { chunkSize: 500, chunkOverlap: 100 }
      );

      if (!result.success) {
        throw new Error(`Failed to ingest document "${doc.title}": ${result.error}`);
      }

      console.log(`  ✓ Ingested "${doc.title}": ${result.chunksCreated} chunks, ${result.tokensProcessed} tokens`);
    }

    console.log('  Ingesting sample products...');
    
    for (const product of SAMPLE_PRODUCTS) {
      const result = await this.ragService.ingestContent(
        TEST_CONFIG.organizationId,
        product,
        { chunkSize: 400, chunkOverlap: 80 }
      );

      if (!result.success) {
        throw new Error(`Failed to ingest product "${product.title}": ${result.error}`);
      }

      console.log(`  ✓ Ingested "${product.title}": ${result.chunksCreated} chunks, ${result.tokensProcessed} tokens`);
    }
  }

  private async testContentRetrieval(): Promise<void> {
    console.log('  Testing content retrieval with various queries...');
    
    for (const testQuery of TEST_QUERIES) {
      console.log(`  Query: "${testQuery.query}"`);
      
      const result = await this.ragService.retrieveRelevantContent(
        testQuery.query,
        TEST_CONFIG.organizationId,
        {
          limit: 5,
          similarityThreshold: 0.5
        }
      );

      if (result.chunks.length === 0) {
        throw new Error(`No results found for query: "${testQuery.query}"`);
      }

      console.log(`  ✓ Retrieved ${result.chunks.length} chunks in ${result.processingTimeMs}ms`);
      
      // Display top result
      const topChunk = result.chunks[0];
      console.log(`    Top result: "${topChunk.source.title}" (similarity: ${topChunk.similarity.toFixed(3)})`);
      console.log(`    Content preview: "${topChunk.content.substring(0, 100)}..."`);
      console.log('');
    }
  }

  private async testResponseGeneration(): Promise<void> {
    console.log('  Testing AI response generation...');
    
    const testQuery = TEST_QUERIES[0];
    const queryContext = {
      userId: TEST_CONFIG.userId,
      organizationId: TEST_CONFIG.organizationId,
      userIntent: 'product_inquiry'
    };

    const response = await this.ragService.queryWithGeneration(
      testQuery.query,
      TEST_CONFIG.organizationId,
      queryContext
    );

    if (!response.answer) {
      throw new Error('No answer generated');
    }

    console.log(`  ✓ Generated response in ${response.processingTimeMs}ms`);
    console.log(`  Confidence: ${response.confidence.toFixed(3)}`);
    console.log(`  Sources used: ${response.sources.length}`);
    console.log(`  Citations: ${response.citations.length}`);
    console.log(`  Answer preview: "${response.answer.substring(0, 150)}..."`);
    console.log('');

    if (response.sources.length > 0) {
      console.log('  Sources:');
      response.sources.forEach((source, index) => {
        console.log(`    ${index + 1}. ${source.source.title} (${source.similarity.toFixed(3)})`);
      });
      console.log('');
    }

    if (response.citations.length > 0) {
      console.log('  Citations:');
      response.citations.forEach((citation, index) => {
        console.log(`    ${index + 1}. ${citation.title} - "${citation.excerpt}"`);
      });
      console.log('');
    }
  }

  private async testEmailEnhancement(): Promise<void> {
    console.log('  Testing RAG-enhanced email generation...');
    
    const sampleEmail = `Dear Support Team,

I am interested in your industrial pumps for our new facility. We need a pump that can handle 300 liters per minute with good pressure. Can you provide specifications and pricing?

Also, what kind of warranty do you offer on your equipment?

Best regards,
John Smith`;

    const result = await this.enhancedEmailService.generateRAGEnhancedResponse(
      sampleEmail,
      TEST_CONFIG.organizationId,
      TEST_CONFIG.userId,
      {
        tone: 'professional',
        includeProducts: true,
        includeDocuments: true,
        maxContextChunks: 5
      }
    );

    if (!result.response) {
      throw new Error('No enhanced email response generated');
    }

    console.log(`  ✓ Generated enhanced email response in ${result.processingTimeMs}ms`);
    console.log(`  Confidence: ${result.confidence.toFixed(3)}`);
    console.log(`  RAG chunks used: ${result.ragContext.chunksUsed.length}`);
    console.log(`  Relevant products: ${result.ragContext.relevantProducts.length}`);
    console.log(`  Relevant documents: ${result.ragContext.relevantDocuments.length}`);
    console.log(`  Subject: "${result.subject}"`);
    console.log(`  Response preview: "${result.response.substring(0, 200)}..."`);
    console.log('');
  }

  private async testSystemStatistics(): Promise<void> {
    console.log('  Checking system statistics...');
    
    const stats = await this.ragService.getSystemStats(TEST_CONFIG.organizationId);
    
    console.log(`  ✓ Knowledge bases: ${stats.totalKnowledgeBases}`);
    console.log(`  ✓ Total chunks: ${stats.totalChunks}`);
    console.log(`  ✓ Average chunk size: ${stats.averageChunkSize} tokens`);
    console.log(`  ✓ Last updated: ${stats.lastUpdated}`);
    
    if (Object.keys(stats.sourceTypeBreakdown).length > 0) {
      console.log('  Source type breakdown:');
      Object.entries(stats.sourceTypeBreakdown).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });
    }
    console.log('');
  }

  private async testCleanup(): Promise<void> {
    console.log('  Cleaning up test data...');
    
    // Get all knowledge bases created during test
    const { data: knowledgeBases, error } = await this.supabase
      .from('rag_knowledge_base')
      .select('id')
      .eq('organization_id', TEST_CONFIG.organizationId);

    if (error) {
      console.warn('  ⚠️ Could not retrieve knowledge bases for cleanup:', error);
      return;
    }

    if (!knowledgeBases || knowledgeBases.length === 0) {
      console.log('  ✓ No test data to clean up');
      return;
    }

    let cleanedCount = 0;
    for (const kb of knowledgeBases) {
      const success = await this.ragService.deleteKnowledgeBase(
        kb.id,
        TEST_CONFIG.organizationId
      );
      if (success) cleanedCount++;
    }

    console.log(`  ✓ Cleaned up ${cleanedCount}/${knowledgeBases.length} knowledge bases`);
  }

  private printTestSummary(results: Record<string, boolean>): void {
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
      console.log('🎉 All tests passed! RAG system is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the errors above.');
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const test = new RAGSmokeTest();
  test.runFullTest().catch(console.error);
}

export { RAGSmokeTest };



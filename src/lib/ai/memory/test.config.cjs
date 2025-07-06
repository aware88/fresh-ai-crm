// Load environment variables from .env file
require('dotenv').config({ path: '.env' });

// Test configuration for AI Memory System
module.exports = {
  // Test organization ID - should be a valid organization UUID from your database
  organizationId: process.env.ORGANIZATION_ID || '00000000-0000-0000-0000-000000000000',
  
  // OpenAI API key for generating embeddings (mocked in tests)
  openaiApiKey: process.env.OPENAI_API_KEY || 'mock-api-key',
  
  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'mock-service-key'
  },
  
  // Test settings
  settings: {
    // Minimum similarity score for search results (0-1)
    similarityThreshold: 0.6,
    
    // Maximum number of search results to return
    maxSearchResults: 5,
    
    // Test memory settings
    testMemory: {
      content: 'This is a test memory for the AI Memory System',
      memoryType: 'test',
      importanceScore: 0.8,
      metadata: {
        source: 'test-script',
        testRunId: null // Will be set at runtime
      }
    }
  }
};

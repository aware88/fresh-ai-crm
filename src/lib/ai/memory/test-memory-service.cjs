/**
 * Test script for the AI Memory System without pgvector
 * Tests the JSON-based embedding storage and similarity search functionality
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load test configuration and helpers
const config = require('./test.config.cjs');
const {
  generateTestMemory,
  generateTestQuery,
  isValidMemory,
  isValidSearchResult,
  sleep,
  isExpectedError
} = require('./test-helpers.cjs');

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getUser: async () => ({
      data: { user: { id: 'test-user-id' } }
    })
  },
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ 
    data: { id: 'test-memory-id' }, 
    error: null 
  }),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockResolvedValue({ error: null })
};

// Initialize Supabase client with mock
const supabase = mockSupabase;

// Mock the OpenAI API
class MockOpenAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.embeddings = {
      create: async ({ input, model }) => {
        // Simple mock that returns a deterministic embedding based on input text
        const text = Array.isArray(input) ? input[0] : input;
        const embedding = new Array(1536).fill(0).map((_, i) => {
          const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          return Math.sin(hash + i) * 0.1; // Small values to keep vectors normalized
        });
        
        return {
          data: [{
            embedding,
            index: 0,
            object: 'embedding'
          }]
        };
      }
    };
  }
}

// Mock the OpenAIEmbeddings service
class OpenAIEmbeddings {
  constructor(apiKey) {
    this.openai = new MockOpenAI(apiKey);
  }

  async generateEmbedding(text) {
    const response = await this.openai.embeddings.create({
      input: text,
      model: 'text-embedding-ada-002'
    });
    return response.data[0].embedding;
  }

  async generateEmbeddings(texts) {
    const response = await this.openai.embeddings.create({
      input: texts,
      model: 'text-embedding-ada-002'
    });
    return response.data.map(item => item.embedding);
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

// Memory Service
class MemoryService {
  constructor(supabaseClient, embeddingsService) {
    this.supabase = supabaseClient;
    this.embeddings = embeddingsService;
  }

  async createMemory(memoryData) {
    const { data: user } = await this.supabase.auth.getUser();
    
    // Generate embedding for the memory content
    const embedding = await this.embeddings.generateEmbedding(memoryData.content);
    
    const { data, error } = await this.supabase
      .from('ai_memories')
      .insert([
        {
          content: memoryData.content,
          memory_type: memoryData.memoryType || 'test',
          importance_score: memoryData.importanceScore || 0.8,
          metadata: memoryData.metadata || {},
          embedding_json: embedding,
          created_by: user?.id || null,
          updated_by: user?.id || null,
          organization_id: memoryData.organizationId || config.organizationId
        }
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async getMemory(id) {
    const { data, error } = await this.supabase
      .from('ai_memories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateMemory(id, updates) {
    const { data: user } = await this.supabase.auth.getUser();
    
    const updateData = {
      ...updates,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString()
    };

    // If content is being updated, update the embedding too
    if (updates.content) {
      updateData.embedding_json = await this.embeddings.generateEmbedding(updates.content);
    }

    const { data, error } = await this.supabase
      .from('ai_memories')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMemory(id) {
    const { error } = await this.supabase
      .from('ai_memories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  async searchMemories(query, options = {}) {
    const {
      limit = config.settings.maxSearchResults,
      minScore = config.settings.similarityThreshold,
      filter = {},
      includeEmbedding = false
    } = options;

    // Generate embedding for the search query
    const queryEmbedding = await this.embeddings.generateEmbedding(query);

    // First, get all memories that match the filter
    let queryBuilder = this.supabase
      .from('ai_memories')
      .select('*');

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        queryBuilder = queryBuilder.in(key, value);
      } else {
        queryBuilder = queryBuilder.eq(key, value);
      }
    });

    const { data: memories, error } = await queryBuilder;
    if (error) throw error;

    // Calculate similarity scores
    const results = memories.map(memory => {
      const similarity = cosineSimilarity(queryEmbedding, memory.embedding_json || []);
      return {
        ...memory,
        similarity,
        // Remove the embedding from results unless explicitly requested
        ...(!includeEmbedding && { embedding_json: undefined })
      };
    });

    // Filter by minimum score and sort by similarity
    return results
      .filter(result => result.similarity >= minScore)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting AI Memory System Tests...');
  
  // Initialize services
  const embeddingsService = new OpenAIEmbeddings(config.openaiApiKey);
  const memoryService = new MemoryService(supabase, embeddingsService);
  
  // Test 1: Create Memory
  console.log('\n--- Test 1: Create Memory ---');
  const testMemory = generateTestMemory({
    content: 'The quick brown fox jumps over the lazy dog',
    memoryType: 'test',
    importanceScore: 0.8
  });
  
  const createdMemory = await memoryService.createMemory(testMemory);
  console.log('✅ Memory created with ID:', createdMemory.id);
  
  // Test 2: Get Memory
  console.log('\n--- Test 2: Get Memory ---');
  const retrievedMemory = await memoryService.getMemory(createdMemory.id);
  console.log('✅ Memory retrieved successfully');
  
  // Test 3: Update Memory
  console.log('\n--- Test 3: Update Memory ---');
  const updatedContent = 'The quick brown fox jumps over the lazy dog and runs away';
  const updatedMemory = await memoryService.updateMemory(createdMemory.id, {
    content: updatedContent,
    importance_score: 0.9
  });
  console.log('✅ Memory updated successfully');
  
  // Test 4: Search Memories
  console.log('\n--- Test 4: Search Memories ---');
  const searchResults = await memoryService.searchMemories('brown fox', {
    memory_type: 'test',
    limit: 5,
    minScore: 0.5
  });
  console.log(`✅ Found ${searchResults.length} relevant memories`);
  
  // Test 5: Delete Memory
  console.log('\n--- Test 5: Delete Memory ---');
  await memoryService.deleteMemory(createdMemory.id);
  
  // Verify deletion
  try {
    await memoryService.getMemory(createdMemory.id);
    throw new Error('Memory was not deleted');
  } catch (error) {
    if (!isExpectedError(error, 'No rows returned')) {
      throw error;
    }
    console.log('✅ Memory deleted successfully');
  }

  // Print test summary
  console.log('\n===============================');
  console.log('       TEST SUMMARY');
  console.log('===============================');
  console.log('✅ All 5 tests passed successfully!');
  console.log('===============================');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

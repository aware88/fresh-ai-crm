const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const config = require('./test.config.cjs');

// Dynamic import for OpenAI to handle both ESM and CommonJS
let OpenAI;

try {
  // Try to use dynamic import for ESM
  OpenAI = require('openai').default || require('openai');
} catch (error) {
  console.warn('Failed to import OpenAI with ESM, falling back to CommonJS');
  OpenAI = require('openai');
}

class MemoryService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient || createClient(
      config.supabaseUrl,
      config.supabaseKey
    );
    
    try {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey || 'test-key'
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      // Create a mock OpenAI client for testing
      this.openai = {
        embeddings: {
          create: async () => ({
            data: [{
              embedding: Array(1536).fill(0.1),
              index: 0,
              object: 'embedding'
            }]
          })
        }
      };
    }
  }

  /**
   * Creates a new memory in the database
   * @param {Object} memory - The memory to create
   * @param {string} memory.content - The content of the memory
   * @param {string} memory.memoryType - The type of memory
   * @param {number} memory.importanceScore - The importance score (0-1)
   * @param {Object} [metadata] - Optional metadata
   * @returns {Promise<Object>} The created memory
   */
  async createMemory(memory, metadata = {}) {
    try {
      const { content, memoryType, importanceScore } = memory;
      
      // Generate embedding for the memory content
      const embedding = await this._generateEmbedding(content);
      
      const { data: userData } = await this.supabase.auth.getUser();
      const userId = userData?.user?.id || 'system';
      
      const memoryData = {
        id: uuidv4(),
        content,
        memory_type: memoryType,
        importance_score: importanceScore,
        embedding: JSON.stringify(embedding),
        organization_id: metadata.organizationId || config.organizationId,
        created_by: userId,
        updated_by: userId,
        metadata: metadata.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('ai_memories')
        .insert([memoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating memory:', error);
      throw error;
    }
  }

  /**
   * Retrieves a memory by ID
   * @param {string} memoryId - The ID of the memory to retrieve
   * @returns {Promise<Object>} The retrieved memory
   */
  async getMemory(memoryId) {
    try {
      const { data, error } = await this.supabase
        .from('ai_memories')
        .select('*')
        .eq('id', memoryId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error getting memory ${memoryId}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing memory
   * @param {string} memoryId - The ID of the memory to update
   * @param {Object} updates - The fields to update
   * @returns {Promise<Object>} The updated memory
   */
  async updateMemory(memoryId, updates) {
    try {
      const { content, ...otherUpdates } = updates;
      
      const updateData = {
        ...otherUpdates,
        updated_at: new Date().toISOString()
      };
      
      // If content is being updated, generate a new embedding
      if (content) {
        updateData.content = content;
        updateData.embedding = JSON.stringify(await this._generateEmbedding(content));
      }

      const { data, error } = await this.supabase
        .from('ai_memories')
        .update(updateData)
        .eq('id', memoryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating memory ${memoryId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a memory by ID
   * @param {string} memoryId - The ID of the memory to delete
   * @returns {Promise<void>}
   */
  async deleteMemory(memoryId) {
    try {
      const { error } = await this.supabase
        .from('ai_memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting memory ${memoryId}:`, error);
      throw error;
    }
  }

  /**
   * Searches for memories similar to the query
   * @param {string} query - The search query
   * @param {Object} [options] - Search options
   * @param {number} [options.limit=5] - Maximum number of results to return
   * @param {number} [options.minSimilarity=0.7] - Minimum similarity score (0-1)
   * @param {string} [options.memoryType] - Filter by memory type
   * @returns {Promise<Array>} Array of matching memories with similarity scores
   */
  async searchMemories(query, options = {}) {
    try {
      const {
        limit = 5,
        minSimilarity = 0.7,
        memoryType
      } = options;

      // Generate embedding for the query
      const queryEmbedding = await this._generateEmbedding(query);
      
      // Build the RPC parameters
      const rpcParams = {
        query_embedding: queryEmbedding,
        match_threshold: minSimilarity,
        match_count: limit,
        org_id: options.organizationId || config.organizationId
      };
      
      // Call the RPC function
      const { data, error } = await this.supabase
        .rpc('match_memories', rpcParams);
      
      if (error) throw error;
      
      // Filter by memory type if provided
      let results = data || [];
      if (memoryType && results.length > 0) {
        results = results.filter(memory => memory.memory_type === memoryType);
      }
      
      return results;
    } catch (error) {
      console.error('Error searching memories:', error);
      throw error;
    }
  }

  /**
   * Generates an embedding for the given text using OpenAI
   * @private
   * @param {string} text - The text to generate an embedding for
   * @returns {Promise<Array<number>>} The embedding vector
   */
  async _generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }
}

module.exports = { MemoryService };

// Export for ES modules if needed
try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MemoryService };
  }
} catch (e) {
  // Not in CommonJS environment
}

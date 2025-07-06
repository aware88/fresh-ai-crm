const { createClient } = require('@supabase/supabase-js');
const { MemoryService } = require('./memory.service.js');
const { generateTestMemory } = require('./test-helpers.cjs');
const { v4: uuidv4 } = require('uuid');

// Mock uuid to return predictable IDs
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-memory-id')
}));

// Mock the Supabase client
jest.mock('@supabase/supabase-js');

// Mock the OpenAI client
const mockEmbedding = {
  data: [{
    embedding: Array(1536).fill(0.1),
    index: 0,
    object: 'embedding'
  }]
};

const mockOpenAI = {
  embeddings: {
    create: jest.fn().mockResolvedValue(mockEmbedding)
  }
};

jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => mockOpenAI),
    __esModule: true
  };
});

describe('MemoryService', () => {
  let memoryService;
  let mockSupabase;
  let mockQueryBuilder;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock query builder with proper method chaining
    mockQueryBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'test-memory-id' }, error: null }),
      rpc: jest.fn().mockReturnThis()
    };

    // Set up mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
      },
      from: jest.fn().mockReturnValue(mockQueryBuilder),
      rpc: jest.fn().mockReturnValue(mockQueryBuilder)
    };

    // Mock the createClient to return our mock Supabase client
    createClient.mockReturnValue(mockSupabase);

    // Create a new instance of MemoryService for each test
    memoryService = new MemoryService(mockSupabase);
  });

  describe('createMemory', () => {
    it('should create a new memory with the provided data', async () => {
      const testMemory = generateTestMemory();
      
      // Mock the Supabase response
      const mockMemory = {
        id: 'test-memory-id',
        content: testMemory.content,
        memory_type: testMemory.memoryType,
        importance_score: testMemory.importanceScore,
        embedding: JSON.stringify(Array(1536).fill(0.1)),
        created_by: 'test-user-id',
        updated_by: 'test-user-id',
        created_at: expect.any(String),
        updated_at: expect.any(String),
        organization_id: '00000000-0000-0000-0000-000000000000',
        metadata: {}
      };

      // Set up the mock response
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: mockMemory,
        error: null
      });

      const result = await memoryService.createMemory(testMemory);

      expect(result).toEqual(mockMemory);
      expect(mockSupabase.from).toHaveBeenCalledWith('ai_memories');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({
          content: testMemory.content,
          memory_type: testMemory.memoryType,
          importance_score: testMemory.importanceScore
        })])
      );
    });
  });

  describe('getMemory', () => {
    it('should retrieve a memory by ID', async () => {
      const memoryId = 'test-memory-id';
      const mockMemory = {
        id: memoryId,
        content: 'Test memory content',
        memory_type: 'test',
        importance_score: 0.8
      };

      // Set up the mock response
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: mockMemory,
        error: null
      });

      const result = await memoryService.getMemory(memoryId);

      expect(result).toEqual(mockMemory);
      expect(mockSupabase.from).toHaveBeenCalledWith('ai_memories');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', memoryId);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });
  });

  describe('updateMemory', () => {
    it('should update an existing memory', async () => {
      const memoryId = 'test-memory-id';
      const updates = {
        content: 'Updated test content',
        importance_score: 0.9
      };

      const updatedMemory = {
        id: memoryId,
        ...updates,
        updated_by: 'test-user-id',
        updated_at: expect.any(String)
      };

      // Set up the mock response
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: updatedMemory,
        error: null
      });

      const result = await memoryService.updateMemory(memoryId, updates);

      expect(result).toEqual(updatedMemory);
      expect(mockSupabase.from).toHaveBeenCalledWith('ai_memories');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          content: updates.content,
          importance_score: updates.importance_score,
          updated_at: expect.any(String)
        })
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', memoryId);
    });
  });

  describe('deleteMemory', () => {
    it('should delete a memory by ID', async () => {
      const memoryId = 'test-memory-id';
      
      // Set up the mock response
      mockQueryBuilder.delete.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.eq.mockResolvedValueOnce({ error: null });
      
      await memoryService.deleteMemory(memoryId);

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_memories');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', memoryId);
    });
  });
  
  describe('searchMemories', () => {
    it('should search for memories similar to the query', async () => {
      const query = 'test query';
      const mockResults = [
        { id: 'memory-1', content: 'Memory 1', similarity: 0.9 },
        { id: 'memory-2', content: 'Memory 2', similarity: 0.8 }
      ];
      
      // Set up the mock response for RPC call
      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockResults,
        error: null
      });
      
      const result = await memoryService.searchMemories(query);
      
      expect(result).toEqual(mockResults);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'match_memories',
        expect.objectContaining({
          query_embedding: expect.any(Array),
          match_threshold: expect.any(Number),
          match_count: expect.any(Number)
        })
      );
    });

    it('should filter results by memory type if specified', async () => {
      const query = 'test query';
      const memoryType = 'note';
      const mockResults = [
        { id: 'memory-1', content: 'Memory 1', memory_type: 'note', similarity: 0.9 },
        { id: 'memory-2', content: 'Memory 2', memory_type: 'conversation', similarity: 0.8 }
      ];
      
      // Set up the mock response for RPC call
      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockResults,
        error: null
      });
      
      const result = await memoryService.searchMemories(query, { memoryType });
      
      // Should only return memories of the specified type
      expect(result).toEqual([mockResults[0]]);
    });

    it('should handle empty query results', async () => {
      const query = 'non-existent query';
      
      // Set up the mock response for RPC call with empty results
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null
      });
      
      const result = await memoryService.searchMemories(query);
      
      expect(result).toEqual([]);
    });

    it('should handle errors from the database', async () => {
      const query = 'test query';
      
      // Set up the mock response with an error
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });
      
      await expect(memoryService.searchMemories(query)).rejects.toEqual({ message: 'Database error' });
    });
  });

  describe('Error handling', () => {
    it('should handle errors when creating a memory', async () => {
      const testMemory = generateTestMemory();
      
      // Set up the mock response with an error
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed to create memory' }
      });
      
      await expect(memoryService.createMemory(testMemory)).rejects.toEqual({ message: 'Failed to create memory' });
    });

    it('should handle errors when getting a memory', async () => {
      const memoryId = 'non-existent-id';
      
      // Set up the mock response with an error
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Memory not found' }
      });
      
      await expect(memoryService.getMemory(memoryId)).rejects.toEqual({ message: 'Memory not found' });
    });

    it('should handle errors when updating a memory', async () => {
      const memoryId = 'test-memory-id';
      const updates = { content: 'Updated content' };
      
      // Set up the mock response with an error
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed to update memory' }
      });
      
      await expect(memoryService.updateMemory(memoryId, updates)).rejects.toEqual({ message: 'Failed to update memory' });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content when creating a memory', async () => {
      const testMemory = { ...generateTestMemory(), content: '' };
      
      // Mock the embedding generation to ensure it's called even with empty content
      const mockEmbeddingResponse = {
        data: [{ embedding: Array(1536).fill(0), index: 0, object: 'embedding' }]
      };
      mockOpenAI.embeddings.create.mockResolvedValueOnce(mockEmbeddingResponse);
      
      // Set up successful response
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: 'test-memory-id', content: '', memory_type: testMemory.memoryType },
        error: null
      });
      
      const result = await memoryService.createMemory(testMemory);
      
      expect(result).toHaveProperty('content', '');
      expect(mockOpenAI.embeddings.create).toHaveBeenCalled();
    });
    
    it('should handle very long content when creating a memory', async () => {
      // Create a memory with very long content (10,000 characters)
      const longContent = 'A'.repeat(10000);
      const testMemory = { ...generateTestMemory(), content: longContent };
      
      // Mock the embedding generation
      const mockEmbeddingResponse = {
        data: [{ embedding: Array(1536).fill(0.1), index: 0, object: 'embedding' }]
      };
      mockOpenAI.embeddings.create.mockResolvedValueOnce(mockEmbeddingResponse);
      
      // Set up successful response
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: 'test-memory-id', content: longContent, memory_type: testMemory.memoryType },
        error: null
      });
      
      const result = await memoryService.createMemory(testMemory);
      
      expect(result).toHaveProperty('content', longContent);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalled();
      // Check that the input to OpenAI was truncated if necessary
      const embeddingCall = mockOpenAI.embeddings.create.mock.calls[0][0];
      expect(embeddingCall.input.length).toBeLessThanOrEqual(10000);
    });
  });
  
  describe('OpenAI embedding generation', () => {
    it('should generate embeddings for memory content', async () => {
      const testMemory = generateTestMemory();
      
      // Mock the embedding generation
      const mockEmbedding = Array(1536).fill(0.2);
      const mockEmbeddingResponse = {
        data: [{ embedding: mockEmbedding, index: 0, object: 'embedding' }]
      };
      mockOpenAI.embeddings.create.mockResolvedValueOnce(mockEmbeddingResponse);
      
      // Set up successful response
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: 'test-memory-id' },
        error: null
      });
      
      await memoryService.createMemory(testMemory);
      
      // Verify OpenAI was called with the right parameters
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: testMemory.content
      });
      
      // Verify the embedding was included in the insert
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({
          embedding: JSON.stringify(mockEmbedding)
        })])
      );
    });
    
    it('should handle OpenAI API errors gracefully', async () => {
      const testMemory = generateTestMemory();
      
      // Create a spy on console.error to suppress error output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock OpenAI embeddings.create to reject with an error
      mockOpenAI.embeddings.create.mockRejectedValueOnce(new Error('OpenAI API error'));
      
      // Set up successful response for the database operation
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: 'test-memory-id' },
        error: null
      });
      
      // Expect the createMemory call to reject with the OpenAI error
      await expect(memoryService.createMemory(testMemory)).rejects.toThrow('OpenAI API error');
      
      // Verify OpenAI was called
      expect(mockOpenAI.embeddings.create).toHaveBeenCalled();
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error generating embedding'),
        expect.any(Error)
      );
      
      // Clean up
      consoleErrorSpy.mockRestore();
    });
    
    it('should use fallback OpenAI client if initialization fails', async () => {
      // Save the original OpenAI constructor
      const originalOpenAI = require('openai').default;
      
      // Mock the OpenAI constructor to throw an error
      jest.doMock('openai', () => {
        return {
          default: jest.fn().mockImplementation(() => {
            throw new Error('OpenAI initialization failed');
          }),
          __esModule: true
        };
      });
      
      // Create a spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create a new memory service instance which should use the fallback client
      const newMemoryService = new MemoryService(mockSupabase);
      
      // Verify the fallback client was created
      expect(newMemoryService.openai).toBeDefined();
      expect(newMemoryService.openai.embeddings).toBeDefined();
      expect(newMemoryService.openai.embeddings.create).toBeDefined();
      
      // Clean up
      consoleErrorSpy.mockRestore();
      jest.resetModules();
    });
  });
});

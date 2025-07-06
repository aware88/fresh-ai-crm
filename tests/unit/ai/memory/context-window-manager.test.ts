import { ContextWindowManager, ContextWindowConfig } from '../../../../src/lib/ai/memory/context-window-manager';
import { MemoryService } from '../../../../src/lib/ai/memory/memory-service';
import { MemoryImportanceService } from '../../../../src/lib/ai/memory/memory-importance-service';
import { OpenAIEmbeddings } from '../../../../src/lib/ai/memory/embeddings/openai-embeddings';
import { AIMemory, AIMemoryType } from '../../../../src/lib/ai/memory/ai-memory-service';

// Mock dependencies
jest.mock('../../../../src/lib/ai/memory/memory-service');
jest.mock('../../../../src/lib/ai/memory/memory-importance-service');
jest.mock('../../../../src/lib/ai/memory/embeddings/openai-embeddings');

describe('ContextWindowManager', () => {
  // Mock data
  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-456';
  const mockQuery = 'customer needs help with billing';
  
  // Mock memories
  const mockMemories: AIMemory[] = [
    {
      id: 'mem-1',
      type: AIMemoryType.CONVERSATION,
      content: 'Customer mentioned they were having trouble with their recent invoice.',
      organization_id: mockOrganizationId,
      user_id: mockUserId,
      created_at: '2023-06-15T10:30:00Z',
      metadata: {}
    },
    {
      id: 'mem-2',
      type: AIMemoryType.CUSTOMER_PREFERENCE,
      content: 'Customer prefers email communication for billing matters.',
      organization_id: mockOrganizationId,
      user_id: mockUserId,
      created_at: '2023-06-10T14:20:00Z',
      metadata: {}
    },
    {
      id: 'mem-3',
      type: AIMemoryType.SYSTEM_INSIGHT,
      content: 'There was a billing system update on June 12 that caused some invoice delays.',
      organization_id: mockOrganizationId,
      created_at: '2023-06-13T09:15:00Z',
      metadata: {}
    }
  ];
  
  // Mock scored memories
  const mockScoredMemories = [
    {
      ...mockMemories[0],
      importanceScore: 0.9
    },
    {
      ...mockMemories[1],
      importanceScore: 0.7
    },
    {
      ...mockMemories[2],
      importanceScore: 0.8
    }
  ];
  
  // Mock services
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis()
  } as any;
  
  const mockMemoryService = {
    searchMemories: jest.fn().mockResolvedValue(mockMemories)
  } as jest.Mocked<MemoryService>;
  
  const mockImportanceService = {
    scoreAndSortMemories: jest.fn().mockResolvedValue(mockScoredMemories)
  } as jest.Mocked<MemoryImportanceService>;
  
  const mockEmbeddings = {} as jest.Mocked<OpenAIEmbeddings>;
  
  // System under test
  let contextWindowManager: ContextWindowManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    contextWindowManager = new ContextWindowManager(
      mockSupabase,
      mockMemoryService,
      mockImportanceService,
      mockEmbeddings
    );
  });
  
  describe('getConfigForOrganization', () => {
    it('should return the default config', async () => {
      const config = await contextWindowManager.getConfigForOrganization(mockOrganizationId);
      
      expect(config).toBeDefined();
      expect(config.maxTokens).toBeDefined();
      expect(config.minImportanceThreshold).toBeDefined();
      expect(config.maxMemories).toBeDefined();
    });
  });
  
  describe('estimateTokenCount', () => {
    it('should estimate tokens based on text length', () => {
      const text = 'This is a test string with approximately 12 tokens';
      const tokenCount = contextWindowManager.estimateTokenCount(text);
      
      // Simple approximation: 1 token ≈ 4 characters
      const expectedTokens = Math.ceil(text.length / 4);
      expect(tokenCount).toBe(expectedTokens);
    });
  });
  
  describe('compressMemoryContent', () => {
    it('should compress content if it exceeds target ratio', async () => {
      const longContent = 'This is a very long content that should be compressed. '.repeat(20);
      const memory = {
        ...mockMemories[0],
        content: longContent
      };
      
      const compressed = await contextWindowManager.compressMemoryContent(memory, 0.7);
      
      expect(compressed.length).toBeLessThan(longContent.length);
      expect(compressed).toContain('...');
    });
    
    it('should not compress content if it is already within target ratio', async () => {
      const shortContent = 'This is a short content';
      const memory = {
        ...mockMemories[0],
        content: shortContent
      };
      
      const compressed = await contextWindowManager.compressMemoryContent(memory, 0.7);
      
      expect(compressed).toBe(shortContent);
      expect(compressed).not.toContain('...');
    });
  });
  
  describe('tokenizeMemory', () => {
    it('should add token count to memory', async () => {
      const memory = mockScoredMemories[0];
      const tokenized = await contextWindowManager.tokenizeMemory(memory, false, 0.7);
      
      expect(tokenized).toHaveProperty('tokenCount');
      expect(tokenized.tokenCount).toBeGreaterThan(0);
    });
    
    it('should compress memory if compression is enabled', async () => {
      const memory = {
        ...mockScoredMemories[0],
        content: 'This is a very long content that should be compressed. '.repeat(20)
      };
      
      const tokenized = await contextWindowManager.tokenizeMemory(memory, true, 0.7);
      
      expect(tokenized).toHaveProperty('compressedContent');
      expect(tokenized.compressedContent).toBeDefined();
      expect(tokenized.compressedContent!.length).toBeLessThan(memory.content.length);
    });
  });
  
  describe('buildContextWindow', () => {
    it('should build a context window with memories', async () => {
      const contextWindow = await contextWindowManager.buildContextWindow(
        mockQuery,
        mockOrganizationId,
        mockUserId
      );
      
      expect(mockMemoryService.searchMemories).toHaveBeenCalledWith(
        mockQuery,
        mockOrganizationId,
        mockUserId
      );
      
      expect(mockImportanceService.scoreAndSortMemories).toHaveBeenCalledWith(
        mockMemories,
        mockOrganizationId
      );
      
      expect(contextWindow).toHaveProperty('memories');
      expect(contextWindow).toHaveProperty('totalTokens');
      expect(contextWindow).toHaveProperty('memoryCount');
      expect(contextWindow).toHaveProperty('averageImportance');
      expect(contextWindow.memories.length).toBeGreaterThan(0);
    });
    
    it('should filter memories by importance threshold', async () => {
      // Mock importance service to return memories with varying importance
      const mixedScoredMemories = [
        { ...mockMemories[0], importanceScore: 0.9 },
        { ...mockMemories[1], importanceScore: 0.2 }, // Below default threshold of 0.3
        { ...mockMemories[2], importanceScore: 0.8 }
      ];
      
      mockImportanceService.scoreAndSortMemories.mockResolvedValueOnce(mixedScoredMemories);
      
      const contextWindow = await contextWindowManager.buildContextWindow(
        mockQuery,
        mockOrganizationId,
        mockUserId
      );
      
      // Should only include memories above threshold
      expect(contextWindow.memories.length).toBe(2);
      expect(contextWindow.memories[0].importanceScore).toBeGreaterThanOrEqual(0.3);
      expect(contextWindow.memories[1].importanceScore).toBeGreaterThanOrEqual(0.3);
    });
  });
  
  describe('selectMemoriesForContext', () => {
    it('should select memories based on importance and token limits', () => {
      // Create a method to access private method for testing
      const selectMemoriesForContext = (contextWindowManager as any).selectMemoriesForContext.bind(contextWindowManager);
      
      const tokenizedMemories = [
        { ...mockScoredMemories[0], tokenCount: 100, importanceScore: 0.9 },
        { ...mockScoredMemories[1], tokenCount: 150, importanceScore: 0.7 },
        { ...mockScoredMemories[2], tokenCount: 200, importanceScore: 0.8 }
      ];
      
      // Test with token limit that allows all memories
      const selected1 = selectMemoriesForContext(tokenizedMemories, 500, 5);
      expect(selected1.length).toBe(3);
      
      // Test with token limit that only allows some memories
      const selected2 = selectMemoriesForContext(tokenizedMemories, 250, 5);
      expect(selected2.length).toBe(2);
      expect(selected2[0].importanceScore).toBe(0.9); // Highest importance first
      
      // Test with memory count limit
      const selected3 = selectMemoriesForContext(tokenizedMemories, 500, 2);
      expect(selected3.length).toBe(2);
      expect(selected3[0].importanceScore).toBe(0.9);
      expect(selected3[1].importanceScore).toBe(0.8);
    });
  });
  
  describe('formatContextForPrompt', () => {
    it('should format context window for prompt', () => {
      const contextWindow = {
        memories: [
          { 
            ...mockScoredMemories[0], 
            tokenCount: 100,
            content: 'Memory 1 content'
          },
          { 
            ...mockScoredMemories[1], 
            tokenCount: 150,
            content: 'Memory 2 content'
          }
        ],
        totalTokens: 250,
        memoryCount: 2,
        averageImportance: 0.8
      };
      
      const formatted = contextWindowManager.formatContextForPrompt(contextWindow);
      
      expect(formatted).toContain('RELEVANT MEMORIES (2 items)');
      expect(formatted).toContain('Memory 1');
      expect(formatted).toContain('Memory 2');
      expect(formatted).toContain('Memory 1 content');
      expect(formatted).toContain('Memory 2 content');
    });
    
    it('should handle empty context window', () => {
      const emptyContext = {
        memories: [],
        totalTokens: 0,
        memoryCount: 0,
        averageImportance: 0
      };
      
      const formatted = contextWindowManager.formatContextForPrompt(emptyContext);
      
      expect(formatted).toBe('No relevant memories available.');
    });
  });
  
  describe('recordMemoryAccess', () => {
    it('should record memory access in the database', async () => {
      // Mock Supabase response
      const mockResponse = { data: [{ id: 'access-1' }], error: null };
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockResolvedValue(mockResponse);
      
      const memoryIds = ['mem-1', 'mem-2'];
      const result = await contextWindowManager.recordMemoryAccess(
        memoryIds,
        mockOrganizationId,
        mockUserId,
        'test_context'
      );
      
      expect(mockSupabase.from).toHaveBeenCalledWith('memory_access');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(result).toBe(1); // One record created
    });
    
    it('should handle empty memory ID array', async () => {
      const result = await contextWindowManager.recordMemoryAccess(
        [],
        mockOrganizationId,
        mockUserId
      );
      
      expect(result).toBe(0);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});

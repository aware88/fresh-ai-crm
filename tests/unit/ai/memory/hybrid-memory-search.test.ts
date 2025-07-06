import { HybridMemorySearch, HybridSearchConfig } from '../../../../src/lib/ai/memory/hybrid-memory-search';
import { MemoryService } from '../../../../src/lib/ai/memory/memory-service';
import { OpenAIEmbeddings } from '../../../../src/lib/ai/memory/embeddings/openai-embeddings';
import { AIMemory, AIMemoryType } from '../../../../src/lib/ai/memory/ai-memory-service';

// Mock dependencies
jest.mock('../../../../src/lib/ai/memory/memory-service');
jest.mock('../../../../src/lib/ai/memory/embeddings/openai-embeddings');

describe('HybridMemorySearch', () => {
  // Mock data
  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-456';
  const mockQuery = 'customer billing issue';
  
  // Mock memories
  const mockMemories: AIMemory[] = [
    {
      id: 'mem-1',
      type: AIMemoryType.CONVERSATION,
      content: 'Customer mentioned they were having trouble with their recent invoice.',
      organization_id: mockOrganizationId,
      user_id: mockUserId,
      created_at: '2023-06-15T10:30:00Z',
      metadata: { similarity: 0.85 }
    },
    {
      id: 'mem-2',
      type: AIMemoryType.CUSTOMER_PREFERENCE,
      content: 'Customer prefers email communication for billing matters.',
      organization_id: mockOrganizationId,
      user_id: mockUserId,
      created_at: '2023-06-10T14:20:00Z',
      metadata: { similarity: 0.75 }
    },
    {
      id: 'mem-3',
      type: AIMemoryType.SYSTEM_INSIGHT,
      content: 'There was a billing system update on June 12 that caused some invoice delays.',
      organization_id: mockOrganizationId,
      created_at: '2023-06-13T09:15:00Z',
      metadata: { similarity: 0.92 }
    }
  ];
  
  // Mock services
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  } as any;
  
  const mockMemoryService = {
    searchMemories: jest.fn().mockResolvedValue(mockMemories)
  } as jest.Mocked<MemoryService>;
  
  const mockEmbeddings = {} as jest.Mocked<OpenAIEmbeddings>;
  
  // System under test
  let hybridSearch: HybridMemorySearch;
  
  beforeEach(() => {
    jest.clearAllMocks();
    hybridSearch = new HybridMemorySearch(
      mockSupabase,
      mockMemoryService,
      mockEmbeddings
    );
  });
  
  describe('getConfigForOrganization', () => {
    it('should return the default config', async () => {
      const config = await hybridSearch.getConfigForOrganization(mockOrganizationId);
      
      expect(config).toBeDefined();
      expect(config.vectorWeight).toBeDefined();
      expect(config.keywordWeight).toBeDefined();
      expect(config.maxResults).toBeDefined();
      expect(config.minVectorSimilarity).toBeDefined();
      expect(config.useTemporalWeighting).toBeDefined();
    });
  });
  
  describe('search', () => {
    it('should perform hybrid search and return ranked results', async () => {
      // Mock vector search results
      mockMemoryService.searchMemories.mockResolvedValueOnce(mockMemories);
      
      // Mock keyword search results
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.or.mockReturnThis();
      mockSupabase.single.mockResolvedValue({
        data: [mockMemories[0], mockMemories[2]], // Only two memories match keywords
        error: null
      });
      
      // Create a spy on the private methods
      const performVectorSearchSpy = jest.spyOn(hybridSearch as any, 'performVectorSearch');
      const performKeywordSearchSpy = jest.spyOn(hybridSearch as any, 'performKeywordSearch');
      const combineSearchResultsSpy = jest.spyOn(hybridSearch as any, 'combineSearchResults');
      
      // Make these spies return some test data
      performVectorSearchSpy.mockResolvedValue([
        { ...mockMemories[0], vectorScore: 0.85, keywordScore: 0, temporalScore: 0, relevanceScore: 0 },
        { ...mockMemories[1], vectorScore: 0.75, keywordScore: 0, temporalScore: 0, relevanceScore: 0 },
        { ...mockMemories[2], vectorScore: 0.92, keywordScore: 0, temporalScore: 0, relevanceScore: 0 }
      ]);
      
      performKeywordSearchSpy.mockResolvedValue([
        { ...mockMemories[0], vectorScore: 0, keywordScore: 0.9, temporalScore: 0, relevanceScore: 0 },
        { ...mockMemories[2], vectorScore: 0, keywordScore: 0.8, temporalScore: 0, relevanceScore: 0 }
      ]);
      
      combineSearchResultsSpy.mockResolvedValue([
        { 
          ...mockMemories[2], 
          vectorScore: 0.92, 
          keywordScore: 0.8, 
          temporalScore: 0.95, 
          relevanceScore: 0.89 
        },
        { 
          ...mockMemories[0], 
          vectorScore: 0.85, 
          keywordScore: 0.9, 
          temporalScore: 0.85, 
          relevanceScore: 0.87 
        },
        { 
          ...mockMemories[1], 
          vectorScore: 0.75, 
          keywordScore: 0, 
          temporalScore: 0.8, 
          relevanceScore: 0.52 
        }
      ]);
      
      const results = await hybridSearch.search(mockQuery, mockOrganizationId, mockUserId);
      
      expect(performVectorSearchSpy).toHaveBeenCalled();
      expect(performKeywordSearchSpy).toHaveBeenCalled();
      expect(combineSearchResultsSpy).toHaveBeenCalled();
      
      expect(results).toHaveLength(3);
      expect(results[0].relevanceScore).toBeGreaterThan(results[1].relevanceScore);
      expect(results[1].relevanceScore).toBeGreaterThan(results[2].relevanceScore);
    });
  });
  
  describe('performVectorSearch', () => {
    it('should call memory service and return ranked results', async () => {
      // Access private method for testing
      const performVectorSearch = (hybridSearch as any).performVectorSearch.bind(hybridSearch);
      
      mockMemoryService.searchMemories.mockResolvedValueOnce(mockMemories);
      
      const results = await performVectorSearch(
        mockQuery,
        mockOrganizationId,
        mockUserId,
        { minVectorSimilarity: 0.6 }
      );
      
      expect(mockMemoryService.searchMemories).toHaveBeenCalledWith(
        mockQuery,
        mockOrganizationId,
        mockUserId
      );
      
      expect(results).toHaveLength(3);
      expect(results[0].vectorScore).toBe(0.85);
      expect(results[1].vectorScore).toBe(0.75);
      expect(results[2].vectorScore).toBe(0.92);
    });
  });
  
  describe('performKeywordSearch', () => {
    it('should perform SQL query and return keyword-matched results', async () => {
      // Access private method for testing
      const performKeywordSearch = (hybridSearch as any).performKeywordSearch.bind(hybridSearch);
      
      // Mock Supabase response
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.or.mockReturnThis();
      mockSupabase.single.mockResolvedValue({
        data: [mockMemories[0], mockMemories[2]],
        error: null
      });
      
      const results = await performKeywordSearch(
        mockQuery,
        mockOrganizationId,
        mockUserId,
        { keywordWeight: 0.3 }
      );
      
      expect(mockSupabase.from).toHaveBeenCalledWith('memories');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      
      // Should have calculated keyword scores
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].keywordScore).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle empty search terms', async () => {
      // Access private method for testing
      const performKeywordSearch = (hybridSearch as any).performKeywordSearch.bind(hybridSearch);
      
      const results = await performKeywordSearch(
        '', // Empty query
        mockOrganizationId,
        mockUserId
      );
      
      expect(results).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
  
  describe('calculateTemporalScore', () => {
    it('should calculate temporal score based on memory age', () => {
      // Access private method for testing
      const calculateTemporalScore = (hybridSearch as any).calculateTemporalScore.bind(hybridSearch);
      
      // Create memories with different creation dates
      const recentMemory = {
        ...mockMemories[0],
        created_at: new Date().toISOString() // Today
      };
      
      const olderMemory = {
        ...mockMemories[1],
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
      };
      
      const veryOldMemory = {
        ...mockMemories[2],
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString() // 180 days ago
      };
      
      const decayFactor = 0.01;
      
      const recentScore = calculateTemporalScore(recentMemory, decayFactor);
      const olderScore = calculateTemporalScore(olderMemory, decayFactor);
      const veryOldScore = calculateTemporalScore(veryOldMemory, decayFactor);
      
      // Recent memory should have higher score
      expect(recentScore).toBeGreaterThan(olderScore);
      expect(olderScore).toBeGreaterThan(veryOldScore);
      
      // Recent memory should be close to 1
      expect(recentScore).toBeCloseTo(1, 1);
    });
  });
  
  describe('combineSearchResults', () => {
    it('should combine vector and keyword results with proper weighting', async () => {
      // Access private method for testing
      const combineSearchResults = (hybridSearch as any).combineSearchResults.bind(hybridSearch);
      
      const vectorResults = [
        { ...mockMemories[0], id: 'mem-1', vectorScore: 0.85, keywordScore: 0, temporalScore: 0, relevanceScore: 0 },
        { ...mockMemories[1], id: 'mem-2', vectorScore: 0.75, keywordScore: 0, temporalScore: 0, relevanceScore: 0 }
      ];
      
      const keywordResults = [
        { ...mockMemories[0], id: 'mem-1', vectorScore: 0, keywordScore: 0.9, temporalScore: 0, relevanceScore: 0 },
        { ...mockMemories[2], id: 'mem-3', vectorScore: 0, keywordScore: 0.8, temporalScore: 0, relevanceScore: 0 }
      ];
      
      const config: HybridSearchConfig = {
        vectorWeight: 0.7,
        keywordWeight: 0.3,
        maxResults: 10,
        minVectorSimilarity: 0.5,
        useTemporalWeighting: true,
        temporalDecayFactor: 0.01
      };
      
      // Mock calculateTemporalScore to return fixed values for testing
      jest.spyOn(hybridSearch as any, 'calculateTemporalScore')
        .mockImplementation((memory) => {
          if (memory.id === 'mem-1') return 0.9;
          if (memory.id === 'mem-2') return 0.8;
          if (memory.id === 'mem-3') return 0.7;
          return 0.5;
        });
      
      const results = await combineSearchResults(
        vectorResults,
        keywordResults,
        config,
        mockOrganizationId
      );
      
      expect(results).toHaveLength(3); // All unique memories
      
      // Check that scores were combined correctly
      const mem1 = results.find(m => m.id === 'mem-1');
      const mem2 = results.find(m => m.id === 'mem-2');
      const mem3 = results.find(m => m.id === 'mem-3');
      
      expect(mem1).toBeDefined();
      expect(mem2).toBeDefined();
      expect(mem3).toBeDefined();
      
      if (mem1 && mem2 && mem3) {
        // mem1 has both vector and keyword scores
        expect(mem1.vectorScore).toBe(0.85);
        expect(mem1.keywordScore).toBe(0.9);
        expect(mem1.temporalScore).toBe(0.9);
        
        // Weighted score: (0.85 * 0.7 + 0.9 * 0.3) * 0.9 = 0.5355 + 0.243 = 0.7785
        expect(mem1.relevanceScore).toBeCloseTo(0.7785, 4);
        
        // mem2 has only vector score
        expect(mem2.vectorScore).toBe(0.75);
        expect(mem2.keywordScore).toBe(0);
        
        // mem3 has only keyword score
        expect(mem3.vectorScore).toBe(0);
        expect(mem3.keywordScore).toBe(0.8);
      }
      
      // Results should be sorted by relevance score
      expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1].relevanceScore);
      expect(results[1].relevanceScore).toBeGreaterThanOrEqual(results[2].relevanceScore);
    });
    
    it('should filter results by minimum similarity threshold', async () => {
      // Access private method for testing
      const combineSearchResults = (hybridSearch as any).combineSearchResults.bind(hybridSearch);
      
      const vectorResults = [
        { ...mockMemories[0], vectorScore: 0.85, keywordScore: 0, temporalScore: 0, relevanceScore: 0 },
        { ...mockMemories[1], vectorScore: 0.45, keywordScore: 0, temporalScore: 0, relevanceScore: 0 } // Below threshold
      ];
      
      const keywordResults = [
        { ...mockMemories[0], vectorScore: 0, keywordScore: 0.9, temporalScore: 0, relevanceScore: 0 }
      ];
      
      const config: HybridSearchConfig = {
        vectorWeight: 0.7,
        keywordWeight: 0.3,
        maxResults: 10,
        minVectorSimilarity: 0.6, // Set threshold to 0.6
        useTemporalWeighting: false, // Disable temporal weighting for this test
        temporalDecayFactor: 0
      };
      
      const results = await combineSearchResults(
        vectorResults,
        keywordResults,
        config,
        mockOrganizationId
      );
      
      // Should only include memories with relevance score >= 0.6
      expect(results.every(m => m.relevanceScore >= 0.6)).toBe(true);
    });
  });
  
  describe('findRelatedMemories', () => {
    it('should find explicitly and semantically related memories', async () => {
      // Mock source memory
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: mockMemories[0],
        error: null
      });
      
      // Mock relationships
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.or.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: [
          {
            id: 'rel-1',
            source_memory_id: 'mem-1',
            target_memory_id: 'mem-3',
            relationship_type: 'related_to',
            organization_id: mockOrganizationId,
            created_at: '2023-06-16T10:00:00Z',
            source_memory: mockMemories[0],
            target_memory: mockMemories[2]
          }
        ],
        error: null
      });
      
      // Mock search method to return semantic matches
      const searchSpy = jest.spyOn(hybridSearch, 'search');
      searchSpy.mockResolvedValueOnce([
        { 
          ...mockMemories[1], 
          vectorScore: 0.8, 
          keywordScore: 0.7, 
          temporalScore: 0.9, 
          relevanceScore: 0.8 
        }
      ]);
      
      const results = await hybridSearch.findRelatedMemories(
        'mem-1',
        mockOrganizationId,
        mockUserId
      );
      
      expect(mockSupabase.from).toHaveBeenCalledWith('memories');
      expect(searchSpy).toHaveBeenCalledWith(
        mockMemories[0].content,
        mockOrganizationId,
        mockUserId
      );
      
      // Should combine explicit and semantic relationships
      expect(results.length).toBeGreaterThan(0);
      
      // Results should be sorted by relevance
      if (results.length > 1) {
        expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1].relevanceScore);
      }
    });
    
    it('should handle errors when fetching source memory', async () => {
      // Mock error when fetching source memory
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Memory not found')
      });
      
      const results = await hybridSearch.findRelatedMemories(
        'non-existent-id',
        mockOrganizationId,
        mockUserId
      );
      
      expect(results).toEqual([]);
    });
  });
});

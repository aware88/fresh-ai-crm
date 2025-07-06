import { MemoryChainService, MemoryRelationshipType } from '../../../../src/lib/ai/memory/memory-chain-service';
import { MemoryService } from '../../../../src/lib/ai/memory/memory-service';
import { HybridMemorySearch } from '../../../../src/lib/ai/memory/hybrid-memory-search';
import { OpenAIEmbeddings } from '../../../../src/lib/ai/memory/embeddings/openai-embeddings';
import { AIMemory, AIMemoryType } from '../../../../src/lib/ai/memory/ai-memory-service';
import { OpenAI } from 'openai';

// Mock dependencies
jest.mock('../../../../src/lib/ai/memory/memory-service');
jest.mock('../../../../src/lib/ai/memory/hybrid-memory-search');
jest.mock('../../../../src/lib/ai/memory/embeddings/openai-embeddings');
jest.mock('openai');

describe('MemoryChainService', () => {
  // Mock data
  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-456';
  const mockQuery = 'customer billing history';
  const mockOpenAIKey = 'sk-test-key';
  
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
  
  // Mock relationships
  const mockRelationships = [
    {
      id: 'rel-1',
      source_memory_id: 'mem-1',
      target_memory_id: 'mem-2',
      relationship_type: MemoryRelationshipType.RELATED_TO,
      organization_id: mockOrganizationId,
      created_at: '2023-06-16T10:00:00Z'
    }
  ];
  
  // Mock memories with relationships
  const mockMemoriesWithRelationships = mockMemories.map((memory, index) => ({
    ...memory,
    relationships: index === 0 ? mockRelationships : []
  }));
  
  // Mock OpenAI response for chain generation
  const mockOpenAIResponse = {
    choices: [
      {
        message: {
          content: JSON.stringify([
            {
              name: "Billing Issue Chain",
              memory_ids: ["mem-1", "mem-3", "mem-2"],
              reasoning: "This chain connects the customer's billing issue with the system update that caused invoice delays, and the customer's preference for email communication about billing matters.",
              confidence: 0.85
            }
          ])
        }
      }
    ]
  };
  
  // Mock services
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  } as any;
  
  const mockMemoryService = {} as jest.Mocked<MemoryService>;
  
  const mockSearchService = {
    search: jest.fn().mockResolvedValue(mockMemories.map(memory => ({
      ...memory,
      vectorScore: 0.8,
      keywordScore: 0.7,
      temporalScore: 0.9,
      relevanceScore: 0.8
    })))
  } as jest.Mocked<HybridMemorySearch>;
  
  const mockEmbeddings = {} as jest.Mocked<OpenAIEmbeddings>;
  
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue(mockOpenAIResponse)
      }
    }
  };
  
  // System under test
  let chainService: MemoryChainService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock OpenAI constructor
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI as any);
    
    chainService = new MemoryChainService(
      mockSupabase,
      mockMemoryService,
      mockSearchService,
      mockEmbeddings,
      mockOpenAIKey
    );
  });
  
  describe('getConfigForOrganization', () => {
    it('should return the default config', async () => {
      const config = await chainService.getConfigForOrganization(mockOrganizationId);
      
      expect(config).toBeDefined();
      expect(config.maxChainLength).toBeDefined();
      expect(config.minConfidenceThreshold).toBeDefined();
      expect(config.maxChainsToGenerate).toBeDefined();
    });
  });
  
  describe('createMemoryChains', () => {
    it('should create memory chains based on relevant memories', async () => {
      // Mock search service to return relevant memories
      mockSearchService.search.mockResolvedValueOnce(mockMemories.map(memory => ({
        ...memory,
        vectorScore: 0.8,
        keywordScore: 0.7,
        temporalScore: 0.9,
        relevanceScore: 0.8
      })));
      
      // Mock getMemoriesWithRelationships
      jest.spyOn(chainService as any, 'getMemoriesWithRelationships')
        .mockResolvedValueOnce(mockMemoriesWithRelationships);
      
      // Mock generateChains
      jest.spyOn(chainService as any, 'generateChains')
        .mockImplementation(async (memories, query, config) => {
          return [
            {
              id: 'chain-1',
              name: 'Billing Issue Chain',
              memories: memories.slice(0, 3),
              reasoning: 'This chain connects the customer\'s billing issue with the system update that caused invoice delays.',
              confidence: 0.85,
              created_at: new Date().toISOString()
            }
          ];
        });
      
      const chains = await chainService.createMemoryChains(
        mockQuery,
        mockOrganizationId,
        mockUserId
      );
      
      expect(mockSearchService.search).toHaveBeenCalledWith(
        mockQuery,
        mockOrganizationId,
        mockUserId
      );
      
      expect(chains).toHaveLength(1);
      expect(chains[0].name).toBe('Billing Issue Chain');
      expect(chains[0].memories).toHaveLength(3);
      expect(chains[0].confidence).toBe(0.85);
    });
    
    it('should return empty array if not enough relevant memories', async () => {
      // Mock search service to return only one memory
      mockSearchService.search.mockResolvedValueOnce([
        {
          ...mockMemories[0],
          vectorScore: 0.8,
          keywordScore: 0.7,
          temporalScore: 0.9,
          relevanceScore: 0.8
        }
      ]);
      
      const chains = await chainService.createMemoryChains(
        mockQuery,
        mockOrganizationId,
        mockUserId
      );
      
      expect(chains).toEqual([]);
    });
  });
  
  describe('getMemoriesWithRelationships', () => {
    it('should fetch memories and their relationships', async () => {
      // Access private method for testing
      const getMemoriesWithRelationships = (chainService as any).getMemoriesWithRelationships.bind(chainService);
      
      // Mock Supabase responses
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.in.mockReturnThis();
      mockSupabase.or.mockReturnThis();
      
      // Mock memories response
      mockSupabase.select.mockResolvedValueOnce({
        data: mockMemories,
        error: null
      });
      
      // Mock relationships response
      mockSupabase.select.mockResolvedValueOnce({
        data: mockRelationships,
        error: null
      });
      
      const memoryIds = mockMemories.map(m => m.id);
      const result = await getMemoriesWithRelationships(memoryIds, mockOrganizationId);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('memories');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockSupabase.in).toHaveBeenCalledWith('id', memoryIds);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('memory_relationships');
      
      expect(result).toHaveLength(mockMemories.length);
      expect(result[0]).toHaveProperty('relationships');
    });
    
    it('should handle empty memory IDs array', async () => {
      // Access private method for testing
      const getMemoriesWithRelationships = (chainService as any).getMemoriesWithRelationships.bind(chainService);
      
      const result = await getMemoriesWithRelationships([], mockOrganizationId);
      
      expect(result).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
    
    it('should handle error when fetching memories', async () => {
      // Access private method for testing
      const getMemoriesWithRelationships = (chainService as any).getMemoriesWithRelationships.bind(chainService);
      
      // Mock Supabase error response
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.in.mockReturnThis();
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      });
      
      const memoryIds = mockMemories.map(m => m.id);
      const result = await getMemoriesWithRelationships(memoryIds, mockOrganizationId);
      
      expect(result).toEqual([]);
    });
  });
  
  describe('generateChains', () => {
    it('should generate chains using OpenAI', async () => {
      // Access private method for testing
      const generateChains = (chainService as any).generateChains.bind(chainService);
      
      const result = await generateChains(
        mockMemoriesWithRelationships,
        mockQuery,
        { maxChainLength: 5, minConfidenceThreshold: 0.7, maxChainsToGenerate: 3 },
        mockOrganizationId,
        mockUserId
      );
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Billing Issue Chain');
      expect(result[0].memories).toHaveLength(3);
      expect(result[0].confidence).toBe(0.85);
    });
    
    it('should handle OpenAI errors', async () => {
      // Access private method for testing
      const generateChains = (chainService as any).generateChains.bind(chainService);
      
      // Mock OpenAI error
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API error'));
      
      const result = await generateChains(
        mockMemoriesWithRelationships,
        mockQuery,
        { maxChainLength: 5, minConfidenceThreshold: 0.7, maxChainsToGenerate: 3 },
        mockOrganizationId,
        mockUserId
      );
      
      expect(result).toEqual([]);
    });
    
    it('should handle invalid JSON response', async () => {
      // Access private method for testing
      const generateChains = (chainService as any).generateChains.bind(chainService);
      
      // Mock invalid JSON response
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'This is not valid JSON'
            }
          }
        ]
      });
      
      const result = await generateChains(
        mockMemoriesWithRelationships,
        mockQuery,
        { maxChainLength: 5, minConfidenceThreshold: 0.7, maxChainsToGenerate: 3 },
        mockOrganizationId,
        mockUserId
      );
      
      expect(result).toEqual([]);
    });
  });
  
  describe('findContradictions', () => {
    it('should identify contradictions between memories', async () => {
      // Mock OpenAI response for contradictions
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  memory1_id: 'mem-1',
                  memory2_id: 'mem-3',
                  explanation: 'The customer reported billing issues but the system update suggests there were delays that might explain the issue.',
                  confidence: 0.75
                }
              ])
            }
          }
        ]
      });
      
      const contradictions = await chainService.findContradictions(
        mockMemories,
        mockOrganizationId
      );
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(contradictions).toHaveLength(1);
      expect(contradictions[0].memory1.id).toBe('mem-1');
      expect(contradictions[0].memory2.id).toBe('mem-3');
      expect(contradictions[0].confidence).toBe(0.75);
    });
    
    it('should handle empty memories array', async () => {
      const contradictions = await chainService.findContradictions(
        [],
        mockOrganizationId
      );
      
      expect(contradictions).toEqual([]);
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    });
  });
  
  describe('createRelationship', () => {
    it('should create a new relationship between memories', async () => {
      // Mock checking for existing relationship
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      });
      
      // Mock creating new relationship
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'new-rel-1',
          source_memory_id: 'mem-1',
          target_memory_id: 'mem-3',
          relationship_type: MemoryRelationshipType.FOLLOWS,
          organization_id: mockOrganizationId,
          user_id: mockUserId,
          created_at: new Date().toISOString(),
          metadata: { test: true }
        },
        error: null
      });
      
      const result = await chainService.createRelationship(
        'mem-1',
        'mem-3',
        MemoryRelationshipType.FOLLOWS,
        mockOrganizationId,
        mockUserId,
        { test: true }
      );
      
      expect(mockSupabase.from).toHaveBeenCalledWith('memory_relationships');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.source_memory_id).toBe('mem-1');
      expect(result?.target_memory_id).toBe('mem-3');
    });
    
    it('should update an existing relationship', async () => {
      // Mock finding existing relationship
      const existingRelationship = {
        id: 'existing-rel-1',
        source_memory_id: 'mem-1',
        target_memory_id: 'mem-3',
        relationship_type: MemoryRelationshipType.RELATED_TO,
        organization_id: mockOrganizationId,
        user_id: mockUserId,
        created_at: new Date().toISOString(),
        metadata: { old: true }
      };
      
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: existingRelationship,
        error: null
      });
      
      // Mock updating relationship
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ...existingRelationship,
          relationship_type: MemoryRelationshipType.FOLLOWS,
          metadata: { old: true, new: true }
        },
        error: null
      });
      
      const result = await chainService.createRelationship(
        'mem-1',
        'mem-3',
        MemoryRelationshipType.FOLLOWS,
        mockOrganizationId,
        mockUserId,
        { new: true }
      );
      
      expect(mockSupabase.from).toHaveBeenCalledWith('memory_relationships');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.relationship_type).toBe(MemoryRelationshipType.FOLLOWS);
    });
    
    it('should handle errors when creating relationships', async () => {
      // Mock checking for existing relationship
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      });
      
      // Mock error when creating relationship
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      });
      
      const result = await chainService.createRelationship(
        'mem-1',
        'mem-3',
        MemoryRelationshipType.FOLLOWS,
        mockOrganizationId,
        mockUserId
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('storeMemoryChain', () => {
    it('should store a memory chain and create relationships', async () => {
      // Mock chain to store
      const chain = {
        id: 'chain-1',
        name: 'Test Chain',
        memories: mockMemories,
        reasoning: 'This is a test chain',
        confidence: 0.8,
        created_at: new Date().toISOString()
      };
      
      // Mock createRelationship method
      jest.spyOn(chainService, 'createRelationship')
        .mockResolvedValue({
          id: 'rel-test',
          source_memory_id: 'mem-1',
          target_memory_id: 'mem-2',
          relationship_type: MemoryRelationshipType.FOLLOWS,
          organization_id: mockOrganizationId,
          created_at: new Date().toISOString()
        });
      
      // Mock storing insight memory
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'insight-1' },
        error: null
      });
      
      const result = await chainService.storeMemoryChain(
        chain,
        mockOrganizationId,
        mockUserId
      );
      
      expect(chainService.createRelationship).toHaveBeenCalledTimes(mockMemories.length + (mockMemories.length - 1));
      expect(mockSupabase.from).toHaveBeenCalledWith('memories');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(result).toBe('chain-1');
    });
    
    it('should handle errors when storing insight memory', async () => {
      // Mock chain to store
      const chain = {
        id: 'chain-1',
        name: 'Test Chain',
        memories: mockMemories,
        reasoning: 'This is a test chain',
        confidence: 0.8,
        created_at: new Date().toISOString()
      };
      
      // Mock createRelationship method
      jest.spyOn(chainService, 'createRelationship')
        .mockResolvedValue({
          id: 'rel-test',
          source_memory_id: 'mem-1',
          target_memory_id: 'mem-2',
          relationship_type: MemoryRelationshipType.FOLLOWS,
          organization_id: mockOrganizationId,
          created_at: new Date().toISOString()
        });
      
      // Mock error when storing insight memory
      mockSupabase.from.mockReturnThis();
      mockSupabase.insert.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      });
      
      const result = await chainService.storeMemoryChain(
        chain,
        mockOrganizationId,
        mockUserId
      );
      
      expect(result).toBeNull();
    });
  });
});

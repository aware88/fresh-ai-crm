import { MemorySummarizationService } from '../memory-summarization-service';
import { MemoryService } from '../memory-service';
import { AIMemory, AIMemoryType } from '../ai-memory-service';
import { OpenAIEmbeddings } from '../../embeddings/openai-embeddings';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('../../embeddings/openai-embeddings');
jest.mock('../memory-service');
jest.mock('uuid');

describe('MemorySummarizationService', () => {
  let service: MemorySummarizationService;
  let mockSupabase: any;
  let mockMemoryService: jest.Mocked<MemoryService>;
  let mockOpenAIEmbeddings: jest.Mocked<OpenAIEmbeddings>;
  
  const mockApiKey = 'test-api-key';
  const mockOrgId = 'org-123';
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock UUID
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid');
    
    // Setup mock Supabase
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis()
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    
    // Setup mock OpenAIEmbeddings
    mockOpenAIEmbeddings = new OpenAIEmbeddings(mockApiKey) as jest.Mocked<OpenAIEmbeddings>;
    
    // Setup mock MemoryService
    mockMemoryService = new MemoryService(mockSupabase, mockOpenAIEmbeddings) as jest.Mocked<MemoryService>;
    
    // Create service instance with mocks
    service = new MemorySummarizationService(mockSupabase, mockApiKey, mockMemoryService);
  });
  
  describe('getConfigForOrganization', () => {
    it('should return default config when no subscription is found', async () => {
      // Mock Supabase response for no subscription
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No subscription found' }
      });
      
      const config = await service.getConfigForOrganization(mockOrgId);
      
      expect(config).toEqual(expect.objectContaining({
        maxMemoriesPerSummary: 10,
        minMemoriesForSummary: 3,
        summarizationThreshold: 0.8
      }));
      
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_subscriptions');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', mockOrgId);
    });
    
    it('should return config based on subscription plan', async () => {
      // Mock Supabase responses for subscription and plan
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_plan_id: 'plan-123' },
        error: null
      }).mockResolvedValueOnce({
        data: {
          features: {
            memory_summarization: {
              max_memories_per_summary: 20,
              min_memories_for_summary: 5,
              summarization_threshold: 0.75
            },
            subscription_tier: 'pro'
          }
        },
        error: null
      });
      
      const config = await service.getConfigForOrganization(mockOrgId);
      
      expect(config).toEqual(expect.objectContaining({
        maxMemoriesPerSummary: 20,
        minMemoriesForSummary: 5,
        summarizationThreshold: 0.75,
        subscriptionTier: 'pro'
      }));
    });
  });
  
  describe('clusterMemoriesByType', () => {
    it('should group memories by type', () => {
      const memories: AIMemory[] = [
        {
          id: '1',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 1',
          memory_type: AIMemoryType.OBSERVATION,
          importance_score: 0.7,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          content_embedding: [],
          metadata: {}
        },
        {
          id: '2',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 2',
          memory_type: AIMemoryType.DECISION,
          importance_score: 0.8,
          created_at: '2023-01-02',
          updated_at: '2023-01-02',
          content_embedding: [],
          metadata: {}
        },
        {
          id: '3',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 3',
          memory_type: AIMemoryType.OBSERVATION,
          importance_score: 0.6,
          created_at: '2023-01-03',
          updated_at: '2023-01-03',
          content_embedding: [],
          metadata: {}
        }
      ];
      
      const clusters = service.clusterMemoriesByType(memories);
      
      expect(clusters[AIMemoryType.OBSERVATION]).toHaveLength(2);
      expect(clusters[AIMemoryType.DECISION]).toHaveLength(1);
      expect(clusters[AIMemoryType.OBSERVATION][0].id).toBe('1');
      expect(clusters[AIMemoryType.OBSERVATION][1].id).toBe('3');
      expect(clusters[AIMemoryType.DECISION][0].id).toBe('2');
    });
  });
  
  describe('calculateCosineSimilarity', () => {
    it('should calculate cosine similarity between two vectors', () => {
      const vec1 = [1, 0, 1];
      const vec2 = [0, 1, 1];
      
      const similarity = service.calculateCosineSimilarity(vec1, vec2);
      
      // Expected: dot(vec1, vec2) / (|vec1| * |vec2|) = 1 / (√2 * √2) = 0.5
      expect(similarity).toBeCloseTo(0.5);
    });
    
    it('should throw error for vectors with different dimensions', () => {
      const vec1 = [1, 0, 1];
      const vec2 = [0, 1];
      
      expect(() => service.calculateCosineSimilarity(vec1, vec2)).toThrow('Vectors must have the same dimensions');
    });
  });
  
  describe('calculateCentroid', () => {
    it('should calculate the centroid of multiple vectors', () => {
      const vectors = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];
      
      const centroid = service.calculateCentroid(vectors);
      
      // Expected: [4, 5, 6] (average of all vectors)
      expect(centroid).toEqual([4, 5, 6]);
    });
    
    it('should return a single vector as its own centroid', () => {
      const vectors = [[1, 2, 3]];
      
      const centroid = service.calculateCentroid(vectors);
      
      expect(centroid).toEqual([1, 2, 3]);
    });
    
    it('should throw an error for empty input', () => {
      expect(() => {
        service.calculateCentroid([]);
      }).toThrow('Cannot calculate centroid of empty embeddings set');
    });
  });
  
  describe('clusterMemoriesBySimilarity', () => {
    it('should cluster memories based on embedding similarity', async () => {
      const memories: AIMemory[] = [
        {
          id: '1',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 1',
          memory_type: AIMemoryType.OBSERVATION,
          importance_score: 0.7,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          content_embedding: [1, 0, 1],
          metadata: {}
        },
        {
          id: '2',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 2',
          memory_type: AIMemoryType.OBSERVATION,
          importance_score: 0.8,
          created_at: '2023-01-02',
          updated_at: '2023-01-02',
          content_embedding: [0, 1, 1],
          metadata: {}
        },
        {
          id: '3',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 3',
          memory_type: AIMemoryType.OBSERVATION,
          importance_score: 0.6,
          created_at: '2023-01-03',
          updated_at: '2023-01-03',
          content_embedding: [1, 1, 0],
          metadata: {}
        }
      ];
      
      // Mock calculateCosineSimilarity to return specific values for testing
      jest.spyOn(service, 'calculateCosineSimilarity').mockImplementation((vec1, vec2) => {
        // Memory 1 and Memory 2 have similarity 0.5
        if ((vec1 === memories[0].content_embedding && vec2 === memories[1].content_embedding) ||
            (vec1 === memories[1].content_embedding && vec2 === memories[0].content_embedding)) {
          return 0.5;
        }
        // Memory 1 and Memory 3 have similarity 0.5
        if ((vec1 === memories[0].content_embedding && vec2 === memories[2].content_embedding) ||
            (vec1 === memories[2].content_embedding && vec2 === memories[0].content_embedding)) {
          return 0.5;
        }
        // Memory 2 and Memory 3 have similarity 0.5
        if ((vec1 === memories[1].content_embedding && vec2 === memories[2].content_embedding) ||
            (vec1 === memories[2].content_embedding && vec2 === memories[1].content_embedding)) {
          return 0.5;
        }
        return 0;
      });
      
      // With threshold 0.4, all memories should be in one cluster
      const clusters1 = await service.clusterMemoriesBySimilarity(memories, 0.4);
      expect(clusters1.length).toBe(1);
      expect(clusters1[0].length).toBe(3);
      
      // With threshold 0.6, each memory should be in its own cluster
      const clusters2 = await service.clusterMemoriesBySimilarity(memories, 0.6);
      expect(clusters2.length).toBe(3);
      expect(clusters2[0].length).toBe(1);
      expect(clusters2[1].length).toBe(1);
      expect(clusters2[2].length).toBe(1);
    });
    
    it('should handle memories without embeddings', async () => {
      const memories: AIMemory[] = [
        {
          id: '1',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 1',
          memory_type: AIMemoryType.OBSERVATION,
          importance_score: 0.7,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          content_embedding: [1, 0, 1],
          metadata: {}
        },
        {
          id: '2',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 2',
          memory_type: AIMemoryType.OBSERVATION,
          importance_score: 0.8,
          created_at: '2023-01-02',
          updated_at: '2023-01-02',
          // No embedding
          metadata: {}
        }
      ];
      
      const clusters = await service.clusterMemoriesBySimilarity(memories);
      
      // Only one cluster with the memory that has an embedding
      expect(clusters.length).toBe(1);
      expect(clusters[0].length).toBe(1);
      expect(clusters[0][0].id).toBe('1');
    });
  });
  
  describe('generateSummary', () => {
    it('should generate a summary using OpenAI', async () => {
      // Mock OpenAI client response
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'This is a test summary'
                }
              }]
            })
          }
        }
      };
      
      // @ts-ignore - Replace private OpenAI client
      service.openai = mockOpenAI;
      
      const contents = ['Memory content 1', 'Memory content 2'];
      const summary = await service['generateSummary'](contents, AIMemoryType.OBSERVATION, 100);
      
      expect(summary).toBe('This is a test summary');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });
    
    it('should handle errors during summary generation', async () => {
      // Mock OpenAI client to throw an error
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API error'))
          }
        }
      };
      
      // @ts-ignore - Replace private OpenAI client
      service.openai = mockOpenAI;
      
      const contents = ['Memory content 1', 'Memory content 2'];
      const summary = await service['generateSummary'](contents, AIMemoryType.OBSERVATION, 100);
      
      expect(summary).toBeNull();
    });
  });
  
  describe('storeSummaryAsMemory', () => {
    it('should store a summary as a new memory with relationships', async () => {
      // Mock Supabase insert to return the stored summary
      const storedSummary = {
        id: 'summary-id',
        organization_id: mockOrgId,
        user_id: mockUserId,
        content: 'Test summary',
        memory_type: AIMemoryType.OBSERVATION,
        importance_score: 0.8,
        created_at: '2023-01-04',
        updated_at: '2023-01-04',
        content_embedding: [],
        metadata: {
          is_summary: true,
          summarized_count: 2,
          original_memory_ids: ['1', '2']
        }
      };
      
      // Reset mock to ensure proper chaining
      mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis()
      };
      
      // Mock the from method to return the mock Supabase client
      mockSupabase.from.mockImplementation((tableName: string) => {
        // Store the table name for verification
        mockSupabase.lastTableName = tableName;
        return mockSupabase;
      });
      
      // Mock the insert method to return the mock Supabase client
      mockSupabase.insert.mockReturnValue(mockSupabase);
      
      // Mock the select method to return the mock Supabase client
      mockSupabase.select.mockReturnValue(mockSupabase);
      
      // Mock the single method to return the stored summary
      mockSupabase.single.mockResolvedValue({ data: storedSummary, error: null });
      
      // Mock the update method to return a successful response
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      
      // Create a new service instance with the updated mock
      service = new MemorySummarizationService(mockSupabase, mockApiKey, mockMemoryService);
      
      const originalMemories: AIMemory[] = [
        {
          id: '1',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 1',
          memory_type: AIMemoryType.OBSERVATION,
          importance_score: 0.7,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          content_embedding: [],
          metadata: {}
        },
        {
          id: '2',
          organization_id: mockOrgId,
          user_id: mockUserId,
          content: 'Memory 2',
          memory_type: AIMemoryType.OBSERVATION,
          importance_score: 0.8,
          created_at: '2023-01-02',
          updated_at: '2023-01-02',
          content_embedding: [],
          metadata: {}
        }
      ];
      
      // Create a summary memory object as per the method signature
      const summaryMemory: AIMemory = {
        id: 'mock-uuid', // This will be replaced by the mock UUID
        organization_id: mockOrgId,
        user_id: mockUserId,
        content: 'Test summary',
        memory_type: AIMemoryType.OBSERVATION,
        importance_score: 0.8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        content_embedding: [],
        metadata: {
          is_summary: true,
          summarized_count: originalMemories.length,
          original_memory_ids: originalMemories.map(m => m.id)
        }
      };
      
      const result = await service.storeSummaryAsMemory(summaryMemory, originalMemories, mockOrgId, mockUserId);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('summary-id');
      expect(result?.content).toBe('Test summary');
      expect(result?.metadata?.is_summary).toBe(true);
      expect(result?.metadata?.original_memory_ids).toEqual(['1', '2']);
      
      // Verify the correct table name was used
      expect(mockSupabase.from).toHaveBeenCalledWith('memories');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();
      
      // Verify the memory relationships were created
      expect(mockSupabase.from).toHaveBeenCalledWith('memory_relationships');
      
      // Verify the original memories were updated
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', mockOrgId);
    });
  });
});

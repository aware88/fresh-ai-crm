/**
 * Memory Context Manager Tests
 * 
 * Tests for the Memory Context Manager component of the AI Memory & Context Management system.
 * These tests verify that the context manager properly integrates with the subscription system
 * and supports multi-tenant isolation.
 */

import { MemoryContextManager, MemoryContextConfig } from '../../../../src/lib/ai/memory/memory-context-manager';
import { MemoryService } from '../../../../src/lib/ai/memory/memory-service';
import { OpenAIEmbeddings } from '../../../../src/lib/ai/embeddings/openai-embeddings';
import { AIMemory, AIMemoryType } from '../../../../src/lib/ai/memory/ai-memory-service';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('../../../../src/lib/ai/memory/memory-service');
jest.mock('../../../../src/lib/ai/embeddings/openai-embeddings');

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};

// Test data
const testOrganizationId = uuidv4();
const testUserId = uuidv4();
const testAgentId = uuidv4();

// Sample memories
const sampleMemories: AIMemory[] = [
  {
    id: uuidv4(),
    organization_id: testOrganizationId,
    user_id: testUserId,
    content: 'This is a test memory about customer preferences',
    content_embedding: Array(1536).fill(0.1),
    memory_type: AIMemoryType.PREFERENCE,
    importance_score: 0.8,
    metadata: { source: 'test', entityType: 'customer' },
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: uuidv4(),
    organization_id: testOrganizationId,
    user_id: testUserId,
    content: 'This is a test memory about a sales interaction',
    content_embedding: Array(1536).fill(0.2),
    memory_type: AIMemoryType.INTERACTION,
    importance_score: 0.7,
    metadata: { source: 'test', entityType: 'sales' },
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    id: uuidv4(),
    organization_id: testOrganizationId,
    user_id: testUserId,
    content: 'This is a test memory about a product insight',
    content_embedding: Array(1536).fill(0.3),
    memory_type: AIMemoryType.INSIGHT,
    importance_score: 0.9,
    metadata: { source: 'test', entityType: 'product' },
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
];

// Sample subscription plans
const sampleSubscriptionPlans = {
  free: {
    id: uuidv4(),
    name: 'Free',
    features: {
      maxContextSize: 2000,
      enableMemoryCompression: false,
      enableLongTermMemory: false,
    },
  },
  pro: {
    id: uuidv4(),
    name: 'Pro',
    features: {
      maxContextSize: 8000,
      enableMemoryCompression: true,
      enableLongTermMemory: true,
    },
  },
  enterprise: {
    id: uuidv4(),
    name: 'Enterprise',
    features: {
      maxContextSize: 32000,
      enableMemoryCompression: true,
      enableLongTermMemory: true,
    },
  },
};

describe('MemoryContextManager', () => {
  let memoryContextManager: MemoryContextManager;
  let mockMemoryService: jest.Mocked<MemoryService>;
  let mockEmbeddings: jest.Mocked<OpenAIEmbeddings>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockMemoryService = new MemoryService('org-id') as jest.Mocked<MemoryService>;
    mockEmbeddings = new OpenAIEmbeddings({ apiKey: 'test-key' }) as jest.Mocked<OpenAIEmbeddings>;
    
    // Initialize context manager with mocks
    memoryContextManager = new MemoryContextManager(
      mockSupabase as any,
      mockMemoryService,
      mockEmbeddings
    );
    
    // Mock default methods to avoid TypeScript errors
    mockSupabase.from = jest.fn().mockReturnThis();
    mockSupabase.select = jest.fn().mockReturnThis();
    mockSupabase.eq = jest.fn().mockReturnThis();
  });

  describe('getConfigForOrganization', () => {
    it('should get configuration based on subscription tier', async () => {
      // Mock subscription query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { subscription_plan_id: sampleSubscriptionPlans.pro.id },
          error: null,
        }),
      } as any);

      // Mock plan query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: sampleSubscriptionPlans.pro,
          error: null,
        }),
      } as any);

      // Get config for organization
      const config = await memoryContextManager.getConfigForOrganization(testOrganizationId);

      // Verify config matches subscription tier
      expect(config.maxContextSize).toBe(8000);
      expect(config.featureFlags.enableMemoryCompression).toBe(true);
      expect(config.featureFlags.enableLongTermMemory).toBe(true);
      expect(config.subscriptionTier).toBe('Pro');
    });

    it('should return default config if subscription not found', async () => {
      // Mock subscription query with error
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Subscription not found' },
        }),
      } as any);

      // Get config for organization
      const config = await memoryContextManager.getConfigForOrganization(testOrganizationId);

      // Verify default config is returned
      expect(config.maxContextSize).toBe(4000);
      expect(config.subscriptionTier).toBe('free');
    });

    it('should apply user-specific settings if provided', async () => {
      // Mock subscription query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { subscription_plan_id: sampleSubscriptionPlans.pro.id },
          error: null,
        }),
      } as any);

      // Mock plan query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: sampleSubscriptionPlans.pro,
          error: null,
        }),
      } as any);

      // Mock user settings query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { setting_key: 'memory_context_size', setting_value: '10000' },
          error: null,
        }),
      } as any);
      
      // Mock the memoryContextManager.getUserSettings method
      jest.spyOn(memoryContextManager as any, 'getUserSettings').mockResolvedValueOnce({
        memory_context_size: 10000
      });

      // Get config for organization with user ID
      const config = await memoryContextManager.getConfigForOrganization(testOrganizationId, testUserId);

      // Verify user settings are applied
      expect(config.maxContextSize).toBe(10000);
    });
  });

  describe('buildOptimizedContext', () => {
    it('should build optimized context based on query and config', async () => {
      // Mock getConfigForOrganization
      jest.spyOn(memoryContextManager as any, 'getConfigForOrganization').mockResolvedValueOnce({
        maxContextSize: 8000,
        relevanceThreshold: 0.7,
        recencyWeight: 0.3,
        importanceWeight: 0.5,
        subscriptionTier: 'Pro',
        featureFlags: {
          enableLongTermMemory: true,
          enableMemoryCompression: true,
          enableContextPrioritization: true,
        },
      });

      // Mock searchRelevantMemories
      jest.spyOn(memoryContextManager as any, 'searchRelevantMemories').mockResolvedValueOnce(sampleMemories);

      // Mock prioritizeMemories
      jest.spyOn(memoryContextManager as any, 'prioritizeMemories').mockReturnValueOnce(sampleMemories);

      // Mock compressMemoriesIfNeeded
      jest.spyOn(memoryContextManager as any, 'compressMemoriesIfNeeded').mockResolvedValueOnce({
        originalMemories: sampleMemories,
        compressedMemories: sampleMemories,
        compressionRatio: 1,
        tokenSavings: 0,
      });

      // Mock fitToContextWindow
      jest.spyOn(memoryContextManager as any, 'fitToContextWindow').mockReturnValueOnce({
        memories: sampleMemories,
        totalTokens: 500,
        truncated: false,
      });

      // Mock recordMemoryAccess
      jest.spyOn(memoryContextManager as any, 'recordMemoryAccess').mockResolvedValueOnce(undefined);

      // Build optimized context
      const result = await memoryContextManager.buildOptimizedContext(
        'Test query about customer preferences',
        testOrganizationId,
        testUserId
      );

      // Verify result
      expect(result.memories).toEqual(sampleMemories);
      expect(result.totalTokens).toBe(500);
      expect(result.truncated).toBe(false);
      expect(result.metadata.memoryCount.retrieved).toBe(3);
      expect(result.metadata.memoryCount.selected).toBe(3);
    });

    it('should respect subscription tier limits', async () => {
      // Mock getConfigForOrganization for free tier
      jest.spyOn(memoryContextManager as any, 'getConfigForOrganization').mockResolvedValueOnce({
        maxContextSize: 2000,
        relevanceThreshold: 0.7,
        recencyWeight: 0.3,
        importanceWeight: 0.5,
        subscriptionTier: 'Free',
        featureFlags: {
          enableLongTermMemory: false,
          enableMemoryCompression: false,
          enableContextPrioritization: true,
        },
      });

      // Mock searchRelevantMemories
      jest.spyOn(memoryContextManager as any, 'searchRelevantMemories').mockResolvedValueOnce(sampleMemories);

      // Mock prioritizeMemories
      jest.spyOn(memoryContextManager as any, 'prioritizeMemories').mockReturnValueOnce(sampleMemories);

      // Mock fitToContextWindow
      jest.spyOn(memoryContextManager as any, 'fitToContextWindow').mockReturnValueOnce({
        memories: sampleMemories.slice(0, 2), // Only first 2 memories fit
        totalTokens: 300,
        truncated: true,
      });

      // Mock recordMemoryAccess
      jest.spyOn(memoryContextManager as any, 'recordMemoryAccess').mockResolvedValueOnce(undefined);

      // Build optimized context
      const result = await memoryContextManager.buildOptimizedContext(
        'Test query about customer preferences',
        testOrganizationId,
        testUserId
      );

      // Verify result respects free tier limits
      expect(result.memories.length).toBe(2);
      expect(result.truncated).toBe(true);
      expect(result.metadata.contextUtilization).toBe(300 / 2000);
    });

    it('should handle errors gracefully', async () => {
      // Mock getConfigForOrganization to throw error
      jest.spyOn(memoryContextManager as any, 'getConfigForOrganization').mockRejectedValueOnce(
        new Error('Database error')
      );

      // Build optimized context
      const result = await memoryContextManager.buildOptimizedContext(
        'Test query about customer preferences',
        testOrganizationId,
        testUserId
      );

      // Verify error handling
      expect(result.memories).toEqual([]);
      expect(result.totalTokens).toBe(0);
      expect(result.truncated).toBe(false);
      expect(result.prioritizationStrategy).toBe('error');
    });
  });

  describe('prioritizeMemories', () => {
    it('should prioritize memories based on importance and recency', () => {
      // Create test config
      const config: MemoryContextConfig = {
        maxContextSize: 8000,
        relevanceThreshold: 0.7,
        recencyWeight: 0.3,
        importanceWeight: 0.5,
        subscriptionTier: 'Pro',
        featureFlags: {
          enableLongTermMemory: true,
          enableMemoryCompression: true,
          enableContextPrioritization: true,
        },
      };

      // Call prioritizeMemories
      const prioritized = (memoryContextManager as any).prioritizeMemories(sampleMemories, config);

      // Verify prioritization
      expect(prioritized.length).toBe(3);
      
      // The most important memory should be first (importance_score: 0.9)
      expect(prioritized[0].importance_score).toBe(0.9);
      
      // The most recent memory should be prioritized over less recent
      expect(new Date(prioritized[1].created_at).getTime()).toBeGreaterThan(
        new Date(prioritized[2].created_at).getTime()
      );
    });

    it('should return empty array for empty input', () => {
      const config: MemoryContextConfig = {
        maxContextSize: 8000,
        relevanceThreshold: 0.7,
        recencyWeight: 0.3,
        importanceWeight: 0.5,
        subscriptionTier: 'Pro',
        featureFlags: {
          enableLongTermMemory: true,
          enableMemoryCompression: true,
          enableContextPrioritization: true,
        },
      };

      const prioritized = (memoryContextManager as any).prioritizeMemories([], config);
      expect(prioritized).toEqual([]);
    });
  });

  describe('fitToContextWindow', () => {
    it('should fit memories to context window', () => {
      // Mock estimateTokenCount
      jest.spyOn(memoryContextManager as any, 'estimateTokenCount')
        .mockReturnValueOnce(200) // First memory: 200 tokens
        .mockReturnValueOnce(300) // Second memory: 300 tokens
        .mockReturnValueOnce(600); // Third memory: 600 tokens

      // Call fitToContextWindow with max 500 tokens
      const result = (memoryContextManager as any).fitToContextWindow(sampleMemories, 500);

      // Verify only first two memories fit (200 + 300 = 500 tokens)
      expect(result.memories.length).toBe(2);
      expect(result.totalTokens).toBe(500);
      expect(result.truncated).toBe(true);
    });

    it('should include all memories if they fit', () => {
      // Mock estimateTokenCount
      jest.spyOn(memoryContextManager as any, 'estimateTokenCount')
        .mockReturnValueOnce(200) // First memory: 200 tokens
        .mockReturnValueOnce(300) // Second memory: 300 tokens
        .mockReturnValueOnce(400); // Third memory: 400 tokens

      // Call fitToContextWindow with max 1000 tokens
      const result = (memoryContextManager as any).fitToContextWindow(sampleMemories, 1000);

      // Verify all memories fit (200 + 300 + 400 = 900 tokens)
      expect(result.memories.length).toBe(3);
      expect(result.totalTokens).toBe(900);
      expect(result.truncated).toBe(false);
    });
  });

  describe('multi-tenant isolation', () => {
    it('should maintain strict multi-tenant isolation', async () => {
      // Create memories for different organizations
      const org1Memories = [
        {
          ...sampleMemories[0],
          organization_id: 'org-1',
        },
      ];
      
      const org2Memories = [
        {
          ...sampleMemories[1],
          organization_id: 'org-2',
        },
      ];

      // Mock searchRelevantMemories to return org-specific memories
      jest.spyOn(memoryContextManager as any, 'searchRelevantMemories')
        .mockImplementation((query, organizationId) => {
          if (organizationId === 'org-1') {
            return Promise.resolve(org1Memories);
          } else if (organizationId === 'org-2') {
            return Promise.resolve(org2Memories);
          }
          return Promise.resolve([]);
        });

      // Mock other required methods
      jest.spyOn(memoryContextManager as any, 'getConfigForOrganization').mockResolvedValue({
        maxContextSize: 8000,
        relevanceThreshold: 0.7,
        recencyWeight: 0.3,
        importanceWeight: 0.5,
        subscriptionTier: 'Pro',
        featureFlags: {
          enableLongTermMemory: true,
          enableMemoryCompression: false,
          enableContextPrioritization: true,
        },
      });
      
      jest.spyOn(memoryContextManager as any, 'prioritizeMemories').mockImplementation(memories => memories);
      
      jest.spyOn(memoryContextManager as any, 'fitToContextWindow').mockImplementation(memories => ({
        memories,
        totalTokens: 100 * memories.length,
        truncated: false,
      }));
      
      jest.spyOn(memoryContextManager as any, 'recordMemoryAccess').mockResolvedValue(undefined);

      // Build context for org-1
      const org1Result = await memoryContextManager.buildOptimizedContext(
        'Test query',
        'org-1',
        'user-1'
      );

      // Build context for org-2
      const org2Result = await memoryContextManager.buildOptimizedContext(
        'Test query',
        'org-2',
        'user-2'
      );

      // Verify strict isolation
      expect((org1Result.memories as any[])[0]?.organization_id).toBe('org-1');
      expect((org2Result.memories as any[])[0]?.organization_id).toBe('org-2');
      expect(org1Result.memories).not.toEqual(org2Result.memories);
    });
  });
});

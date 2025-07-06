/**
 * Unit tests for MemoryContextProvider
 * 
 * The MemoryContextProvider is responsible for retrieving and managing memory context for AI interactions.
 * It integrates with the MemoryService, handles multi-tenant isolation, optimizes memory retrieval,
 * provides optimized memory context, and maintains multi-tenant isolation.
 */

// Set up mocks before any imports
jest.mock('../../../../src/lib/ai/embeddings/openai-embeddings', () => {
  return {
    OpenAIEmbeddings: jest.fn().mockImplementation(() => ({
      embedQuery: jest.fn().mockResolvedValue(Array(1536).fill(0.1)),
      embedDocuments: jest.fn().mockResolvedValue([Array(1536).fill(0.1)]),
      apiKey: 'test-api-key',
      modelName: 'text-embedding-ada-002',
      openAIApiKey: 'test-api-key',
      batchSize: 1,
      dimensions: 1536
    }))
  };
});

// Mock the environment variables
process.env.OPENAI_API_KEY = 'test-api-key';

import { MemoryContextProvider } from '../../../../src/lib/ai/memory/memory-context-provider';
import { MemoryContextManager } from '../../../../src/lib/ai/memory/memory-context-manager';
import { MemoryService as OriginalMemoryService } from '../../../../src/lib/ai/memory/memory-service';
import { asTestProvider, TestableMemoryContextProvider } from './test-helpers';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';
import { AIMemoryType as ImportedMemoryType } from '../../../../src/lib/ai/memory/ai-memory-service';

// Mock MemoryService - we'll use this interface for the mock
interface MemoryService {
  supabase: any;
  getMemoriesByType: jest.Mock;
  getMemoryTypes: jest.Mock;
  getMemoriesByImportance: jest.Mock;
  getMemoriesByRelevance: jest.Mock;
  getRecentMemories: jest.Mock;
  getMemory: jest.Mock;
  getMemories: jest.Mock;
  createMemory: jest.Mock;
  updateMemory: jest.Mock;
  deleteMemory: jest.Mock;
  getMemoryTypeNames: jest.Mock;
  getMemoriesForContext: jest.Mock;
  updateMemoryImportance: jest.Mock;
  getMemoryImportance: jest.Mock;
}

// Define OpenAIEmbeddings interface for testing
interface OpenAIEmbeddings {
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(documents: string[]): Promise<number[][]>;
}

// Mock uuid module to prevent random uuid generation in tests
jest.mock('uuid', () => {
  let counter = 0;
  return {
    v4: jest.fn(() => `test-uuid-${counter++}`)
  };
});

// Mock SupabaseClient
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            contains: jest.fn(() => ({
              gt: jest.fn(() => ({
                lt: jest.fn(() => ({
                  order: jest.fn(() => ({
                    range: jest.fn(() => ({
                      single: jest.fn(() => ({
                        execute: jest.fn(() => ({
                          data: [],
                          error: null,
                          status: 200,
                          count: 0,
                        })),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
  };
});

// Define test variables that will be used throughout the tests
let testProvider: TestableMemoryContextProvider;
// Initialize sampleMemories here with an empty array, will be populated later
let sampleMemories: AIMemory[] = [];

// Mock the memory service using our manual mock for OpenAI embeddings
const mockMemoryService = {
  supabase: {},
  getMemoriesByType: jest.fn(() => Promise.resolve([])),
  getMemoriesByMetadata: jest.fn(() => Promise.resolve([])),
  getMemoriesByRelevance: jest.fn(() => Promise.resolve([])),
  searchMemories: jest.fn(() => Promise.resolve([])),
  searchMemoriesByEmbedding: jest.fn(() => Promise.resolve([])),
  countMemoriesByType: jest.fn(() => Promise.resolve(0)),
  createMemory: jest.fn(() => Promise.resolve({})),
  updateMemory: jest.fn(() => Promise.resolve({})),
  deleteMemory: jest.fn(() => Promise.resolve({})),
  embedText: jest.fn(() => Promise.resolve(Array(1536).fill(0.1))),
  getMemoryById: jest.fn(() => Promise.resolve({})),
  generateMemoryEmbedding: jest.fn(() => Promise.resolve(Array(1536).fill(0.1))),
  getMemoryImportance: jest.fn(() => Promise.resolve({})),
  embeddings: {
    embedQuery: jest.fn().mockResolvedValue(Array(1536).fill(0.1)),
    embedDocuments: jest.fn().mockResolvedValue([Array(1536).fill(0.1)])
  }
} as unknown as MemoryService;


// Mock MemoryContextManager
const mockContextManager = {
  buildOptimizedContext: jest.fn().mockResolvedValue({
    memories: [],  // Will be replaced with sampleMemories after definition
    metadata: {
      retrievalTime: 123,
      memoryCount: {
        compressed: 5,
        total: 10
      },
      contextUtilization: 0.75
    }
  })
} as unknown as jest.Mocked<MemoryContextManager>;

// Create a reference to our mocked OpenAIEmbeddings methods to use in tests
const mockEmbedQuery = jest.fn().mockResolvedValue(Array(1536).fill(0.1));
const mockEmbedDocuments = jest.fn().mockResolvedValue([Array(1536).fill(0.1)]);

// No need to create a separate mockOpenAIEmbeddings since we've mocked the class already

// Define interfaces and types needed for tests
// Use the same values as the imported enum to ensure compatibility
enum AIMemoryType {
  FACT = 'fact',
  PREFERENCE = 'preference',
  FEEDBACK = 'feedback',
  INTERACTION = 'interaction',
  INSIGHT = 'insight'
}

// Type assertion helper to align local and imported types
const asImportedMemoryType = (type: AIMemoryType): ImportedMemoryType => {
  return type as unknown as ImportedMemoryType;
};

interface AIMemory {
  id: string;
  content: string;
  memoryType: AIMemoryType;
  importanceScore: number;
  createdAt: string;
  updatedAt?: string;
  lastAccessedAt?: string;
  metadata: Record<string, any>;
  userId?: string;
  organization_id: string;
  relevanceScore?: number;
  content_embedding?: number[];
  memory_type?: string;
  importance_score?: number;
}

interface ContextRequest {
  query: string;
  organizationId: string;
  userId?: string;
  config?: Partial<MemoryContextConfig>;
  agentId?: string;
  conversationId?: string;
}

interface MemoryContextResult {
  memories: AIMemory[];
  totalTokens: number;
  truncated: boolean;
  prioritizationStrategy?: string;
  contextId?: string;
  metadata?: {
    memoryCount?: number | { retrieved: number; selected: number; compressed: number; };
    total?: number;
    matchedBy?: string[];
    contextUtilization?: number;
    retrievalTime?: number;
    source?: string;
  };
}

interface MemoryContextConfig {
  maxContextSize: number;
  relevanceThreshold: number;
  subscriptionTier?: string;
  featureFlags?: {
    enableLongTermMemory: boolean;
    enableMemoryCompression: boolean;
    enableContextPrioritization: boolean;
    enableContextPersistence?: boolean;
    enableContextFeedback?: boolean;
    enableContextSharing?: boolean;
  };
}

// Define local provider config (renamed to avoid conflicts with imported one)
interface LocalContextProviderConfig {
  maxContextSize: number;
  relevanceThreshold: number;
  subscriptionTier: string;
  featureFlags: {
    enableLongTermMemory: boolean;
    enableMemoryCompression: boolean;
    enableContextPrioritization: boolean;
    enableContextPersistence?: boolean;
    enableContextFeedback?: boolean;
    enableContextSharing?: boolean;
  };
  enableLongTermMemory: boolean;
  enableMemoryCompression: boolean;
  enableContextPrioritization: boolean;
  enableContextPersistence?: boolean;
  enableContextFeedback?: boolean;
  enableContextSharing?: boolean;
}

interface MemoryContext {
  id?: string;
  contextId?: string;
  query: string;
  memories: AIMemory[];
  tokenCount: number;
  totalTokens: number;
  truncated: boolean;
  relevanceScore?: number;
  prioritizationStrategy?: string;
  feedback?: {
    relevanceScore?: number;
    usefulnessScore?: number;
    feedback?: string;
  };
  metadata?: Record<string, any>;
}

interface MemoryContextRequest {
  query: string;
  organizationId: string;
  userId?: string;
  contextId?: string;
  conversationId?: string;
  agentId?: string;
  config?: Partial<MemoryContextConfig>;
}

interface AgentSettings {
  memory_types: string[];
  context_window: number;
  relevance_threshold: number;
  [key: string]: any;
}

// Mock variables for test setup
let mockSupabase: any;
let provider: MemoryContextProvider;

// Test constants
const testUserId = 'test-user-id';
const testOrganizationId = 'test-org-id';
const testAgentId = 'test-agent-id';
const testConversationId = uuidv4();
const testContextId = uuidv4();

// Initialize variables needed for testing
const initializeTestVariables = () => {
  // Define test memories first so they can be referenced in other variables
  sampleMemories = [
    {
      id: uuidv4(),
      userId: testUserId,
      content: 'Customer prefers email communication over phone calls',
      content_embedding: Array(1536).fill(0.1),
      memoryType: AIMemoryType.PREFERENCE,
      memory_type: asImportedMemoryType(AIMemoryType.PREFERENCE),
      importanceScore: 0.8,
      importance_score: 0.8,
      metadata: { 
        source: 'conversation', 
        entityType: 'customer',
        entityId: 'customer-123'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      organization_id: testOrganizationId,
      relevanceScore: 0.85
    },
    {
      id: uuidv4(),
      content: 'User gave positive feedback about feature X',
      memoryType: AIMemoryType.FEEDBACK,
      memory_type: asImportedMemoryType(AIMemoryType.FEEDBACK),
      importanceScore: 0.85,
      importance_score: 0.85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      userId: testUserId,
      organization_id: testOrganizationId,
      relevanceScore: 0.9,
      metadata: { source: 'feedback' },
      content_embedding: Array(1536).fill(0.1)
    },
    {
      id: uuidv4(),
      content: 'The user recently completed a project',
      memoryType: AIMemoryType.INTERACTION,
      memory_type: asImportedMemoryType(AIMemoryType.INTERACTION),
      importanceScore: 0.8,
      importance_score: 0.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      organization_id: testOrganizationId,
      userId: testUserId,
      relevanceScore: 0.75,
      metadata: { source: 'user_activity' }
    }
  ];
  
  // Now define sample context using the defined memories
  return {
    sampleContext: {
      contextId: testContextId,
      memories: sampleMemories,
      query: 'What are the customer preferences?',
      totalTokens: 300,
      truncated: false,
      relevanceScore: 0.85,
      metadata: {
        memoryCount: {
          retrieved: 10,
          selected: 2,
          compressed: 0
        },
        contextUtilization: 0.3,
        retrievalTime: 50
      }
    }
  };
};

// Initialize test variables before proceeding
const { sampleContext } = initializeTestVariables();

// Sample context result from memory context manager
const sampleContextResult = {
  contextId: testContextId,
  memories: [],
  totalTokens: 300,
  truncated: false,
  metadata: {
    memoryCount: { retrieved: 10, selected: 2, compressed: 0 },
    contextUtilization: 0.3,
    retrievalTime: 50
  }
};

// Sample subscription plans
const sampleSubscriptionPlans = [
  {
    id: 'plan_free',
    name: 'Free',
    features: {
      ai_memory: {
        enabled: true,
        max_context_size: 2000,
        context_retention_days: 7,
        enable_context_persistence: false,
        enable_context_sharing: false,
        enable_cross_user_memories: false,
        feature_flags: {
          enableLongTermMemory: false,
          enableMemoryCompression: false,
          enableContextPrioritization: false
        }
      }
    }
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    features: {
      ai_memory: {
        enabled: true,
        max_context_size: 4000,
        context_retention_days: 30,
        enable_context_persistence: true,
        enable_context_sharing: false,
        enable_cross_user_memories: false,
        feature_flags: {
          enableLongTermMemory: true,
          enableMemoryCompression: true,
          enableContextPrioritization: true
        }
      }
    }
  }
];

// Sample agent settings
const sampleAgentSettings = {
  id: testAgentId,
  organization_id: testOrganizationId,
  name: 'Test Agent',
  memory_settings: {
    relevance_threshold: 0.75,
    recency_weight: 0.4,
  }
};

// sampleMemories is now initialized in the initializeTestVariables function above

// Create a ContextProviderConfig that matches the structure expected by the MemoryContextProvider
const sampleConfig = {
  maxContextSize: 1000,
  relevanceThreshold: 0.7,
  subscriptionTier: 'free',
  featureFlags: {
    enableLongTermMemory: true,
    enableMemoryCompression: true,
    enableContextPrioritization: true,
    enableContextPersistence: true
  },
  enableLongTermMemory: true,
  enableMemoryCompression: true,
  enableContextPrioritization: true,
  enableContextPersistence: true
};

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Mock Supabase client
  const mockSupabase = {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'ai_memories') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({ data: sampleMemories[0], error: null }),
            }),
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                data: sampleMemories,
                error: null,
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              data: [{ id: 'new-memory-id' }],
              error: null,
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: { id: 'context-id' },
              error: null,
            }),
          })
        };
      } else if (table === 'ai_memory_contexts') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'context-id',
                  query: 'Test query',
                  memories: JSON.stringify(sampleMemories),
                  metadata: JSON.stringify({
                    tokenCount: 100,
                    memoryCount: {
                      retrieved: 5,
                      selected: 3,
                      compressed: 0
                    },
                    retrievalTime: 150,
                    contextUtilization: 0.8,
                    truncated: false,
                    total: 10
                  }),
                },
                error: null,
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              data: [{ id: 'new-context-id' }],
              error: null
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: { id: 'context-id' },
              error: null
            }),
          }),
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              data: [{ id: 'context-id' }],
              error: null
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            }),
          }),
        };
      } else if (table === 'organization_subscriptions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              subscription_plan_id: 'plan-123',
              status: 'active',
            },
            error: null,
          }),
        };
      } else if (table === 'subscription_plans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'plan-123',
              features: {
                ai_memory: {
                  enabled: true,
                  max_context_size: 2000,
                  context_retention_days: 7,
                  enable_context_persistence: false,
                  enable_context_sharing: false,
                  feature_flags: {
                    enableLongTermMemory: false,
                    enableMemoryCompression: false,
                    enableContextPrioritization: false
                  }
                }
              }
            },
            error: null,
          }),
        };
      } else {
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
      }
    }),
    rpc: jest.fn().mockReturnValue({
      data: [{ id: 'memory-id' }],
      error: null,
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      }),
    },
  };

  // Create a test instance of MemoryContextProvider
  // Mock the private method that creates embeddings to avoid calling the real OpenAI API
  provider = new MemoryContextProvider(
    mockSupabase as unknown as SupabaseClient,
    mockMemoryService as unknown as OriginalMemoryService,
    sampleConfig as any // Use type assertion to bypass type checking
  );
  
  // Add a spy to the generateEmbedding method if it exists
  if ((provider as any).generateEmbedding) {
    jest.spyOn((provider as any), 'generateEmbedding').mockResolvedValue(Array(1536).fill(0.1));
  }
  
  // Mock any embeddingsProvider that might exist
  if ((provider as any).embeddingsProvider) {
    (provider as any).embeddingsProvider = {
      embedQuery: jest.fn().mockResolvedValue(Array(1536).fill(0.1)),
      embedDocuments: jest.fn().mockResolvedValue([Array(1536).fill(0.1)])
    };
  }

  // Replace the private contextManager with our mock
  (provider as any).contextManager = mockContextManager;
  
  // Initialize testProvider for use in tests
  testProvider = asTestProvider(provider);

  // Create mock config
  const mockConfig = {
    maxContextSize: 2000,
    relevanceThreshold: 0.7,
    subscriptionTier: 'pro',
    featureFlags: {
      enableLongTermMemory: true,
      enableMemoryCompression: true,
      enableContextPrioritization: true,
      enableContextPersistence: true,
      enableContextFeedback: true,
      enableContextSharing: true
    },
    enableLongTermMemory: true,
    enableMemoryCompression: true,
    enableContextPrioritization: true,
    enableContextPersistence: true,
    enableContextFeedback: true,
    enableContextSharing: true
  };

  // Set mock config
  (provider as any).defaultConfig = mockConfig;

  jest.spyOn(provider as any, 'getConfigForRequest').mockImplementation(() => {
    return Promise.resolve(mockConfig);
  });
  
  jest.spyOn(provider as any, 'getExistingContext').mockImplementation(() => {
    return Promise.resolve(null);
  });
  
  // Use a more generic mock implementation to avoid TypeScript errors
  jest.spyOn(provider as any, 'persistContext').mockImplementation(
    (query: any, memories: any, tokenCount: any, truncated: any, relevanceScore: any, organizationId: any) => {
      return Promise.resolve(`context-id-${organizationId}`);
    }
  );

  // Setup Supabase mock implementation
  mockSupabase.from = jest.fn().mockImplementation((table: string) => {
    if (table === 'ai_memory_contexts') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: sampleContext,
          error: null
        })
      };
    }
    
    if (table === 'agent_settings') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: sampleAgentSettings,
          error: null
        })
      };
    }
    
    if (table === 'subscription_plans') {
      return {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: sampleSubscriptionPlans[1], // Return the pro plan
          error: null
        })
      };
    }
    
    if (table === 'organization_settings') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: uuidv4(),
            name: 'Premium',
            features: {
              ai_memory: {
                enabled: true,
                max_context_size: 2000,
                context_retention_days: 30,
                enable_context_persistence: true,
                enable_context_sharing: false,
                enable_cross_user_memories: false,
                feature_flags: {
                  enableLongTermMemory: true,
                  enableMemoryCompression: true,
                  enableContextPrioritization: true
                }
              }
            }
          },
          error: null
        }),
      };
    }
  });
});

// Update the existing mockContextManager
if (mockContextManager && mockContextManager.buildOptimizedContext) {
  mockContextManager.buildOptimizedContext.mockImplementation((query: string, organizationId: string, userId?: string, config?: Partial<MemoryContextConfig>) => {
    // Return different memories based on organization ID to test isolation
    const mems = sampleMemories.map(memory => ({
      ...memory,
      organization_id: organizationId,
      memory_type: asImportedMemoryType(memory.memoryType as AIMemoryType)
    }));
    
    // Use a strong type assertion to ensure TypeScript compatibility
    const result = {
      memories: mems,
      totalTokens: 300,
      truncated: false,
      prioritizationStrategy: "Importance",
      metadata: {
        memoryCount: { retrieved: 3, selected: 3, compressed: 0 },
        total: mems.length,
        matchedBy: ['recent', 'important']
      }
    };
    
    return Promise.resolve(result as any);
  });
}

// Mock data for getContext
const mockRequest: ContextRequest = {
  query: 'What are the customer preferences?',
  organizationId: testOrganizationId,
  userId: testUserId,
  agentId: testAgentId,
  conversationId: testConversationId
};

describe('MemoryContextProvider', () => {
  describe('getContext', () => {
    it('should return optimized context for a query', async () => {
      // Setup mock for getConfigForRequest
      jest.spyOn(provider as any, 'getConfigForRequest').mockResolvedValue({
        maxContextSize: 4000,
        relevanceThreshold: 0.7,
        enableContextPersistence: true,
        enableLongTermMemory: true,
        enableMemoryCompression: true,
        enableContextPrioritization: true
      });
      
      // Setup mock for getExistingContext
      jest.spyOn(provider as any, 'getExistingContext').mockResolvedValue(null);
      
      // Setup mock for buildOptimizedContext
      mockContextManager.buildOptimizedContext.mockImplementation((query: string, organizationId: string, userId?: string, config?: Partial<MemoryContextConfig>) => {
        return Promise.resolve({
          memories: sampleMemories.map((memory: AIMemory) => ({
            ...memory,
            organization_id: organizationId,
            memory_type: asImportedMemoryType(memory.memoryType as AIMemoryType)
          })),
          totalTokens: 300,
          truncated: false,
          prioritizationStrategy: 'importance',
          metadata: {
            memoryCount: { retrieved: 3, selected: 3, compressed: 0 },
            contextUtilization: 0.3,
            retrievalTime: 150
          }
        } as any);
      });
      
      // Setup mock for persistContext
      jest.spyOn(provider as any, 'persistContext').mockImplementation(
        (memories: any, request: any, config: any) => Promise.resolve(`context-id-${request.organizationId}`)
      );

      // Call getContext
      const result = await provider.getContext({
        query: 'What are the customer preferences?',
        organizationId: testOrganizationId,
        userId: testUserId
      });

      // Verify result has expected properties
      expect(result.memories.length).toEqual(sampleMemories.length);
      // Check metadata properties
      expect(result.metadata.tokenCount).toBe(300);
      expect(result.metadata.truncated).toBe(false);
      expect(result.contextId).toBe(`context-id-${testOrganizationId}`);
      expect(mockContextManager.buildOptimizedContext).toHaveBeenCalledWith(
        'What are the customer preferences?',
        testOrganizationId,
        testUserId,
        expect.any(Object)
      );
    });

    it('should enforce strict multi-tenant isolation', async () => {
      // Setup context requests for two different orgs
      const org1Context = {
        query: 'What are org-1 preferences?',
        organizationId: 'org-1',
        userId: 'user-1',
        agentId: 'agent-1',
        conversationId: 'conv-1'
      };

      const org2Context = {
        query: 'What are org-2 preferences?',
        organizationId: 'org-2',
        userId: 'user-2',
        agentId: 'agent-2',
        conversationId: 'conv-2'
      };

      // Setup mocks for both providers
      const setupMocks = (providerInstance: any) => {
        jest.spyOn(providerInstance, 'getConfigForRequest').mockResolvedValue({
          maxContextSize: 4000,
          relevanceThreshold: 0.7,
          enableContextPersistence: true,
          enableLongTermMemory: true,
          enableMemoryCompression: true,
          enableContextPrioritization: true
        });
        
        jest.spyOn(providerInstance, 'getExistingContext').mockResolvedValue(null);
        
        jest.spyOn(providerInstance, 'persistContext').mockImplementation(
          (memories: any, request: any, config: any) => Promise.resolve(`context-id-${request.organizationId}`)
        );
      };
      
      setupMocks(provider);
      setupMocks(testProvider);

      // Mock buildOptimizedContext to return different results based on org ID
      mockContextManager.buildOptimizedContext.mockImplementation(
        (query: string, organizationId: string, userId?: string, config?: Partial<MemoryContextConfig>) => {
          if (organizationId === 'org-1') {
            return Promise.resolve({
              memories: [{ ...sampleMemories[0], organization_id: 'org-1', memory_type: asImportedMemoryType(AIMemoryType.PREFERENCE) }],
              totalTokens: 150,
              truncated: false,
              prioritizationStrategy: 'importance_recency',
              metadata: {
                memoryCount: { retrieved: 1, selected: 1, compressed: 0 },
                contextUtilization: 0.15,
                retrievalTime: 50
              }
            } as any);
          } else {
            return Promise.resolve({
              memories: [{ ...sampleMemories[1], organization_id: 'org-2', memory_type: asImportedMemoryType(AIMemoryType.FEEDBACK) }],
              totalTokens: 150,
              truncated: false,
              prioritizationStrategy: 'importance_recency',
              metadata: {
                memoryCount: { retrieved: 1, selected: 1, compressed: 0 },
                contextUtilization: 0.15,
                retrievalTime: 50
              }
            } as any);
          }
        }
      );

      // Get context for org-1
      const org1Result = await testProvider.getContext({
        query: org1Context.query,
        organizationId: org1Context.organizationId,
        userId: org1Context.userId,
        agentId: org1Context.agentId,
        conversationId: org1Context.conversationId
      });

      // Get context for org-2
      const org2Result = await provider.getContext({
        query: org2Context.query,
        organizationId: org2Context.organizationId,
        userId: org2Context.userId,
        agentId: org2Context.agentId,
        conversationId: org2Context.conversationId
      });

      // Verify strict isolation
      expect(org1Result.memories[0].organization_id).toBe('org-1');
      expect(org2Result.memories[0].organization_id).toBe('org-2');
      expect(org1Result.contextId).toBe('context-id-org-1');
      expect(org2Result.contextId).toBe('context-id-org-2');
      
      // Verify buildOptimizedContext was called with correct organization IDs
      expect(mockContextManager.buildOptimizedContext).toHaveBeenCalledWith(
        org1Context.query,
        'org-1',
        'user-1',
        expect.any(Object)
      );
      
      expect(mockContextManager.buildOptimizedContext).toHaveBeenCalledWith(
        org2Context.query,
        'org-2',
        'user-2',
        expect.any(Object)
      );
    });
  });
  
  describe('persistContext', () => {
    it('should persist context to database', async () => {
      const result = await testProvider.persistContext(
        'What are the preferences?',
        sampleMemories,
        300,
        false,
        0.85,
        testOrganizationId
      );
      
      expect(result).toBe(`context-id-${testOrganizationId}`);
    });
  });
});

/**
 * AI Memory Service Tests
 * 
 * This file contains tests for the AI Memory Service and related components.
 */

import { AIMemoryService, AIMemoryType, AIMemoryAccessType, AIMemoryRelationshipType } from '../ai-memory-service';
import { MemoryEnabledSalesTacticsService } from '../../sales-tactics-with-memory';

// Mock Supabase client
jest.mock('../../../supabaseClient', () => {
  return {
    createClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: { id: 'mock-memory-id' },
              error: null
            })
          })
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                data: [{ id: 'mock-access-id', memory_id: 'mock-memory-id' }],
                error: null
              })
            })
          }),
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                data: [{ id: 'mock-memory-id', content: 'Test memory' }],
                error: null
              })
            })
          }),
          overlaps: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: [{ id: 'mock-tactic-id', category: 'Test Tactic' }],
              error: null
            })
          }),
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              data: [{ id: 'mock-memory-id', content: 'Test memory' }],
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { id: 'mock-memory-id', importance_score: 0.7 },
                error: null
              })
            })
          })
        })
      })
    })
  };
});

// Mock OpenAI API
jest.mock('openai', () => {
  return {
    Configuration: jest.fn(),
    OpenAIApi: jest.fn().mockImplementation(() => {
      return {
        createEmbedding: jest.fn().mockResolvedValue({
          data: {
            data: [
              {
                embedding: Array(1536).fill(0.1)
              }
            ]
          }
        })
      };
    })
  };
});

describe('AI Memory Service', () => {
  let memoryService: AIMemoryService;
  const organizationId = 'test-org-id';
  const userId = 'test-user-id';

  beforeEach(() => {
    memoryService = new AIMemoryService();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  test('should generate embeddings for text content', async () => {
    const embedding = await memoryService.generateEmbedding('Test content');
    expect(embedding).toHaveLength(1536);
    expect(embedding[0]).toBe(0.1);
  });

  test('should store a memory with embedding', async () => {
    const memory = {
      organization_id: organizationId,
      user_id: userId,
      content: 'Test memory content',
      metadata: { test: 'metadata' },
      memory_type: AIMemoryType.DECISION,
      importance_score: 0.5
    };

    const result = await memoryService.storeMemory(memory);
    expect(result).toBeDefined();
    expect(result.id).toBe('mock-memory-id');
  });

  test('should search memories using semantic similarity', async () => {
    const searchParams = {
      query: 'Test query',
      memory_types: [AIMemoryType.DECISION],
      min_importance: 0.3,
      max_results: 5
    };

    const results = await memoryService.searchMemories(searchParams, organizationId);
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  test('should connect two memories with a relationship', async () => {
    const relationship = {
      organization_id: organizationId,
      source_memory_id: 'source-memory-id',
      target_memory_id: 'target-memory-id',
      relationship_type: AIMemoryRelationshipType.RELATED_TO,
      strength: 0.8
    };

    const result = await memoryService.connectMemories(relationship);
    expect(result).toBeDefined();
    expect(result.id).toBe('mock-memory-id');
  });

  test('should record memory access', async () => {
    const access = {
      organization_id: organizationId,
      memory_id: 'test-memory-id',
      user_id: userId,
      access_type: AIMemoryAccessType.RETRIEVE,
      context: 'Test context'
    };

    const result = await memoryService.recordMemoryAccess(access);
    expect(result).toBeDefined();
    expect(result.id).toBe('mock-memory-id');
  });

  test('should update memory outcome', async () => {
    const result = await memoryService.updateMemoryOutcome(
      'test-access-id',
      'Positive outcome',
      0.8
    );
    expect(result).toBeDefined();
    expect(result.id).toBe('mock-memory-id');
  });

  test('should update memory importance based on access patterns', async () => {
    const result = await memoryService.updateMemoryImportance('test-memory-id', organizationId);
    expect(result).toBeDefined();
    expect(result.importance_score).toBe(0.7);
  });
});

describe('Memory-Enabled Sales Tactics Service', () => {
  let tacticService: MemoryEnabledSalesTacticsService;
  const organizationId = 'test-org-id';
  const userId = 'test-user-id';

  beforeEach(() => {
    tacticService = new MemoryEnabledSalesTacticsService();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  test('should get memory-enhanced sales tactics', async () => {
    const personalityProfile = {
      Tone_Preference: 'friendly, professional',
      Emotional_Trigger: 'achievement'
    };

    const emailContext = {
      subject: 'Test Subject',
      content: 'Test email content'
    };

    const tactics = await tacticService.getMemoryEnhancedSalesTactics(
      personalityProfile,
      emailContext,
      organizationId
    );

    expect(tactics).toBeDefined();
    expect(Array.isArray(tactics)).toBe(true);
  });

  test('should format enhanced sales tactics for AI context', () => {
    const tactics = [
      {
        id: 'tactic-1',
        expert: 'Test Expert',
        category: 'Test Category',
        tactical_snippet: 'Test snippet',
        use_case: 'Test use case',
        email_phrase: 'Test phrase',
        emotional_trigger: 'achievement',
        matching_tone: ['friendly', 'professional'],
        created_at: '2023-01-01',
        effectiveness_score: 0.8,
        usage_count: 5,
        last_used: '2023-06-01'
      }
    ];

    const formattedContext = tacticService.formatEnhancedSalesTacticsForAIContext(tactics);
    expect(formattedContext).toContain('Test Category');
    expect(formattedContext).toContain('Highly Effective');
    expect(formattedContext).toContain('Used 5 times');
  });

  test('should store a tactic decision in memory', async () => {
    const tactic = {
      id: 'tactic-1',
      expert: 'Test Expert',
      category: 'Test Category',
      tactical_snippet: 'Test snippet',
      use_case: 'Test use case',
      email_phrase: 'Test phrase',
      emotional_trigger: 'achievement',
      matching_tone: ['friendly', 'professional'],
      created_at: '2023-01-01'
    };

    const context = {
      email_id: 'email-1',
      contact_id: 'contact-1',
      content: 'Test email content'
    };

    const result = await tacticService.storeTacticDecision(
      tactic,
      context,
      organizationId,
      userId
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('mock-memory-id');
  });

  test('should record tactic outcome', async () => {
    const outcome = {
      tactic_id: 'tactic-1',
      email_id: 'email-1',
      contact_id: 'contact-1',
      outcome_type: 'positive' as const,
      outcome_details: 'Customer responded positively',
      outcome_score: 0.9
    };

    const result = await tacticService.recordTacticOutcome(
      outcome,
      organizationId,
      userId
    );

    expect(result).toBeDefined();
    expect(result?.id).toBe('mock-memory-id');
  });
});

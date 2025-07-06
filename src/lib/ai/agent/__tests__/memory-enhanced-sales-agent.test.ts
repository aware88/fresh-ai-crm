/**
 * Memory Enhanced Sales Agent Tests
 * 
 * Tests for the MemoryEnhancedSalesAgent class which integrates
 * the sales agent with the memory context provider.
 */

import { MemoryEnhancedSalesAgent } from '../memory-enhanced-sales-agent';
import { MemoryContextProvider } from '../../memory/memory-context-provider';
import { MemoryService } from '../../memory/memory-service';
import { AIMemoryType } from '../../memory/ai-memory-service';
import { TransparencyService } from '../../transparency/transparency-service';

// Mock dependencies
jest.mock('../../memory/memory-context-provider');
jest.mock('../../memory/memory-service');
jest.mock('../../transparency/transparency-service');
jest.mock('@supabase/supabase-js');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}));

// Mock OpenAI
jest.mock('openai', () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn().mockImplementation(() => ({
    createCompletion: jest.fn().mockResolvedValue({
      data: {
        choices: [{ text: 'Mock response' }]
      }
    }),
    createEmbedding: jest.fn().mockResolvedValue({
      data: {
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      }
    })
  }))
}));

describe('MemoryEnhancedSalesAgent', () => {
  // Mock objects
  const mockSupabase: any = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    data: null,
    error: null
  };
  
  const mockOpenAI: any = {};
  const mockAgentId = 'agent-123';
  const mockOrgId = 'org-456';
  
  // Sample data
  const sampleMessage = {
    id: 'msg-123',
    contact_id: 'contact-123',
    user_id: 'user-123',
    conversation_id: 'conv-123',
    content: 'I prefer the premium plan but I have concerns about the price.',
    created_at: new Date().toISOString()
  };
  
  const sampleResponse = {
    id: 'resp-123',
    content: 'I understand your concern about the price. Let me explain the value you get with the premium plan.',
    created_at: new Date().toISOString()
  };
  
  const sampleMemoryContext = {
    memories: [
      {
        id: 'mem-1',
        organization_id: mockOrgId,
        content: 'Customer prefers email communication',
        memory_type: AIMemoryType.PREFERENCE,
        importance_score: 0.8,
        metadata: { contact_id: 'contact-123' }
      },
      {
        id: 'mem-2',
        organization_id: mockOrgId,
        content: 'Customer previously mentioned budget constraints',
        memory_type: AIMemoryType.OBSERVATION,
        importance_score: 0.7,
        metadata: { contact_id: 'contact-123' }
      }
    ],
    contextId: 'ctx-123',
    metadata: {
      tokenCount: 150,
      memoryCount: 2,
      retrievalTime: 50,
      contextUtilization: 0.15,
      truncated: false
    }
  };
  
  // Setup and teardown
  let agent: MemoryEnhancedSalesAgent;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Supabase response for agent memory config
    mockSupabase.data = {
      enable_memory_creation: true,
      enable_memory_retrieval: true,
      max_memories_to_retrieve: 10,
      min_relevance_score: 0.7,
      memory_types: [AIMemoryType.PREFERENCE, AIMemoryType.FEEDBACK]
    };
    mockSupabase.error = null;
    
    // Mock MemoryContextProvider
    (MemoryContextProvider as jest.Mock).mockImplementation(() => ({
      getContext: jest.fn().mockResolvedValue(sampleMemoryContext),
      updateContextWithFeedback: jest.fn().mockResolvedValue(undefined)
    }));
    
    // Mock MemoryService
    (MemoryService as jest.Mock).mockImplementation(() => ({
      createMemory: jest.fn().mockResolvedValue({ id: 'new-mem-id' }),
      updateMemoryImportance: jest.fn().mockResolvedValue(undefined)
    }));
    
    // Mock TransparencyService
    (TransparencyService as jest.Mock).mockImplementation(() => ({
      logActivity: jest.fn().mockResolvedValue({ id: 'activity-123' }),
      logThought: jest.fn().mockResolvedValue(undefined),
      getSettings: jest.fn().mockResolvedValue([
        { setting_key: 'activity_logging_enabled', setting_value: true },
        { setting_key: 'thought_logging_enabled', setting_value: true }
      ]),
      updateSetting: jest.fn().mockResolvedValue(undefined)
    }));
    
    // Create agent instance
    agent = new MemoryEnhancedSalesAgent(
      mockSupabase,
      mockOpenAI,
      mockAgentId,
      mockOrgId
    );
    
    // Mock parent class methods
    jest.spyOn(agent as any, 'processContactMessage').mockImplementation(
      async () => sampleResponse
    );
  });
  
  describe('constructor', () => {
    it('should initialize with default memory config', () => {
      expect(agent).toBeDefined();
      expect(MemoryService).toHaveBeenCalled();
      expect(MemoryContextProvider).toHaveBeenCalled();
    });
    
    it('should load memory config from database', async () => {
      // This happens asynchronously in the constructor
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_memory_config');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', mockOrgId);
    });
  });
  
  describe('processContactMessage', () => {
    it('should retrieve memory context when processing a message', async () => {
      // Override the mock to access our implementation
      jest.spyOn(agent as any, 'processContactMessage').mockRestore();
      jest.spyOn(agent as any, 'getRelevantMemoryContext').mockResolvedValue(sampleMemoryContext);
      jest.spyOn(agent as any, 'makeDecisionWithMemory').mockResolvedValue({
        approach: 'test_approach',
        confidence: 0.9,
        alternatives: []
      });
      jest.spyOn(agent as any, 'createMemoriesFromInteraction').mockResolvedValue(undefined);
      
      // Call the method
      await agent.processContactMessage(sampleMessage);
      
      // Verify memory context was retrieved
      expect((agent as any).getRelevantMemoryContext).toHaveBeenCalledWith(sampleMessage);
      
      // Verify decision was made with memory
      expect((agent as any).makeDecisionWithMemory).toHaveBeenCalledWith(
        sampleMessage,
        sampleMemoryContext
      );
      
      // Verify memories were created
      expect((agent as any).createMemoriesFromInteraction).toHaveBeenCalled();
      
      // Verify feedback was provided
      expect((agent as any).memoryContextProvider.updateContextWithFeedback).toHaveBeenCalledWith(
        sampleMemoryContext.contextId,
        expect.objectContaining({
          relevanceScore: expect.any(Number),
          usefulnessScore: expect.any(Number)
        }),
        mockOrgId
      );
    });
    
    it('should not retrieve memory context when disabled', async () => {
      // Override the mock to access our implementation
      jest.spyOn(agent as any, 'processContactMessage').mockRestore();
      jest.spyOn(agent as any, 'getRelevantMemoryContext').mockResolvedValue(null);
      jest.spyOn(agent as any, 'makeDecisionWithMemory').mockResolvedValue({
        approach: 'test_approach',
        confidence: 0.9,
        alternatives: []
      });
      
      // Disable memory retrieval
      (agent as any).memoryConfig.enableMemoryRetrieval = false;
      
      // Call the method
      await agent.processContactMessage(sampleMessage);
      
      // Verify memory context was not retrieved
      expect((agent as any).getRelevantMemoryContext).not.toHaveBeenCalled();
      
      // Verify decision was made without memory
      expect((agent as any).makeDecisionWithMemory).toHaveBeenCalledWith(
        sampleMessage,
        null
      );
    });
    
    it('should not create memories when disabled', async () => {
      // Override the mock to access our implementation
      jest.spyOn(agent as any, 'processContactMessage').mockRestore();
      jest.spyOn(agent as any, 'getRelevantMemoryContext').mockResolvedValue(sampleMemoryContext);
      jest.spyOn(agent as any, 'makeDecisionWithMemory').mockResolvedValue({
        approach: 'test_approach',
        confidence: 0.9,
        alternatives: []
      });
      jest.spyOn(agent as any, 'createMemoriesFromInteraction').mockResolvedValue(undefined);
      
      // Disable memory creation
      (agent as any).memoryConfig.enableMemoryCreation = false;
      
      // Call the method
      await agent.processContactMessage(sampleMessage);
      
      // Verify memories were not created
      expect((agent as any).createMemoriesFromInteraction).not.toHaveBeenCalled();
    });
  });
  
  describe('getRelevantMemoryContext', () => {
    it('should create a context request with the correct parameters', async () => {
      // Call the method
      await (agent as any).getRelevantMemoryContext(sampleMessage);
      
      // Verify context request was created correctly
      expect((agent as any).memoryContextProvider.getContext).toHaveBeenCalledWith(
        expect.objectContaining({
          query: sampleMessage.content,
          organizationId: mockOrgId,
          userId: sampleMessage.user_id,
          agentId: mockAgentId,
          conversationId: sampleMessage.conversation_id,
          metadataFilters: {
            contact_id: sampleMessage.contact_id
          }
        })
      );
    });
  });
  
  describe('createMemoriesFromInteraction', () => {
    it('should create interaction memories for both message and response', async () => {
      // Call the method
      await (agent as any).createMemoriesFromInteraction(
        sampleMessage,
        sampleResponse,
        sampleMemoryContext
      );
      
      // Verify memories were created
      expect((agent as any).memoryService.createMemory).toHaveBeenCalledTimes(2);
      
      // Verify customer message memory
      expect((agent as any).memoryService.createMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrgId,
          user_id: sampleMessage.user_id,
          memory_type: AIMemoryType.INTERACTION,
          metadata: expect.objectContaining({
            contact_id: sampleMessage.contact_id,
            conversation_id: sampleMessage.conversation_id,
            message_id: sampleMessage.id
          })
        })
      );
      
      // Verify agent response memory
      expect((agent as any).memoryService.createMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrgId,
          user_id: sampleMessage.user_id,
          memory_type: AIMemoryType.INTERACTION,
          metadata: expect.objectContaining({
            contact_id: sampleMessage.contact_id,
            conversation_id: sampleMessage.conversation_id,
            message_id: sampleResponse.id
          })
        })
      );
    });
  });
  
  describe('extractInsightsFromMessage', () => {
    it('should extract preferences from message content', async () => {
      // Call the method
      await (agent as any).extractInsightsFromMessage(sampleMessage);
      
      // Verify preference memory was created
      expect((agent as any).memoryService.createMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrgId,
          memory_type: AIMemoryType.PREFERENCE,
          metadata: expect.objectContaining({
            contact_id: sampleMessage.contact_id,
            extracted: true
          })
        })
      );
    });
    
    it('should extract objections from message content', async () => {
      // Call the method
      await (agent as any).extractInsightsFromMessage(sampleMessage);
      
      // Verify objection memory was created
      expect((agent as any).memoryService.createMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrgId,
          memory_type: AIMemoryType.FEEDBACK,
          metadata: expect.objectContaining({
            contact_id: sampleMessage.contact_id,
            extracted: true,
            objection: true
          })
        })
      );
    });
  });
  
  describe('updateMemoryConfig', () => {
    it('should update memory configuration in database', async () => {
      // Call the method
      await agent.updateMemoryConfig({
        enableMemoryCreation: false,
        maxMemoriesToRetrieve: 5
      });
      
      // Verify config was updated locally
      expect((agent as any).memoryConfig.enableMemoryCreation).toBe(false);
      expect((agent as any).memoryConfig.maxMemoriesToRetrieve).toBe(5);
      
      // Verify database was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_memory_config');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_id: mockAgentId,
          organization_id: mockOrgId,
          enable_memory_creation: false,
          max_memories_to_retrieve: 5
        }),
        expect.anything()
      );
    });
  });
});

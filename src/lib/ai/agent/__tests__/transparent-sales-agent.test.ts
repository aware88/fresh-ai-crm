/**
 * TransparentSalesAgent Tests
 * 
 * Tests for the TransparentSalesAgent class that extends SalesAgentService
 * with transparency features.
 */

import { TransparentSalesAgent } from '../transparent-sales-agent';
import { TransparencyService } from '../../transparency/transparency-service';
import { v4 as uuidv4 } from 'uuid';
import config from '../../transparency/test.config.cjs';

// Mock UUID to return predictable values
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

// Mock the TransparencyService
jest.mock('../../transparency/transparency-service');

// Use test config data
const mockOrganizationId = config.organizationId;
const mockAgentId = config.testAgentId;
const mockActivityId = config.testActivityId;
const mockContactId = config.testContactId;
const mockMessageId = config.testMemoryId;
const mockResponseId = '123e4567-e89b-12d3-a456-426614174005';

describe('TransparentSalesAgent', () => {
  let transparentAgent: TransparentSalesAgent;
  let mockSupabaseClient: any;
  let mockOpenaiClient: any;
  
  beforeEach(() => {
    // Reset UUID mock
    (uuidv4 as jest.Mock).mockReset();
    (uuidv4 as jest.Mock).mockReturnValue('mocked-uuid');
    
    // Create mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis()
    };
    
    // Create mock OpenAI client
    mockOpenaiClient = {
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{
            embedding: Array(1536).fill(0.1),
            index: 0,
            object: 'embedding'
          }]
        })
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Mock response content'
              }
            }]
          })
        }
      }
    };
    
    // Mock TransparencyService implementation
    (TransparencyService as jest.Mock).mockImplementation(() => ({
      logActivity: jest.fn().mockResolvedValue({
        id: mockActivityId,
        agent_id: mockAgentId,
        activity_type: 'process_message',
        description: 'Processing message'
      }),
      logThought: jest.fn().mockResolvedValue({
        id: 'thought-id',
        activity_id: mockActivityId,
        thought_step: 1,
        reasoning: 'Analyzing message'
      }),
      getSettings: jest.fn().mockResolvedValue([
        { setting_key: 'activity_logging_enabled', setting_value: true },
        { setting_key: 'thought_logging_enabled', setting_value: true }
      ]),
      updateSetting: jest.fn().mockResolvedValue({
        id: 'setting-id',
        setting_key: 'activity_logging_enabled',
        setting_value: true
      })
    }));
    
    // Create TransparentSalesAgent instance
    transparentAgent = new TransparentSalesAgent(
      mockSupabaseClient,
      mockOpenaiClient,
      mockAgentId,
      mockOrganizationId
    );
    
    // Mock the parent class processContactMessage method
    transparentAgent.processContactMessage = jest.fn().mockResolvedValue({
      id: mockResponseId,
      content: 'Mock response content',
      contact_id: mockContactId
    });
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with the correct properties', () => {
      expect(transparentAgent.agentId).toBe(mockAgentId);
      expect(transparentAgent.organizationId).toBe(mockOrganizationId);
      expect(TransparencyService).toHaveBeenCalledWith(
        mockSupabaseClient,
        mockOrganizationId
      );
    });
    
    it('should load settings on initialization', () => {
      expect(transparentAgent.transparencyService.getSettings).toHaveBeenCalledWith(mockAgentId);
    });
  });
  
  describe('processContactMessage', () => {
    it('should log activities and thoughts when processing a message', async () => {
      // Setup
      const message = {
        id: mockMessageId,
        contact_id: mockContactId,
        content: 'Hello, I need help with your product.'
      };
      
      // Mock the parent class method to avoid infinite recursion
      const originalProcessContactMessage = transparentAgent.processContactMessage;
      transparentAgent.processContactMessage = jest.fn().mockResolvedValue({
        id: mockResponseId,
        content: 'Mock response content',
        contact_id: mockContactId
      });
      
      // Execute
      await transparentAgent.processContactMessage(message);
      
      // Assert
      expect(transparentAgent.transparencyService.logActivity).toHaveBeenCalledWith({
        agentId: mockAgentId,
        activityType: 'process_message',
        description: expect.stringContaining(mockContactId),
        relatedEntityType: 'contact',
        relatedEntityId: mockContactId,
        metadata: expect.objectContaining({ messageId: mockMessageId })
      });
      
      expect(transparentAgent.transparencyService.logThought).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: mockAgentId,
          activityId: mockActivityId,
          thoughtStep: expect.any(Number),
          reasoning: expect.stringContaining('Analyzing message')
        })
      );
      
      // Restore original method
      transparentAgent.processContactMessage = originalProcessContactMessage;
    });
    
    it('should not log activities when activity logging is disabled', async () => {
      // Setup
      transparentAgent.activityLoggingEnabled = false;
      
      const message = {
        id: mockMessageId,
        contact_id: mockContactId,
        content: 'Hello, I need help with your product.'
      };
      
      // Execute
      await transparentAgent.processContactMessage(message);
      
      // Assert
      expect(transparentAgent.transparencyService.logActivity).not.toHaveBeenCalled();
    });
    
    it('should not log thoughts when thought logging is disabled', async () => {
      // Setup
      transparentAgent.thoughtLoggingEnabled = false;
      
      const message = {
        id: mockMessageId,
        contact_id: mockContactId,
        content: 'Hello, I need help with your product.'
      };
      
      // Execute
      await transparentAgent.processContactMessage(message);
      
      // Assert
      expect(transparentAgent.transparencyService.logThought).not.toHaveBeenCalled();
    });
    
    it('should log errors when they occur', async () => {
      // Setup
      const message = {
        id: mockMessageId,
        contact_id: mockContactId,
        content: 'Hello, I need help with your product.'
      };
      
      const mockError = new Error('Processing error');
      transparentAgent.processContactMessage = jest.fn().mockRejectedValue(mockError);
      
      // Execute
      await expect(transparentAgent.processContactMessage(message)).rejects.toThrow(mockError);
      
      // Assert
      expect(transparentAgent.transparencyService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: mockAgentId,
          activityType: 'error',
          description: expect.stringContaining('Error processing message'),
          relatedEntityType: 'contact',
          relatedEntityId: mockContactId,
          metadata: expect.objectContaining({ 
            error: mockError.message,
            stack: mockError.stack
          })
        })
      );
    });
  });
  
  describe('setActivityLogging', () => {
    it('should update activity logging setting', async () => {
      // Execute
      await transparentAgent.setActivityLogging(false);
      
      // Assert
      expect(transparentAgent.activityLoggingEnabled).toBe(false);
      expect(transparentAgent.transparencyService.updateSetting).toHaveBeenCalledWith({
        settingKey: 'activity_logging_enabled',
        settingValue: false,
        agentId: mockAgentId
      });
    });
  });
  
  describe('setThoughtLogging', () => {
    it('should update thought logging setting', async () => {
      // Execute
      await transparentAgent.setThoughtLogging(false);
      
      // Assert
      expect(transparentAgent.thoughtLoggingEnabled).toBe(false);
      expect(transparentAgent.transparencyService.updateSetting).toHaveBeenCalledWith({
        settingKey: 'thought_logging_enabled',
        settingValue: false,
        agentId: mockAgentId
      });
    });
  });
  
  describe('getRelevantMemories', () => {
    it('should return relevant memories for a contact', async () => {
      // This is testing a private method, so we're using a workaround
      const memories = await (transparentAgent as any).getRelevantMemories(mockContactId, 'Hello');
      
      // Assert
      expect(memories).toHaveLength(2);
      expect(memories[0].content).toContain(mockContactId);
    });
  });
  
  describe('makeDecision', () => {
    it('should return a decision with approach and alternatives', async () => {
      // This is testing a private method, so we're using a workaround
      const message = { content: 'Hello' };
      const memories: any[] = [];
      
      const decision = await (transparentAgent as any).makeDecision(message, memories);
      
      // Assert
      expect(decision).toHaveProperty('approach');
      expect(decision).toHaveProperty('confidence');
      expect(decision).toHaveProperty('alternatives');
      expect(decision.alternatives).toBeInstanceOf(Array);
    });
  });
});

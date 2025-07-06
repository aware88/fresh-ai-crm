/**
 * TransparencyService Tests
 * 
 * Tests for the TransparencyService class that handles agent activities,
 * thoughts, and settings.
 */

import { TransparencyService } from '../transparency-service';
import { v4 as uuidv4 } from 'uuid';
import config from '../test.config.cjs';

// Mock UUID to return predictable values
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

// Use test config data
const mockOrganizationId = config.organizationId;
const mockAgentId = config.testAgentId;
const mockActivityId = config.testActivityId;
const mockUserId = config.testUserId;
const mockMemoryId = config.testMemoryId;

describe('TransparencyService', () => {
  let transparencyService: TransparencyService;
  let mockSupabaseClient: any;
  
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
      single: jest.fn().mockReturnThis()
    };
    
    // Create TransparencyService instance
    transparencyService = new TransparencyService(
      mockSupabaseClient,
      mockOrganizationId
    );
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('logActivity', () => {
    it('should log an activity successfully', async () => {
      // Setup
      const activityData = {
        agentId: mockAgentId,
        activityType: 'process_message',
        description: 'Processing message',
        relatedEntityType: 'contact',
        relatedEntityId: 'contact-123',
        metadata: { key: 'value' }
      };
      
      const mockResponse = {
        data: {
          id: 'mocked-uuid',
          organization_id: mockOrganizationId,
          ...activityData
        },
        error: null
      };
      
      mockSupabaseClient.insert.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.logActivity(activityData);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_activities');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        id: 'mocked-uuid',
        organization_id: mockOrganizationId,
        agent_id: activityData.agentId,
        activity_type: activityData.activityType,
        description: activityData.description,
        related_entity_type: activityData.relatedEntityType,
        related_entity_id: activityData.relatedEntityId,
        metadata: activityData.metadata,
        created_at: expect.any(String)
      });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should handle errors when logging an activity', async () => {
      // Setup
      const activityData = {
        agentId: mockAgentId,
        activityType: 'process_message',
        description: 'Processing message'
      };
      
      const mockError = new Error('Database error');
      mockSupabaseClient.insert.mockRejectedValue(mockError);
      
      // Execute
      const result = await transparencyService.logActivity(activityData);
      
      // Assert
      expect(console.error).toHaveBeenCalledWith('Error logging agent activity:', mockError);
      expect(result).toBeNull();
    });
    
    it('should handle Supabase errors', async () => {
      // Setup
      const activityData = {
        agentId: mockAgentId,
        activityType: 'process_message',
        description: 'Processing message'
      };
      
      const mockResponse = {
        data: null,
        error: { message: 'Database error' }
      };
      
      mockSupabaseClient.insert.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.logActivity(activityData);
      
      // Assert
      expect(console.error).toHaveBeenCalledWith('Failed to log agent activity:', mockResponse.error);
      expect(result).toBeNull();
    });
  });
  
  describe('logThought', () => {
    it('should log a thought successfully', async () => {
      // Setup
      const thoughtData = {
        agentId: mockAgentId,
        activityId: mockActivityId,
        thoughtStep: 1,
        reasoning: 'Analyzing message content',
        alternatives: ['option1', 'option2'],
        confidence: 0.8
      };
      
      const mockResponse = {
        data: {
          id: 'mocked-uuid',
          organization_id: mockOrganizationId,
          ...thoughtData
        },
        error: null
      };
      
      mockSupabaseClient.insert.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.logThought(thoughtData);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_thoughts');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        id: 'mocked-uuid',
        organization_id: mockOrganizationId,
        agent_id: thoughtData.agentId,
        activity_id: thoughtData.activityId,
        thought_step: thoughtData.thoughtStep,
        reasoning: thoughtData.reasoning,
        alternatives: thoughtData.alternatives,
        confidence: thoughtData.confidence,
        created_at: expect.any(String)
      });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should handle errors when logging a thought', async () => {
      // Setup
      const thoughtData = {
        agentId: mockAgentId,
        activityId: mockActivityId,
        thoughtStep: 1,
        reasoning: 'Analyzing message content'
      };
      
      const mockError = new Error('Database error');
      mockSupabaseClient.insert.mockRejectedValue(mockError);
      
      // Execute
      const result = await transparencyService.logThought(thoughtData);
      
      // Assert
      expect(console.error).toHaveBeenCalledWith('Error logging agent thought:', mockError);
      expect(result).toBeNull();
    });
  });
  
  describe('getAgentActivities', () => {
    it('should get activities for an agent', async () => {
      // Setup
      const mockActivities = [
        { id: 'activity-1', agent_id: mockAgentId, activity_type: 'process_message' },
        { id: 'activity-2', agent_id: mockAgentId, activity_type: 'response_generated' }
      ];
      
      const mockResponse = {
        data: mockActivities,
        error: null
      };
      
      mockSupabaseClient.range.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.getAgentActivities(mockAgentId, 10, 0);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_activities');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockActivities);
    });
    
    it('should handle errors when getting activities', async () => {
      // Setup
      const mockResponse = {
        data: null,
        error: { message: 'Database error' }
      };
      
      mockSupabaseClient.range.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.getAgentActivities(mockAgentId);
      
      // Assert
      expect(console.error).toHaveBeenCalledWith('Failed to get agent activities:', mockResponse.error);
      expect(result).toEqual([]);
    });
  });
  
  describe('getActivityThoughts', () => {
    it('should get thoughts for an activity', async () => {
      // Setup
      const mockThoughts = [
        { id: 'thought-1', activity_id: mockActivityId, thought_step: 1 },
        { id: 'thought-2', activity_id: mockActivityId, thought_step: 2 }
      ];
      
      const mockResponse = {
        data: mockThoughts,
        error: null
      };
      
      mockSupabaseClient.order.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.getActivityThoughts(mockActivityId);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_thoughts');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('activity_id', mockActivityId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('thought_step', { ascending: true });
      expect(result).toEqual(mockThoughts);
    });
    
    it('should handle errors when getting thoughts', async () => {
      // Setup
      const mockResponse = {
        data: null,
        error: { message: 'Database error' }
      };
      
      mockSupabaseClient.order.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.getActivityThoughts(mockActivityId);
      
      // Assert
      expect(console.error).toHaveBeenCalledWith('Failed to get activity thoughts:', mockResponse.error);
      expect(result).toEqual([]);
    });
  });
  
  describe('updateSetting', () => {
    it('should update an existing setting', async () => {
      // Setup
      const settingData = {
        settingKey: 'activity_logging_enabled',
        settingValue: true,
        agentId: mockAgentId
      };
      
      const existingSettingResponse = {
        data: { id: 'setting-1' },
        error: null
      };
      
      const updateResponse = {
        data: {
          id: 'setting-1',
          setting_key: settingData.settingKey,
          setting_value: settingData.settingValue,
          agent_id: settingData.agentId
        },
        error: null
      };
      
      mockSupabaseClient.maybeSingle.mockResolvedValue(existingSettingResponse);
      mockSupabaseClient.single.mockResolvedValue(updateResponse);
      
      // Execute
      const result = await transparencyService.updateSetting(settingData);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('setting_key', settingData.settingKey);
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('user_id', null);
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('agent_id', settingData.agentId);
      
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        setting_value: settingData.settingValue,
        updated_at: expect.any(String)
      });
      
      expect(result).toEqual(updateResponse.data);
    });
    
    it('should create a new setting if it does not exist', async () => {
      // Setup
      const settingData = {
        settingKey: 'new_setting',
        settingValue: 'value',
        userId: mockUserId
      };
      
      const existingSettingResponse = {
        data: null,
        error: null
      };
      
      const insertResponse = {
        data: {
          id: 'mocked-uuid',
          setting_key: settingData.settingKey,
          setting_value: settingData.settingValue,
          user_id: settingData.userId
        },
        error: null
      };
      
      mockSupabaseClient.maybeSingle.mockResolvedValue(existingSettingResponse);
      mockSupabaseClient.single.mockResolvedValue(insertResponse);
      
      // Execute
      const result = await transparencyService.updateSetting(settingData);
      
      // Assert
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        id: 'mocked-uuid',
        organization_id: mockOrganizationId,
        user_id: settingData.userId,
        agent_id: null,
        setting_key: settingData.settingKey,
        setting_value: settingData.settingValue,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
      
      expect(result).toEqual(insertResponse.data);
    });
    
    it('should handle errors when updating settings', async () => {
      // Setup
      const settingData = {
        settingKey: 'activity_logging_enabled',
        settingValue: true,
        agentId: mockAgentId
      };
      
      const mockError = new Error('Database error');
      mockSupabaseClient.maybeSingle.mockRejectedValue(mockError);
      
      // Execute
      const result = await transparencyService.updateSetting(settingData);
      
      // Assert
      expect(console.error).toHaveBeenCalledWith('Error updating agent setting:', mockError);
      expect(result).toBeNull();
    });
  });
  
  describe('getSettings', () => {
    it('should get settings for an agent', async () => {
      // Setup
      const mockSettings = [
        { id: 'setting-1', setting_key: 'key1', setting_value: 'value1', agent_id: mockAgentId },
        { id: 'setting-2', setting_key: 'key2', setting_value: 'value2', agent_id: mockAgentId }
      ];
      
      const mockResponse = {
        data: mockSettings,
        error: null
      };
      
      mockSupabaseClient.eq.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.getSettings(mockAgentId);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(result).toEqual(mockSettings);
    });
    
    it('should handle errors when getting settings', async () => {
      // Setup
      const mockResponse = {
        data: null,
        error: { message: 'Database error' }
      };
      
      mockSupabaseClient.eq.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.getSettings(mockAgentId);
      
      // Assert
      expect(console.error).toHaveBeenCalledWith('Failed to get agent settings:', mockResponse.error);
      expect(result).toEqual([]);
    });
  });
  
  describe('deleteMemory', () => {
    it('should delete a memory successfully', async () => {
      // Setup
      const mockResponse = {
        error: null
      };
      
      mockSupabaseClient.eq.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.deleteMemory(mockMemoryId);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_memories');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockMemoryId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(result).toBe(true);
    });
    
    it('should handle errors when deleting a memory', async () => {
      // Setup
      const mockResponse = {
        error: { message: 'Database error' }
      };
      
      mockSupabaseClient.eq.mockResolvedValue(mockResponse);
      
      // Execute
      const result = await transparencyService.deleteMemory(mockMemoryId);
      
      // Assert
      expect(console.error).toHaveBeenCalledWith('Failed to delete memory:', mockResponse.error);
      expect(result).toBe(false);
    });
  });
});

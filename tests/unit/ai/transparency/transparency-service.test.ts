/**
 * TransparencyService Tests
 * 
 * Tests for the TransparencyService class that handles agent activities,
 * thoughts, and settings.
 */

import { TransparencyService } from '../../../../src/lib/ai/transparency/transparency-service';
import * as uuid from 'uuid';
import { v4 as uuidv4 } from 'uuid';

// Mock UUID to return predictable values
jest.mock('uuid', () => {
  return {
    v4: jest.fn().mockReturnValue('mocked-uuid')
  };
});

// Test configuration
const config = {
  organizationId: '123e4567-e89b-12d3-a456-426614174000',
  testAgentId: '123e4567-e89b-12d3-a456-426614174001',
  testActivityId: '123e4567-e89b-12d3-a456-426614174002',
  testUserId: '123e4567-e89b-12d3-a456-426614174003',
  testMemoryId: '123e4567-e89b-12d3-a456-426614174004',
};

// Use test config data
const mockOrganizationId = config.organizationId;
const mockAgentId = config.testAgentId;
const mockActivityId = config.testActivityId;
const mockUserId = config.testUserId;
const mockMemoryId = config.testMemoryId;

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
console.error = jest.fn();

describe('TransparencyService', () => {
  let transparencyService: TransparencyService;
  let mockSupabaseClient: any;
  
  beforeEach(() => {
    // Reset UUID mock
    (uuidv4 as jest.Mock).mockReset();
    (uuidv4 as jest.Mock).mockReturnValue('mocked-uuid');
    
    // Reset console.error mock
    jest.clearAllMocks();
    
    // Create service instance with mock client
    mockSupabaseClient = {
      from: jest.fn()
    };
    
    transparencyService = new TransparencyService(mockSupabaseClient, mockOrganizationId);
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
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
      
      const mockResponseData = {
        id: 'mocked-uuid',
        organization_id: mockOrganizationId,
        agent_id: mockAgentId,
        activity_type: 'process_message',
        description: 'Processing message',
        related_entity_type: 'contact',
        related_entity_id: 'contact-123',
        metadata: { key: 'value' },
        created_at: '2023-01-01T00:00:00Z'
      };
      
      const mockResponse = {
        data: mockResponseData,
        error: null
      };
      
      // Set up the mock chain
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      
      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      });
      
      // Execute
      const result = await transparencyService.logActivity(activityData);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_activities');
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'mocked-uuid',
        organization_id: mockOrganizationId,
        agent_id: mockAgentId,
        activity_type: 'process_message',
        description: 'Processing message',
        related_entity_type: 'contact',
        related_entity_id: 'contact-123',
        metadata: { key: 'value' },
        created_at: expect.any(String)
      });
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockResponseData);
    });
    
    it('should handle errors when logging an activity', async () => {
      // Setup
      const activityData = {
        agentId: mockAgentId,
        activityType: 'process_message',
        description: 'Processing message'
      };
      
      const mockErrorObj = { message: 'Database error' };
      const mockResponse = {
        data: null,
        error: mockErrorObj
      };
      
      // Set up the mock chain
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      
      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      });
      
      // Execute
      const result = await transparencyService.logActivity(activityData);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_activities');
      expect(console.error).toHaveBeenCalledWith('Failed to log agent activity:', mockErrorObj);
      expect(result).toBeNull();
    });
    
    it('should handle Supabase errors', async () => {
      // Setup
      const activityData = {
        agentId: mockAgentId,
        activityType: 'process_message',
        description: 'Processing message'
      };
      
      const mockError = new Error('Database connection error');
      
      // Make the from() method throw an error
      mockSupabaseClient.from.mockImplementation(() => {
        throw mockError;
      });
      
      // Execute
      const result = await transparencyService.logActivity(activityData);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_activities');
      expect(console.error).toHaveBeenCalledWith('Error logging agent activity:', mockError);
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
      
      const mockResponseData = {
        id: 'mocked-uuid',
        organization_id: mockOrganizationId,
        agent_id: mockAgentId,
        activity_id: mockActivityId,
        thought_step: 1,
        reasoning: 'Analyzing message content',
        alternatives: ['option1', 'option2'],
        confidence: 0.8,
        created_at: '2023-01-01T00:00:00Z'
      };
      
      const mockResponse = {
        data: mockResponseData,
        error: null
      };
      
      // Set up the mock chain
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      
      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      });
      
      // Execute
      const result = await transparencyService.logThought(thoughtData);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_thoughts');
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'mocked-uuid',
        organization_id: mockOrganizationId,
        agent_id: mockAgentId,
        activity_id: mockActivityId,
        thought_step: 1,
        reasoning: 'Analyzing message content',
        alternatives: ['option1', 'option2'],
        confidence: 0.8,
        created_at: expect.any(String)
      });
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockResponseData);
    });
    
    it('should handle errors when logging a thought', async () => {
      // Setup
      const thoughtData = {
        agentId: mockAgentId,
        activityId: mockActivityId,
        thoughtStep: 1,
        reasoning: 'Analyzing message content'
      };
      
      const mockErrorObj = { message: 'Database error' };
      const mockResponse = {
        data: null,
        error: mockErrorObj
      };
      
      // Set up the mock chain
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      
      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      });
      
      // Execute
      const result = await transparencyService.logThought(thoughtData);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_thoughts');
      expect(console.error).toHaveBeenCalledWith('Failed to log agent thought:', mockErrorObj);
      expect(result).toBeNull();
    });
  });
  
  describe('getAgentActivities', () => {
    it('should get activities for an agent', async () => {
      // Setup
      const mockActivities = [
        { id: 'activity-1', description: 'First activity' },
        { id: 'activity-2', description: 'Second activity' }
      ];
      
      const mockResponse = {
        data: mockActivities,
        error: null
      };
      
      // IMPORTANT: Match the exact order of chained methods in the implementation
      // this.supabase.from('ai_agent_activities').select('*').eq('agent_id', agentId).eq('organization_id', this.organizationId)...
      const mockRange = jest.fn().mockResolvedValue(mockResponse);
      const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });
      
      // Execute
      const result = await transparencyService.getAgentActivities(mockAgentId, 10);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_activities');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq1).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(mockEq2).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockRange).toHaveBeenCalledWith(0, 9); // offset to offset + limit - 1
      expect(result).toEqual(mockActivities);
    });
    
    it('should handle errors when getting activities', async () => {
      // Setup
      const mockErrorObj = { message: 'Database error' };
      const mockResponse = {
        data: null,
        error: mockErrorObj
      };
      
      // Set up the mock chain
      const mockRange = jest.fn().mockResolvedValue(mockResponse);
      const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });
      
      // Execute
      const result = await transparencyService.getAgentActivities(mockAgentId);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_activities');
      expect(console.error).toHaveBeenCalledWith('Failed to get agent activities:', mockErrorObj);
      expect(result).toEqual([]);
    });
  });
  
  describe('getActivityThoughts', () => {
    it('should get thoughts for an activity', async () => {
      // Setup
      const mockThoughts = [
        { id: 'thought-1', reasoning: 'First thought' },
        { id: 'thought-2', reasoning: 'Second thought' }
      ];
      
      const mockResponse = {
        data: mockThoughts,
        error: null
      };
      
      // IMPORTANT: Match the exact order of chained methods in the implementation
      // this.supabase.from('ai_agent_thoughts').select('*').eq('activity_id', activityId).eq('organization_id', this.organizationId)...
      const mockOrder = jest.fn().mockResolvedValue(mockResponse);
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });
      
      // Execute
      const result = await transparencyService.getActivityThoughts(mockActivityId);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_thoughts');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq1).toHaveBeenCalledWith('activity_id', mockActivityId);
      expect(mockEq2).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockOrder).toHaveBeenCalledWith('thought_step', { ascending: true });
      expect(result).toEqual(mockThoughts);
    });
    
    it('should handle errors when getting thoughts', async () => {
      // Setup
      const mockErrorObj = { message: 'Database error' };
      const mockResponse = {
        data: null,
        error: mockErrorObj
      };
      
      // Set up the mock chain
      const mockOrder = jest.fn().mockResolvedValue(mockResponse);
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });
      
      // Execute
      const result = await transparencyService.getActivityThoughts(mockActivityId);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_thoughts');
      expect(console.error).toHaveBeenCalledWith('Failed to get activity thoughts:', mockErrorObj);
      expect(result).toEqual([]);
    });
  });
  
  describe('updateSetting', () => {
    it('should handle error when getting setting', async () => {
      // Arrange
      const settingData = {
        settingKey: 'test-setting',
        settingValue: { enabled: true },
        userId: undefined,
        agentId: mockAgentId
      };
      
      const mockErrorObj = { message: 'Database error' };
      const mockResponse = {
        data: null,
        error: mockErrorObj
      };
      
      // Set up mock to throw an error
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database query error');
      });
      
      // Execute
      const result = await transparencyService.updateSetting(settingData);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(console.error).toHaveBeenCalledWith('Error updating agent setting:', new Error('Database query error'));
      expect(result).toBeNull();
    });
    
    it('should update an existing setting', async () => {
      // Arrange
      const settingData = {
        settingKey: 'test-setting',
        settingValue: { enabled: true },
        userId: undefined,
        agentId: mockAgentId
      };
      
      const existingSetting = {
        id: 'existing-setting-id'
      };
      
      const getResponse = {
        data: existingSetting,
        error: null
      };
      
      const updateResponseData = {
        id: 'existing-setting-id', 
        setting_value: { enabled: true },
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      const updateResponse = {
        data: updateResponseData,
        error: null
      };
      
      // Set up mock for "maybeSingle" query to find existing setting
      const mockMaybeSingle = jest.fn().mockResolvedValue(getResponse);
      const mockIs2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockIs1 = jest.fn().mockReturnValue({ is: mockIs2 });
      const mockEq2 = jest.fn().mockReturnValue({ is: mockIs1 });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect1 = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      // Set up mock for update query
      const mockSingle = jest.fn().mockResolvedValue(updateResponse);
      const mockSelect2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq3 = jest.fn().mockReturnValue({ select: mockSelect2 });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq3 });
      
      // Handle different table accesses
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'ai_agent_settings') {
          return {
            select: mockSelect1,
            update: mockUpdate
          };
        }
        return {};
      });
      
      // Execute
      const result = await transparencyService.updateSetting(settingData);
      
      // Assert for select query
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(mockSelect1).toHaveBeenCalledWith('id');
      expect(mockEq1).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockEq2).toHaveBeenCalledWith('setting_key', settingData.settingKey);
      expect(mockIs1).toHaveBeenCalledWith('user_id', null);
      expect(mockIs2).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(mockMaybeSingle).toHaveBeenCalled();
      
      // Assert for update query
      expect(mockUpdate).toHaveBeenCalledWith({
        setting_value: settingData.settingValue,
        updated_at: expect.any(String)
      });
      expect(mockEq3).toHaveBeenCalledWith('id', existingSetting.id);
      expect(mockSelect2).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      
      expect(result).toEqual(updateResponseData);
    });
    
    it('should create a new setting if it does not exist', async () => {
      // Arrange
      const settingData = {
        settingKey: 'test-setting',
        settingValue: { enabled: true },
        userId: mockUserId,
        agentId: undefined
      };
      
      // No existing setting found
      const getResponse = {
        data: null,
        error: null
      };
      
      const insertResponseData = {
        id: 'mocked-uuid', 
        setting_key: 'test-setting', 
        setting_value: { enabled: true }
      };
      
      const insertResponse = {
        data: insertResponseData,
        error: null
      };
      
      // Set up mock for "maybeSingle" query to find no existing setting
      const mockMaybeSingle = jest.fn().mockResolvedValue(getResponse);
      const mockIs2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockIs1 = jest.fn().mockReturnValue({ is: mockIs2 });
      const mockEq2 = jest.fn().mockReturnValue({ is: mockIs1 });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect1 = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      // Set up mock for insert query
      const mockSingle = jest.fn().mockResolvedValue(insertResponse);
      const mockSelect2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect2 });
      
      // Handle different table accesses
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'ai_agent_settings') {
          return {
            select: mockSelect1,
            insert: mockInsert
          };
        }
        return {};
      });
      
      // Execute
      const result = await transparencyService.updateSetting(settingData);
      
      // Assert for select query
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(mockSelect1).toHaveBeenCalledWith('id');
      expect(mockEq1).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockEq2).toHaveBeenCalledWith('setting_key', settingData.settingKey);
      expect(mockIs1).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockIs2).toHaveBeenCalledWith('agent_id', null);
      expect(mockMaybeSingle).toHaveBeenCalled();
      
      // Assert for insert query
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'mocked-uuid',
        organization_id: mockOrganizationId,
        user_id: mockUserId,
        agent_id: null,
        setting_key: settingData.settingKey,
        setting_value: settingData.settingValue,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
      
      expect(result).toEqual(insertResponseData);
    });
    
    it('should handle error when inserting setting', async () => {
      // Arrange
      const settingData = {
        settingKey: 'test-setting',
        settingValue: { enabled: true },
        userId: mockUserId,
        agentId: undefined
      };
      
      // No existing setting found
      const getResponse = {
        data: null,
        error: null
      };
      
      const insertErrorObj = { message: 'Database insertion error' };
      const insertResponse = {
        data: null,
        error: insertErrorObj
      };
      
      // Set up mock for "maybeSingle" query to find no existing setting
      const mockMaybeSingle = jest.fn().mockResolvedValue(getResponse);
      const mockIs2 = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockIs1 = jest.fn().mockReturnValue({ is: mockIs2 });
      const mockEq2 = jest.fn().mockReturnValue({ is: mockIs1 });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect1 = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      // Set up mock for insert query with error
      const mockSingle = jest.fn().mockResolvedValue(insertResponse);
      const mockSelect2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect2 });
      
      // Handle different table accesses
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'ai_agent_settings') {
          return {
            select: mockSelect1,
            insert: mockInsert
          };
        }
        return {};
      });
      
      // Execute
      const result = await transparencyService.updateSetting(settingData);
      
      // Assert for select query
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      
      // Assert for insert query
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'mocked-uuid',
        organization_id: mockOrganizationId,
        user_id: mockUserId,
        agent_id: null,
        setting_key: settingData.settingKey,
        setting_value: settingData.settingValue,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
      
      expect(console.error).toHaveBeenCalledWith('Failed to create agent setting:', insertErrorObj);
      expect(result).toBeNull();
    });
  });
  
  describe('getSettings', () => {
    it('should get settings for an agent', async () => {
      // Setup
      const mockSettings = [
        { setting_key: 'activity_logging_enabled', setting_value: true },
        { setting_key: 'thought_logging_enabled', setting_value: false }
      ];
      
      const mockResponse = {
        data: mockSettings,
        error: null
      };
      
      // Set up the mock chain for when agentId is provided
      // The chain should be: from -> select -> eq -> eq -> (resolves to mockResponse)
      const mockEq2 = jest.fn().mockResolvedValue(mockResponse);
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });
      
      // Execute
      const result = await transparencyService.getSettings(mockAgentId);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq1).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(mockEq2).toHaveBeenCalledWith('agent_id', mockAgentId);
      expect(result).toEqual(mockSettings);
    });
    
    it('should handle errors when getting settings', async () => {
      // Setup
      const mockErrorObj = { message: 'Database error' };
      const mockResponse = {
        data: null,
        error: mockErrorObj
      };
      
      // Set up the mock chain
      const mockEq = jest.fn().mockResolvedValue(mockResponse);
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      
      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });
      
      // Execute
      const result = await transparencyService.getSettings();
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(console.error).toHaveBeenCalledWith('Failed to get agent settings:', mockErrorObj);
      expect(result).toEqual([]);
    });
  });
  
  describe('deleteMemory', () => {
    it('should delete a memory successfully', async () => {
      // Setup
      const mockResponse = {
        data: {},
        error: null
      };
      
      // Set up the mock chain
      const mockEq2 = jest.fn().mockResolvedValue(mockResponse);
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete
      });
      
      // Execute
      const result = await transparencyService.deleteMemory(mockMemoryId);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_memories');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('id', mockMemoryId);
      expect(mockEq2).toHaveBeenCalledWith('organization_id', mockOrganizationId);
      expect(result).toBe(true);
    });
    
    it('should handle errors when deleting a memory', async () => {
      // Setup
      const mockErrorObj = { message: 'Database error' };
      const mockResponse = {
        data: null,
        error: mockErrorObj
      };
      
      // Set up the mock chain
      const mockEq2 = jest.fn().mockResolvedValue(mockResponse);
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete
      });
      
      // Execute
      const result = await transparencyService.deleteMemory(mockMemoryId);
      
      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_memories');
      expect(console.error).toHaveBeenCalledWith('Failed to delete memory:', mockErrorObj);
      expect(result).toBe(false);
    });
  });
});

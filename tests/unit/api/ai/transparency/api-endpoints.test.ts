/**
 * AI Transparency API Endpoints Tests
 * 
 * Tests for the API endpoints that handle transparency features
 * including memories, activities, thoughts, and settings.
 */

import { createMocks } from 'node-mocks-http';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';

// Mock UUID to return predictable values
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Test configuration
const config = {
  organizationId: '123e4567-e89b-12d3-a456-426614174000',
  testAgentId: '123e4567-e89b-12d3-a456-426614174001',
  testActivityId: '123e4567-e89b-12d3-a456-426614174002',
  testUserId: '123e4567-e89b-12d3-a456-426614174003',
  testMemoryId: '123e4567-e89b-12d3-a456-426614174004',
};

// Global mock Supabase client
const mockSupabaseClient = {
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

// Import handlers after mocks are set up
import { GET as getMemoriesHandler } from '../../../../../src/app/api/ai/transparency/memories/route';
import { GET as getActivitiesHandler } from '../../../../../src/app/api/ai/transparency/activities/route';
import { GET as getThoughtsHandler } from '../../../../../src/app/api/ai/transparency/thoughts/route';
import { GET as getSettingsHandler, PUT as updateSettingsHandler } from '../../../../../src/app/api/ai/transparency/settings/route';
import { DELETE as deleteMemoryHandler } from '../../../../../src/app/api/ai/transparency/memories/[id]/route';

describe('AI Transparency API Endpoints', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('mocked-uuid');
    
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: config.testUserId,
        email: 'test@example.com',
        organizationId: config.organizationId
      }
    });
  });
  
  describe('/api/ai/transparency/memories', () => {
    it('should return memories for a contact', async () => {
      // Setup
      const mockMemories = [
        { id: 'memory-1', content: 'Memory 1', contact_id: 'contact-123' },
        { id: 'memory-2', content: 'Memory 2', contact_id: 'contact-123' }
      ];
      
      mockSupabaseClient.range.mockResolvedValue({
        data: mockMemories,
        error: null
      });
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          contactId: 'contact-123',
          limit: '10',
          offset: '0'
        }
      });
      
      // Execute
      await getMemoriesHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockMemories);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_memories');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('contact_id', 'contact-123');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', config.organizationId);
    });
    
    it('should return 401 if not authenticated', async () => {
      // Setup
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          contactId: 'contact-123'
        }
      });
      
      // Execute
      await getMemoriesHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(401);
    });
    
    it('should return 400 if contactId is missing', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });
      
      // Execute
      await getMemoriesHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
    });
    
    it('should handle database errors', async () => {
      // Setup
      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          contactId: 'contact-123'
        }
      });
      
      // Execute
      await getMemoriesHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(500);
    });
  });
  
  describe('/api/ai/transparency/activities', () => {
    it('should return activities for an agent', async () => {
      // Setup
      const mockActivities = [
        { id: 'activity-1', agent_id: config.testAgentId, activity_type: 'process_message' },
        { id: 'activity-2', agent_id: config.testAgentId, activity_type: 'generate_response' }
      ];
      
      mockSupabaseClient.range.mockResolvedValue({
        data: mockActivities,
        error: null
      });
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          agentId: config.testAgentId,
          limit: '10',
          offset: '0'
        }
      });
      
      // Execute
      await getActivitiesHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockActivities);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_activities');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('agent_id', config.testAgentId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', config.organizationId);
    });
    
    it('should return 401 if not authenticated', async () => {
      // Setup
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          agentId: config.testAgentId
        }
      });
      
      // Execute
      await getActivitiesHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(401);
    });
    
    it('should return 400 if agentId is missing', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });
      
      // Execute
      await getActivitiesHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
    });
  });
  
  describe('/api/ai/transparency/thoughts', () => {
    it('should return thoughts for an activity', async () => {
      // Setup
      const mockThoughts = [
        { id: 'thought-1', activity_id: config.testActivityId, thought_step: 1 },
        { id: 'thought-2', activity_id: config.testActivityId, thought_step: 2 }
      ];
      
      mockSupabaseClient.order.mockResolvedValue({
        data: mockThoughts,
        error: null
      });
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          activityId: config.testActivityId
        }
      });
      
      // Execute
      await getThoughtsHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockThoughts);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_thoughts');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('activity_id', config.testActivityId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', config.organizationId);
    });
    
    it('should return 401 if not authenticated', async () => {
      // Setup
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          activityId: config.testActivityId
        }
      });
      
      // Execute
      await getThoughtsHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(401);
    });
    
    it('should return 400 if activityId is missing', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });
      
      // Execute
      await getThoughtsHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
    });
  });
  
  describe('/api/ai/transparency/settings', () => {
    it('should return settings for an agent', async () => {
      // Setup
      const mockSettings = [
        { id: 'setting-1', agent_id: config.testAgentId, setting_key: 'activity_logging_enabled', setting_value: true },
        { id: 'setting-2', agent_id: config.testAgentId, setting_key: 'thought_logging_enabled', setting_value: true }
      ];
      
      mockSupabaseClient.eq.mockResolvedValue({
        data: mockSettings,
        error: null
      });
      
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          agentId: config.testAgentId
        }
      });
      
      // Execute
      await getSettingsHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockSettings);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('agent_id', config.testAgentId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', config.organizationId);
    });
    
    it('should update a setting', async () => {
      // Setup
      const settingData = {
        settingKey: 'activity_logging_enabled',
        settingValue: false,
        agentId: config.testAgentId
      };
      
      const mockResponse = {
        data: {
          id: 'setting-1',
          agent_id: config.testAgentId,
          setting_key: 'activity_logging_enabled',
          setting_value: false
        },
        error: null
      };
      
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: { id: 'setting-1' },
        error: null
      });
      
      mockSupabaseClient.single.mockResolvedValue(mockResponse);
      
      const { req, res } = createMocks({
        method: 'PUT',
        body: settingData
      });
      
      // Execute
      await updateSettingsHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockResponse.data);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        setting_value: settingData.settingValue,
        updated_at: expect.any(String)
      });
    });
    
    it('should return 400 if setting data is invalid', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'PUT',
        body: {
          // Missing required fields
        }
      });
      
      // Execute
      await updateSettingsHandler(req);
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
    });
  });
  
  describe('/api/ai/transparency/memories/[id]', () => {
    it('should delete a memory', async () => {
      // Setup
      mockSupabaseClient.eq.mockResolvedValue({
        error: null
      });
      
      const { req, res } = createMocks({
        method: 'DELETE',
        query: {
          id: config.testMemoryId
        }
      });
      
      // Execute
      await deleteMemoryHandler(req, { params: { id: config.testMemoryId } });
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_memories');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', config.testMemoryId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('organization_id', config.organizationId);
    });
    
    it('should return 401 if not authenticated', async () => {
      // Setup
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const { req, res } = createMocks({
        method: 'DELETE',
        query: {
          id: config.testMemoryId
        }
      });
      
      // Execute
      await deleteMemoryHandler(req, { params: { id: config.testMemoryId } });
      
      // Assert
      expect(res._getStatusCode()).toBe(401);
    });
    
    it('should return 500 if database error occurs', async () => {
      // Setup
      mockSupabaseClient.eq.mockResolvedValue({
        error: { message: 'Database error' }
      });
      
      const { req, res } = createMocks({
        method: 'DELETE',
        query: {
          id: config.testMemoryId
        }
      });
      
      // Execute
      await deleteMemoryHandler(req, { params: { id: config.testMemoryId } });
      
      // Assert
      expect(res._getStatusCode()).toBe(500);
    });
  });
});

/**
 * AI Transparency API Endpoints Tests
 * 
 * Tests for the API endpoints that provide transparency features
 * for AI agents in the CRM system.
 */

import { createMocks } from 'node-mocks-http';
import { GET as getMemories, DELETE as deleteMemory, PUT as updateMemory } from '../../../app/api/ai/transparency/memories/route';
import { GET as getActivities } from '../../../app/api/ai/transparency/activities/route';
import { GET as getThoughts } from '../../../app/api/ai/transparency/thoughts/route';
import { GET as getSettings, PUT as updateSettings } from '../../../app/api/ai/transparency/settings/route';

// Mock the auth helpers
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabaseClient)
}));

// Mock the Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id' }
        }
      }
    })
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  rpc: jest.fn().mockReturnThis()
};

// Mock data
const mockMemories = [
  { id: 'memory-1', content: 'Test memory 1', memory_type: 'contact', organization_id: 'org-1' },
  { id: 'memory-2', content: 'Test memory 2', memory_type: 'product', organization_id: 'org-1' }
];

const mockActivities = [
  { id: 'activity-1', agent_id: 'agent-1', activity_type: 'process_message', organization_id: 'org-1' },
  { id: 'activity-2', agent_id: 'agent-1', activity_type: 'response_generated', organization_id: 'org-1' }
];

const mockThoughts = [
  { id: 'thought-1', activity_id: 'activity-1', thought_step: 1, reasoning: 'Analysis 1', organization_id: 'org-1' },
  { id: 'thought-2', activity_id: 'activity-1', thought_step: 2, reasoning: 'Analysis 2', organization_id: 'org-1' }
];

const mockSettings = [
  { id: 'setting-1', agent_id: 'agent-1', setting_key: 'activity_logging_enabled', setting_value: true, organization_id: 'org-1' },
  { id: 'setting-2', agent_id: 'agent-1', setting_key: 'thought_logging_enabled', setting_value: true, organization_id: 'org-1' }
];

describe('AI Transparency API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/ai/transparency/memories', () => {
    test('GET should return memories with proper filtering', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          memoryType: 'contact',
          limit: '10',
          offset: '0'
        }
      });

      mockSupabaseClient.range.mockResolvedValue({
        data: mockMemories.filter(m => m.memory_type === 'contact'),
        error: null
      });

      // Execute
      await getMemories(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.memories).toHaveLength(1);
      expect(data.memories[0].id).toBe('memory-1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_memories');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('memory_type', 'contact');
    });

    test('DELETE should delete a memory', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'DELETE',
        query: {
          id: 'memory-1'
        }
      });

      mockSupabaseClient.eq.mockResolvedValue({
        error: null
      });

      // Execute
      await deleteMemory(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_memories');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'memory-1');
    });

    test('PUT should update a memory', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'PUT',
        body: {
          id: 'memory-1',
          content: 'Updated memory content',
          importanceScore: 0.9
        }
      });

      mockSupabaseClient.eq.mockResolvedValue({
        data: {
          id: 'memory-1',
          content: 'Updated memory content',
          importance_score: 0.9
        },
        error: null
      });

      // Execute
      await updateMemory(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.memory.id).toBe('memory-1');
      expect(data.memory.content).toBe('Updated memory content');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_memories');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        content: 'Updated memory content',
        importance_score: 0.9,
        updated_at: expect.any(String)
      });
    });
  });

  describe('/api/ai/transparency/activities', () => {
    test('GET should return activities for an agent', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          agentId: 'agent-1',
          limit: '10',
          offset: '0'
        }
      });

      mockSupabaseClient.range.mockResolvedValue({
        data: mockActivities,
        error: null
      });

      // Execute
      await getActivities(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.activities).toHaveLength(2);
      expect(data.activities[0].id).toBe('activity-1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_activities');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('agent_id', 'agent-1');
    });

    test('GET should handle filtering by activity type', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          agentId: 'agent-1',
          activityType: 'process_message',
          limit: '10',
          offset: '0'
        }
      });

      mockSupabaseClient.range.mockResolvedValue({
        data: mockActivities.filter(a => a.activity_type === 'process_message'),
        error: null
      });

      // Execute
      await getActivities(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.activities).toHaveLength(1);
      expect(data.activities[0].activity_type).toBe('process_message');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('activity_type', 'process_message');
    });
  });

  describe('/api/ai/transparency/thoughts', () => {
    test('GET should return thoughts for an activity', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          activityId: 'activity-1'
        }
      });

      mockSupabaseClient.order.mockResolvedValue({
        data: mockThoughts,
        error: null
      });

      // Execute
      await getThoughts(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.thoughts).toHaveLength(2);
      expect(data.thoughts[0].id).toBe('thought-1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_thoughts');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('activity_id', 'activity-1');
    });
  });

  describe('/api/ai/transparency/settings', () => {
    test('GET should return settings for an agent', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          agentId: 'agent-1'
        }
      });

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockSettings,
        error: null
      });

      // Execute
      await getSettings(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.settings).toHaveLength(2);
      expect(data.settings[0].setting_key).toBe('activity_logging_enabled');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('agent_id', 'agent-1');
    });

    test('PUT should update a setting', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'PUT',
        body: {
          agentId: 'agent-1',
          settingKey: 'activity_logging_enabled',
          settingValue: false
        }
      });

      // Mock the existing setting check
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'setting-1',
          setting_key: 'activity_logging_enabled',
          setting_value: false
        },
        error: null
      });

      // Execute
      await updateSettings(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.setting.setting_key).toBe('activity_logging_enabled');
      expect(data.setting.setting_value).toBe(false);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_agent_settings');
    });
  });

  describe('Error handling', () => {
    test('should handle unauthorized access', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          agentId: 'agent-1'
        }
      });

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Not authenticated' }
      });

      // Execute
      await getActivities(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Unauthorized');
    });

    test('should handle database errors', async () => {
      // Setup
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          agentId: 'agent-1'
        }
      });

      mockSupabaseClient.range.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      // Execute
      await getActivities(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Failed to fetch activities');
    });
  });
});

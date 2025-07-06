/**
 * AI Transparency UI Components Tests
 * 
 * Tests for React components that display and manage transparency features
 * including MemoryBrowser, ActivityTimeline, and AgentControlPanel.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryBrowser } from '../../../../../src/components/ai/transparency/MemoryBrowser';
import { ActivityTimeline } from '../../../../../src/components/ai/transparency/ActivityTimeline';
import { AgentControlPanel } from '../../../../../src/components/ai/transparency/AgentControlPanel';

// Mock fetch
global.fetch = jest.fn();

// Test configuration
const config = {
  organizationId: '123e4567-e89b-12d3-a456-426614174000',
  testAgentId: '123e4567-e89b-12d3-a456-426614174001',
  testActivityId: '123e4567-e89b-12d3-a456-426614174002',
  testContactId: '123e4567-e89b-12d3-a456-426614174003',
  testMemoryId: '123e4567-e89b-12d3-a456-426614174004',
};

describe('AI Transparency UI Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MemoryBrowser', () => {
    const mockMemories = [
      {
        id: config.testMemoryId,
        content: 'Test memory content',
        memory_type: 'conversation',
        importance_score: 0.8,
        created_at: '2023-01-01T12:00:00Z',
        metadata: { source: 'user' }
      },
      {
        id: 'memory-2',
        content: 'Another test memory',
        memory_type: 'preference',
        importance_score: 0.6,
        created_at: '2023-01-02T12:00:00Z',
        metadata: { source: 'system' }
      }
    ];

    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMemories
      });
    });

    it('renders and fetches memories for a contact', async () => {
      // Render component
      render(<MemoryBrowser contactId={config.testContactId} />);
      
      // Check loading state
      expect(screen.getByText('Loading memories...')).toBeInTheDocument();
      
      // Wait for memories to load
      await waitFor(() => {
        expect(screen.getByText('Test memory content')).toBeInTheDocument();
      });
      
      // Check that fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ai/transparency/memories?contactId=${config.testContactId}`),
        expect.any(Object)
      );
      
      // Check that both memories are displayed
      expect(screen.getByText('Test memory content')).toBeInTheDocument();
      expect(screen.getByText('Another test memory')).toBeInTheDocument();
    });

    it('allows filtering memories by type', async () => {
      // Render component
      render(<MemoryBrowser contactId={config.testContactId} />);
      
      // Wait for memories to load
      await waitFor(() => {
        expect(screen.getByText('Test memory content')).toBeInTheDocument();
      });
      
      // Filter by conversation type
      fireEvent.click(screen.getByLabelText('Filter by type'));
      fireEvent.click(screen.getByText('conversation'));
      
      // Check that only conversation memories are shown
      expect(screen.getByText('Test memory content')).toBeInTheDocument();
      expect(screen.queryByText('Another test memory')).not.toBeInTheDocument();
    });

    it('allows deleting a memory', async () => {
      // Mock the delete API call
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('delete')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockMemories
        });
      });
      
      // Render component
      render(<MemoryBrowser contactId={config.testContactId} />);
      
      // Wait for memories to load
      await waitFor(() => {
        expect(screen.getByText('Test memory content')).toBeInTheDocument();
      });
      
      // Click delete button on first memory
      fireEvent.click(screen.getAllByLabelText('Delete memory')[0]);
      
      // Confirm deletion
      fireEvent.click(screen.getByText('Confirm'));
      
      // Check that delete API was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/ai/transparency/memories/${config.testMemoryId}`),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    it('handles API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      // Render component
      render(<MemoryBrowser contactId={config.testContactId} />);
      
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Error loading memories')).toBeInTheDocument();
      });
    });
  });

  describe('ActivityTimeline', () => {
    const mockActivities = [
      {
        id: config.testActivityId,
        agent_id: config.testAgentId,
        activity_type: 'process_message',
        description: 'Processing user message',
        created_at: '2023-01-01T12:00:00Z',
        related_entity_type: 'contact',
        related_entity_id: config.testContactId,
        metadata: { messageId: 'msg-1' }
      },
      {
        id: 'activity-2',
        agent_id: config.testAgentId,
        activity_type: 'generate_response',
        description: 'Generating response',
        created_at: '2023-01-01T12:01:00Z',
        related_entity_type: 'contact',
        related_entity_id: config.testContactId,
        metadata: { responseId: 'resp-1' }
      }
    ];

    const mockThoughts = [
      {
        id: 'thought-1',
        activity_id: config.testActivityId,
        thought_step: 1,
        reasoning: 'Analyzing user intent',
        confidence: 0.8,
        created_at: '2023-01-01T12:00:10Z'
      },
      {
        id: 'thought-2',
        activity_id: config.testActivityId,
        thought_step: 2,
        reasoning: 'Formulating response strategy',
        alternatives: ['Option A', 'Option B'],
        confidence: 0.7,
        created_at: '2023-01-01T12:00:20Z'
      }
    ];

    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('thoughts')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockThoughts
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockActivities
        });
      });
    });

    it('renders and fetches activities for an agent', async () => {
      // Render component
      render(<ActivityTimeline agentId={config.testAgentId} />);
      
      // Check loading state
      expect(screen.getByText('Loading activities...')).toBeInTheDocument();
      
      // Wait for activities to load
      await waitFor(() => {
        expect(screen.getByText('Processing user message')).toBeInTheDocument();
      });
      
      // Check that fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ai/transparency/activities?agentId=${config.testAgentId}`),
        expect.any(Object)
      );
      
      // Check that both activities are displayed
      expect(screen.getByText('Processing user message')).toBeInTheDocument();
      expect(screen.getByText('Generating response')).toBeInTheDocument();
    });

    it('expands an activity to show thoughts', async () => {
      // Render component
      render(<ActivityTimeline agentId={config.testAgentId} />);
      
      // Wait for activities to load
      await waitFor(() => {
        expect(screen.getByText('Processing user message')).toBeInTheDocument();
      });
      
      // Click to expand the first activity
      fireEvent.click(screen.getByText('Processing user message'));
      
      // Check that thoughts API was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ai/transparency/thoughts?activityId=${config.testActivityId}`),
        expect.any(Object)
      );
      
      // Wait for thoughts to load
      await waitFor(() => {
        expect(screen.getByText('Analyzing user intent')).toBeInTheDocument();
      });
      
      // Check that both thoughts are displayed
      expect(screen.getByText('Analyzing user intent')).toBeInTheDocument();
      expect(screen.getByText('Formulating response strategy')).toBeInTheDocument();
    });

    it('allows filtering activities by type', async () => {
      // Render component
      render(<ActivityTimeline agentId={config.testAgentId} />);
      
      // Wait for activities to load
      await waitFor(() => {
        expect(screen.getByText('Processing user message')).toBeInTheDocument();
      });
      
      // Filter by process_message type
      fireEvent.click(screen.getByLabelText('Filter by type'));
      fireEvent.click(screen.getByText('process_message'));
      
      // Check that only process_message activities are shown
      expect(screen.getByText('Processing user message')).toBeInTheDocument();
      expect(screen.queryByText('Generating response')).not.toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      // Render component
      render(<ActivityTimeline agentId={config.testAgentId} />);
      
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Error loading activities')).toBeInTheDocument();
      });
    });
  });

  describe('AgentControlPanel', () => {
    const mockSettings = [
      {
        id: 'setting-1',
        agent_id: config.testAgentId,
        setting_key: 'activity_logging_enabled',
        setting_value: true,
        created_at: '2023-01-01T12:00:00Z'
      },
      {
        id: 'setting-2',
        agent_id: config.testAgentId,
        setting_key: 'thought_logging_enabled',
        setting_value: true,
        created_at: '2023-01-01T12:00:00Z'
      }
    ];

    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        if (options && options.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ...mockSettings[0],
              setting_value: JSON.parse(options.body).settingValue
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockSettings
        });
      });
    });

    it('renders and fetches settings for an agent', async () => {
      // Render component
      render(<AgentControlPanel agentId={config.testAgentId} />);
      
      // Check loading state
      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
      
      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByLabelText('Activity Logging')).toBeInTheDocument();
      });
      
      // Check that fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ai/transparency/settings?agentId=${config.testAgentId}`),
        expect.any(Object)
      );
      
      // Check that both settings are displayed and enabled
      expect(screen.getByLabelText('Activity Logging')).toBeChecked();
      expect(screen.getByLabelText('Thought Logging')).toBeChecked();
    });

    it('allows toggling activity logging', async () => {
      // Render component
      render(<AgentControlPanel agentId={config.testAgentId} />);
      
      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByLabelText('Activity Logging')).toBeInTheDocument();
      });
      
      // Toggle activity logging off
      fireEvent.click(screen.getByLabelText('Activity Logging'));
      
      // Check that update API was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/ai/transparency/settings'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"settingKey":"activity_logging_enabled"'),
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );
      });
    });

    it('allows toggling thought logging', async () => {
      // Render component
      render(<AgentControlPanel agentId={config.testAgentId} />);
      
      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByLabelText('Thought Logging')).toBeInTheDocument();
      });
      
      // Toggle thought logging off
      fireEvent.click(screen.getByLabelText('Thought Logging'));
      
      // Check that update API was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/ai/transparency/settings'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"settingKey":"thought_logging_enabled"'),
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );
      });
    });

    it('handles API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      // Render component
      render(<AgentControlPanel agentId={config.testAgentId} />);
      
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Error loading settings')).toBeInTheDocument();
      });
    });

    it('shows a success message after saving settings', async () => {
      // Render component
      render(<AgentControlPanel agentId={config.testAgentId} />);
      
      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByLabelText('Activity Logging')).toBeInTheDocument();
      });
      
      // Toggle activity logging off
      fireEvent.click(screen.getByLabelText('Activity Logging'));
      
      // Check for success message
      await waitFor(() => {
        expect(screen.getByText('Settings updated successfully')).toBeInTheDocument();
      });
    });
  });
});

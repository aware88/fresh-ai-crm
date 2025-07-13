/**
 * AI Transparency UI Components Tests
 * 
 * Tests for the React components that provide transparency features
 * for AI agents in the CRM system.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { MemoryBrowser } from './MemoryBrowser';
import { ActivityTimeline } from './ActivityTimeline';
import { AgentControlPanel } from './AgentControlPanel';

// Mock fetch
global.fetch = jest.fn();

// Mock data
const mockMemories = [
  { 
    id: 'memory-1', 
    content: 'Test memory 1', 
    memory_type: 'contact', 
    importance_score: 0.8,
    created_at: '2025-07-01T10:00:00Z',
    metadata: { source: 'test' } 
  },
  { 
    id: 'memory-2', 
    content: 'Test memory 2', 
    memory_type: 'product', 
    importance_score: 0.6,
    created_at: '2025-07-02T10:00:00Z',
    metadata: { source: 'test' } 
  }
];

const mockActivities = [
  { 
    id: 'activity-1', 
    agent_id: 'agent-1', 
    activity_type: 'process_message', 
    description: 'Processing message',
    created_at: '2025-07-01T10:00:00Z',
    related_entity_type: 'contact',
    related_entity_id: 'contact-1',
    metadata: { messageId: 'message-1' }
  },
  { 
    id: 'activity-2', 
    agent_id: 'agent-1', 
    activity_type: 'response_generated', 
    description: 'Generated response',
    created_at: '2025-07-01T10:01:00Z',
    related_entity_type: 'contact',
    related_entity_id: 'contact-1',
    metadata: { responseId: 'response-1' }
  }
];

const mockThoughts = [
  { 
    id: 'thought-1', 
    activity_id: 'activity-1', 
    thought_step: 1, 
    reasoning: 'Analyzing message content',
    alternatives: ['Option 1', 'Option 2'],
    confidence: 0.8,
    created_at: '2025-07-01T10:00:30Z'
  },
  { 
    id: 'thought-2', 
    activity_id: 'activity-1', 
    thought_step: 2, 
    reasoning: 'Deciding on response approach',
    alternatives: ['Approach 1', 'Approach 2'],
    confidence: 0.7,
    created_at: '2025-07-01T10:00:45Z'
  }
];

const mockSettings = [
  { id: 'setting-1', agent_id: 'agent-1', setting_key: 'activity_logging_enabled', setting_value: true },
  { id: 'setting-2', agent_id: 'agent-1', setting_key: 'thought_logging_enabled', setting_value: true },
  { id: 'setting-3', agent_id: 'agent-1', setting_key: 'memory_access_level', setting_value: 'full' },
  { id: 'setting-4', agent_id: 'agent-1', setting_key: 'personality_tone', setting_value: 'professional' }
];

describe('AI Transparency UI Components', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('MemoryBrowser', () => {
    test('renders memories and allows search', async () => {
      // Mock fetch response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memories: mockMemories })
      });

      // Render component
      render(
        <ThemeProvider>
          <MemoryBrowser agentId="agent-1" />
        </ThemeProvider>
      );

      // Wait for memories to load
      await waitFor(() => {
        expect(screen.getByText('Test memory 1')).toBeInTheDocument();
      });

      // Check if both memories are displayed
      expect(screen.getByText('Test memory 1')).toBeInTheDocument();
      expect(screen.getByText('Test memory 2')).toBeInTheDocument();

      // Check if search functionality works
      const searchInput = screen.getByPlaceholderText(/search memories/i);
      fireEvent.change(searchInput, { target: { value: 'memory 1' } });
      
      // Mock search response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memories: [mockMemories[0]] })
      });

      // Submit search
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
      
      // Wait for search results
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    test('handles memory deletion', async () => {
      // Mock fetch responses
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memories: mockMemories })
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Render component
      render(
        <ThemeProvider>
          <MemoryBrowser agentId="agent-1" />
        </ThemeProvider>
      );

      // Wait for memories to load
      await waitFor(() => {
        expect(screen.getByText('Test memory 1')).toBeInTheDocument();
      });

      // Find and click delete button for first memory
      const deleteButtons = screen.getAllByLabelText(/delete memory/i);
      fireEvent.click(deleteButtons[0]);

      // Confirm deletion in modal
      const confirmButton = await screen.findByText(/confirm/i);
      fireEvent.click(confirmButton);

      // Verify delete API was called
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/ai/transparency/memories?id=memory-1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  describe('ActivityTimeline', () => {
    test('renders activities and allows expanding thoughts', async () => {
      // Mock fetch responses for activities
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      });

      // Render component
      render(
        <ThemeProvider>
          <ActivityTimeline agentId="agent-1" />
        </ThemeProvider>
      );

      // Wait for activities to load
      await waitFor(() => {
        expect(screen.getByText('Processing message')).toBeInTheDocument();
      });

      // Check if both activities are displayed
      expect(screen.getByText('Processing message')).toBeInTheDocument();
      expect(screen.getByText('Generated response')).toBeInTheDocument();

      // Mock fetch response for thoughts
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ thoughts: mockThoughts })
      });

      // Click expand button to view thoughts
      const expandButtons = screen.getAllByLabelText(/view thought process/i);
      fireEvent.click(expandButtons[0]);

      // Wait for thoughts to load
      await waitFor(() => {
        expect(screen.getByText('Analyzing message content')).toBeInTheDocument();
      });

      // Check if thoughts are displayed
      expect(screen.getByText('Analyzing message content')).toBeInTheDocument();
      expect(screen.getByText('Deciding on response approach')).toBeInTheDocument();
    });

    test('handles filtering by activity type', async () => {
      // Mock fetch responses
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      });

      // Render component
      render(
        <ThemeProvider>
          <ActivityTimeline agentId="agent-1" />
        </ThemeProvider>
      );

      // Wait for activities to load
      await waitFor(() => {
        expect(screen.getByText('Processing message')).toBeInTheDocument();
      });

      // Mock filtered response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: [mockActivities[0]] })
      });

      // Select activity type filter
      const filterSelect = screen.getByLabelText(/filter by type/i);
      fireEvent.change(filterSelect, { target: { value: 'process_message' } });

      // Wait for filtered results
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('activityType=process_message'),
          expect.any(Object)
        );
      });
    });
  });

  describe('AgentControlPanel', () => {
    test('renders settings and allows updates', async () => {
      // Mock fetch responses
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: mockSettings })
      });

      // Render component
      render(
        <ThemeProvider>
          <AgentControlPanel agentId="agent-1" />
        </ThemeProvider>
      );

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByText(/activity logging/i)).toBeInTheDocument();
      });

      // Toggle a switch
      const activityLoggingSwitch = screen.getByLabelText(/activity logging/i);
      expect(activityLoggingSwitch).toBeChecked();
      
      // Mock update response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          setting: {
            id: 'setting-1',
            setting_key: 'activity_logging_enabled',
            setting_value: false
          }
        })
      });

      // Toggle the switch off
      fireEvent.click(activityLoggingSwitch);

      // Wait for update API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/ai/transparency/settings'),
          expect.objectContaining({ 
            method: 'PUT',
            body: expect.stringContaining('"settingValue":false')
          })
        );
      });
    });

    test('handles saving all settings', async () => {
      // Mock fetch responses
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: mockSettings })
      });

      // Render component
      render(
        <ThemeProvider>
          <AgentControlPanel agentId="agent-1" />
        </ThemeProvider>
      );

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByText(/activity logging/i)).toBeInTheDocument();
      });

      // Mock multiple setting updates
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ setting: {} })
      });

      // Click save button
      const saveButton = screen.getByText(/save settings/i);
      fireEvent.click(saveButton);

      // Wait for save API calls
      await waitFor(() => {
        // Should make multiple API calls to update settings
        expect(fetch).toHaveBeenCalledTimes(5); // Initial load + 4 settings
      });
    });
  });
});

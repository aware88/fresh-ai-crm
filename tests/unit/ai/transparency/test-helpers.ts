/**
 * AI Transparency Test Helpers
 * 
 * Utility functions for testing the AI Transparency System, including
 * generators for test activities, thoughts, settings, and contact messages.
 */

import { v4 as uuidv4 } from 'uuid';

// Test configuration with default IDs for consistency
export const testConfig = {
  organizationId: '123e4567-e89b-12d3-a456-426614174000',
  testAgentId: '123e4567-e89b-12d3-a456-426614174001',
  testActivityId: '123e4567-e89b-12d3-a456-426614174002',
  testContactId: '123e4567-e89b-12d3-a456-426614174003',
  testUserId: '123e4567-e89b-12d3-a456-426614174004',
  testMemoryId: '123e4567-e89b-12d3-a456-426614174005',
};

/**
 * Generate a random string of specified length
 * @param length Length of the string to generate
 * @returns Random string
 */
export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a test activity object with default values that can be overridden
 * @param overrides Properties to override in the default activity
 * @returns Test activity object
 */
export function generateTestActivity(overrides: Record<string, any> = {}) {
  const testRunId = uuidv4();
  
  const defaultActivity = {
    id: testConfig.testActivityId,
    agent_id: testConfig.testAgentId,
    organization_id: testConfig.organizationId,
    activity_type: 'process_message',
    description: 'Processing message from contact',
    related_entity_type: 'contact',
    related_entity_id: testConfig.testContactId,
    created_at: new Date().toISOString(),
    metadata: {
      source: 'test-script',
      testRunId,
      messageId: uuidv4(),
      ...overrides.metadata
    },
    ...overrides
  };
  
  delete defaultActivity.metadata?.metadata;
  
  return defaultActivity;
}

/**
 * Generate a test thought object with default values that can be overridden
 * @param overrides Properties to override in the default thought
 * @returns Test thought object
 */
export function generateTestThought(overrides: Record<string, any> = {}) {
  const testRunId = uuidv4();
  
  const defaultThought = {
    id: uuidv4(),
    agent_id: testConfig.testAgentId,
    activity_id: testConfig.testActivityId,
    organization_id: testConfig.organizationId,
    thought_step: 1,
    reasoning: 'Analyzing the user message to understand intent',
    alternatives: ['Option A', 'Option B', 'Option C'],
    confidence: 0.85,
    created_at: new Date().toISOString(),
    metadata: {
      source: 'test-script',
      testRunId,
      ...overrides.metadata
    },
    ...overrides
  };
  
  delete defaultThought.metadata?.metadata;
  
  return defaultThought;
}

/**
 * Generate a test setting object with default values that can be overridden
 * @param overrides Properties to override in the default setting
 * @returns Test setting object
 */
export function generateTestSetting(overrides: Record<string, any> = {}) {
  const testRunId = uuidv4();
  
  const defaultSetting = {
    id: uuidv4(),
    organization_id: testConfig.organizationId,
    agent_id: testConfig.testAgentId,
    user_id: null,
    setting_key: 'activity_logging_enabled',
    setting_value: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      source: 'test-script',
      testRunId,
      ...overrides.metadata
    },
    ...overrides
  };
  
  delete defaultSetting.metadata?.metadata;
  
  return defaultSetting;
}

/**
 * Generate a test memory object with default values that can be overridden
 * @param overrides Properties to override in the default memory
 * @returns Test memory object
 */
export function generateTestMemory(overrides: Record<string, any> = {}) {
  const testRunId = uuidv4();
  
  const defaultMemory = {
    id: testConfig.testMemoryId,
    organization_id: testConfig.organizationId,
    content: 'This is a test memory about customer preferences',
    memory_type: 'preference',
    importance_score: 0.8,
    contact_id: testConfig.testContactId,
    embedding: Array(1536).fill(0.1),
    created_at: new Date().toISOString(),
    metadata: {
      source: 'test-script',
      testRunId,
      ...overrides.metadata
    },
    ...overrides
  };
  
  delete defaultMemory.metadata?.metadata;
  
  return defaultMemory;
}

/**
 * Generate a test contact message object with default values that can be overridden
 * @param overrides Properties to override in the default message
 * @returns Test contact message object
 */
export function generateTestContactMessage(overrides: Record<string, any> = {}) {
  const testRunId = uuidv4();
  
  const defaultMessage = {
    id: uuidv4(),
    contact_id: testConfig.testContactId,
    content: 'Hello, I need help with your product.',
    created_at: new Date().toISOString(),
    metadata: {
      source: 'test-script',
      testRunId,
      ...overrides.metadata
    },
    ...overrides
  };
  
  delete defaultMessage.metadata?.metadata;
  
  return defaultMessage;
}

/**
 * Validate an activity object has the required properties
 * @param activity Activity object to validate
 * @returns Boolean indicating if the activity is valid
 */
export function isValidActivity(activity: any): boolean {
  return (
    activity &&
    typeof activity === 'object' &&
    typeof activity.agent_id === 'string' &&
    typeof activity.activity_type === 'string' &&
    typeof activity.description === 'string'
  );
}

/**
 * Validate a thought object has the required properties
 * @param thought Thought object to validate
 * @returns Boolean indicating if the thought is valid
 */
export function isValidThought(thought: any): boolean {
  return (
    thought &&
    typeof thought === 'object' &&
    typeof thought.agent_id === 'string' &&
    typeof thought.activity_id === 'string' &&
    typeof thought.thought_step === 'number' &&
    typeof thought.reasoning === 'string'
  );
}

/**
 * Validate a setting object has the required properties
 * @param setting Setting object to validate
 * @returns Boolean indicating if the setting is valid
 */
export function isValidSetting(setting: any): boolean {
  return (
    setting &&
    typeof setting === 'object' &&
    typeof setting.setting_key === 'string' &&
    setting.setting_value !== undefined
  );
}

/**
 * Create a mock Supabase client for testing
 * @param customResponses Custom responses for specific methods
 * @returns Mock Supabase client
 */
export function createMockSupabaseClient(customResponses = {}) {
  const defaultResponses = {
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
    rpc: jest.fn().mockReturnThis(),
    ...customResponses
  };
  
  return defaultResponses;
}

/**
 * Create a mock OpenAI client for testing
 * @returns Mock OpenAI client
 */
export function createMockOpenAIClient() {
  return {
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
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

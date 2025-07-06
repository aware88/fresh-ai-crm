/**
 * Test Helpers for AI Transparency System
 * 
 * This file contains utility functions to assist with testing the AI Transparency System.
 */

const { v4: uuidv4 } = require('uuid');
const config = require('./test.config.cjs');

/**
 * Generates a test activity object with default values that can be overridden
 * @param {Object} overrides - Properties to override the default test activity
 * @returns {Object} A test activity object
 */
function generateTestActivity(overrides = {}) {
  const testRunId = uuidv4();
  
  const defaultActivity = {
    agentId: config.testAgentId,
    activityType: 'process_message',
    description: 'Processing message from contact',
    relatedEntityType: 'contact',
    relatedEntityId: config.testContactId,
    organizationId: config.organizationId,
    metadata: {
      source: 'test-script',
      testRunId,
      messageId: uuidv4(),
      ...overrides.metadata
    },
    ...overrides
  };

  // Remove any undefined values that might have come from overrides
  Object.keys(defaultActivity).forEach(key => {
    if (defaultActivity[key] === undefined) {
      delete defaultActivity[key];
    }
  });

  return defaultActivity;
}

/**
 * Generates a test thought object with default values that can be overridden
 * @param {Object} overrides - Properties to override the default test thought
 * @returns {Object} A test thought object
 */
function generateTestThought(overrides = {}) {
  const activityId = overrides.activityId || config.testActivityId;
  
  const defaultThought = {
    agentId: config.testAgentId,
    activityId,
    thoughtStep: 1,
    reasoning: 'Analyzing message content for intent',
    alternatives: ['Option 1', 'Option 2'],
    confidence: 0.85,
    organizationId: config.organizationId,
    ...overrides
  };

  // Remove any undefined values that might have come from overrides
  Object.keys(defaultThought).forEach(key => {
    if (defaultThought[key] === undefined) {
      delete defaultThought[key];
    }
  });

  return defaultThought;
}

/**
 * Generates a test setting object with default values that can be overridden
 * @param {Object} overrides - Properties to override the default test setting
 * @returns {Object} A test setting object
 */
function generateTestSetting(overrides = {}) {
  const settingKey = overrides.settingKey || 'activity_logging_enabled';
  
  const defaultSetting = {
    settingKey,
    settingValue: true,
    agentId: config.testAgentId,
    userId: null,
    organizationId: config.organizationId,
    ...overrides
  };

  // Remove any undefined values that might have come from overrides
  Object.keys(defaultSetting).forEach(key => {
    if (defaultSetting[key] === undefined) {
      delete defaultSetting[key];
    }
  });

  return defaultSetting;
}

/**
 * Validates that an activity object has all required fields
 * @param {Object} activity - The activity object to validate
 * @returns {boolean} True if the activity is valid, false otherwise
 */
function isValidActivity(activity) {
  if (!activity) return false;
  
  const requiredFields = [
    'id',
    'agentId',
    'activityType',
    'description',
    'organizationId',
    'createdAt'
  ];
  
  return requiredFields.every(field => {
    const snakeCase = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return field in activity || snakeCase in activity;
  });
}

/**
 * Validates that a thought object has all required fields
 * @param {Object} thought - The thought object to validate
 * @returns {boolean} True if the thought is valid, false otherwise
 */
function isValidThought(thought) {
  if (!thought) return false;
  
  const requiredFields = [
    'id',
    'agentId',
    'activityId',
    'thoughtStep',
    'reasoning',
    'organizationId',
    'createdAt'
  ];
  
  return requiredFields.every(field => {
    const snakeCase = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return field in thought || snakeCase in thought;
  });
}

/**
 * Validates that a setting object has all required fields
 * @param {Object} setting - The setting object to validate
 * @returns {boolean} True if the setting is valid, false otherwise
 */
function isValidSetting(setting) {
  if (!setting) return false;
  
  const requiredFields = [
    'id',
    'settingKey',
    'settingValue',
    'organizationId',
    'createdAt',
    'updatedAt'
  ];
  
  return requiredFields.every(field => {
    const snakeCase = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return field in setting || snakeCase in setting;
  });
}

/**
 * Generates a mock contact message for testing
 * @param {Object} overrides - Properties to override the default message
 * @returns {Object} A mock contact message
 */
function generateMockContactMessage(overrides = {}) {
  return {
    id: uuidv4(),
    contact_id: config.testContactId,
    content: 'Hello, I need information about your product.',
    created_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Sleeps for the specified number of milliseconds
 * @param {number} ms - Number of milliseconds to sleep
 * @returns {Promise} A promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validates that an error matches the expected error structure
 * @param {Error} error - The error to validate
 * @param {string} expectedMessage - The expected error message or part of it
 * @returns {boolean} True if the error matches the expected structure
 */
function isExpectedError(error, expectedMessage) {
  if (!error) return false;
  return error.message.includes(expectedMessage);
}

module.exports = {
  generateTestActivity,
  generateTestThought,
  generateTestSetting,
  isValidActivity,
  isValidThought,
  isValidSetting,
  generateMockContactMessage,
  sleep,
  isExpectedError
};

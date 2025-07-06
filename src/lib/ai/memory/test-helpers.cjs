/**
 * Test Helpers for AI Memory System
 * 
 * This file contains utility functions to assist with testing the AI Memory System.
 */

const { v4: uuidv4 } = require('uuid');
const config = require('./test.config.cjs');

/**
 * Generates a test memory object with default values that can be overridden
 * @param {Object} overrides - Properties to override the default test memory
 * @returns {Object} A test memory object
 */
function generateTestMemory(overrides = {}) {
  const testRunId = uuidv4();
  
  const defaultMemory = {
    content: 'This is a test memory',
    memoryType: 'test',
    importanceScore: 0.8,
    organizationId: config.organizationId,
    metadata: {
      source: 'test-script',
      testRunId,
      ...overrides.metadata
    },
    ...overrides
  };

  // Remove any undefined values that might have come from overrides
  Object.keys(defaultMemory).forEach(key => {
    if (defaultMemory[key] === undefined) {
      delete defaultMemory[key];
    }
  });

  return defaultMemory;
}

/**
 * Generates a random string of the specified length
 * @param {number} length - Length of the random string to generate
 * @returns {string} A random string
 */
function generateRandomString(length = 10) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Generates a test search query with a random component to ensure uniqueness
 * @param {string} baseQuery - The base search query
 * @returns {string} A unique search query
 */
function generateTestQuery(baseQuery = 'test query') {
  return `${baseQuery} ${generateRandomString(8)}`;
}

/**
 * Validates that a memory object has all required fields
 * @param {Object} memory - The memory object to validate
 * @returns {boolean} True if the memory is valid, false otherwise
 */
function isValidMemory(memory) {
  if (!memory) return false;
  
  const requiredFields = [
    'id',
    'content',
    'memoryType',
    'organizationId',
    'createdAt',
    'updatedAt'
  ];
  
  return requiredFields.every(field => field in memory);
}

/**
 * Validates that a search result contains the expected fields
 * @param {Object} result - The search result to validate
 * @returns {boolean} True if the result is valid, false otherwise
 */
function isValidSearchResult(result) {
  if (!result) return false;
  
  const requiredFields = [
    'id',
    'content',
    'memoryType',
    'similarity',
    'metadata'
  ];
  
  return requiredFields.every(field => field in result);
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
  generateTestMemory,
  generateRandomString,
  generateTestQuery,
  isValidMemory,
  isValidSearchResult,
  sleep,
  isExpectedError
};

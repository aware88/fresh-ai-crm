/**
 * Agent Memory Integration Test
 * 
 * This script tests the integration between the sales agent and memory systems,
 * including database migrations, memory configuration, and memory-enhanced agent functionality.
 * 
 * Usage:
 * 1. Copy agent-memory-test.env.sample to .env in the tests/memory directory
 * 2. Update the AUTH_TOKEN with a valid authentication token
 * 3. Run the script using: node test-agent-memory-integration.js
 */

import 'dotenv/config';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Check if --mock flag is provided
const useMockServer = process.argv.includes('--mock');

// Configuration
const API_BASE_URL = useMockServer 
  ? 'http://localhost:3001/api' 
  : (process.env.API_BASE_URL || 'http://localhost:3000/api');

// For testing purposes, use a hardcoded token if not provided
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJvcmdfaWQiOiIxMjM0NTY3OC05YWJjLWRlZjAtMTIzNC01Njc4OWFiY2RlZjAiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MjUwOTYwMDAsImV4cCI6MTkzODQ1NjAwMH0.qwertyuiopasdfghjklzxcvbnm1234567890';
const AGENT_ID = process.env.AGENT_ID || uuidv4();
const CONTACT_ID = process.env.CONTACT_ID || uuidv4();

console.log('Using configuration:');
console.log('- API_BASE_URL:', API_BASE_URL);
console.log('- AGENT_ID:', AGENT_ID);
console.log('- CONTACT_ID:', CONTACT_ID);
console.log('- Using mock server:', useMockServer ? 'Yes' : 'No');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  results: []
};

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { status: response.status, data };
    } else {
      const text = await response.text();
      return { status: response.status, text };
    }
  } catch (error) {
    console.error(`❌ API Request Error: ${error.message}`);
    return { status: 500, error: error.message };
  }
}

// Test function
async function runTest(name, testFn, skip = false) {
  if (skip) {
    console.log(`⏭️ SKIPPED: ${name}`);
    testResults.skipped++;
    testResults.results.push({ name, status: 'skipped' });
    return;
  }

  console.log(`\n🧪 RUNNING TEST: ${name}`);
  try {
    await testFn();
    console.log(`✅ PASSED: ${name}`);
    testResults.passed++;
    testResults.results.push({ name, status: 'passed' });
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.results.push({ name, status: 'failed', error: error.message });
  }
}

// Test 1: Create agent memory configuration
async function testCreateAgentMemoryConfig() {
  const config = {
    agentId: AGENT_ID,
    enableMemoryCreation: true,
    enableMemoryRetrieval: true,
    maxMemoriesToRetrieve: 15,
    minRelevanceScore: 0.65,
    memoryTypes: ['preference', 'feedback', 'interaction']
  };

  const response = await apiRequest('/memory/agent-config', 'POST', config);
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Failed to create agent memory config: ${JSON.stringify(response)}`);
  }
  
  console.log('   Created agent memory config:', response.data.id);
  return response.data;
}

// Test 2: Get agent memory configuration
async function testGetAgentMemoryConfig() {
  const response = await apiRequest(`/memory/agent-config/${AGENT_ID}`);
  
  if (response.status !== 200) {
    throw new Error(`Failed to get agent memory config: ${JSON.stringify(response)}`);
  }
  
  console.log('   Retrieved agent memory config:', response.data.id);
  
  // Validate config properties
  const config = response.data;
  if (!config.enableMemoryCreation && config.enableMemoryCreation !== false) {
    throw new Error('Missing enableMemoryCreation property');
  }
  if (!config.enableMemoryRetrieval && config.enableMemoryRetrieval !== false) {
    throw new Error('Missing enableMemoryRetrieval property');
  }
  if (!config.maxMemoriesToRetrieve) {
    throw new Error('Missing maxMemoriesToRetrieve property');
  }
  if (!config.minRelevanceScore && config.minRelevanceScore !== 0) {
    throw new Error('Missing minRelevanceScore property');
  }
  if (!Array.isArray(config.memoryTypes)) {
    throw new Error('Missing or invalid memoryTypes property');
  }
  
  return config;
}

// Test 3: Update agent memory configuration
async function testUpdateAgentMemoryConfig() {
  const updatedConfig = {
    enableMemoryCreation: false,
    maxMemoriesToRetrieve: 5,
    minRelevanceScore: 0.8
  };

  const response = await apiRequest(`/memory/agent-config/${AGENT_ID}`, 'PATCH', updatedConfig);
  
  if (response.status !== 200) {
    throw new Error(`Failed to update agent memory config: ${JSON.stringify(response)}`);
  }
  
  console.log('   Updated agent memory config');
  
  // Verify the update
  const getResponse = await apiRequest(`/memory/agent-config/${AGENT_ID}`);
  
  if (getResponse.data.enableMemoryCreation !== false ||
      getResponse.data.maxMemoriesToRetrieve !== 5 ||
      getResponse.data.minRelevanceScore !== 0.8) {
    throw new Error('Config update verification failed');
  }
  
  return getResponse.data;
}

// Test 4: Process message with memory-enhanced agent
async function testProcessMessageWithMemory() {
  const message = {
    contactId: CONTACT_ID,
    content: "I'm interested in your premium plan, but I'm concerned about the price. Can you tell me more about the features?"
  };

  const response = await apiRequest(`/agents/${AGENT_ID}/process-message`, 'POST', message);
  
  if (response.status !== 200) {
    throw new Error(`Failed to process message: ${JSON.stringify(response)}`);
  }
  
  console.log('   Processed message with memory-enhanced agent');
  console.log('   Agent response:', response.data.content.substring(0, 50) + '...');
  
  // Check if memory context was used
  if (!response.data.memoryContextId) {
    console.log('   ⚠️ Warning: No memory context was used in this response');
  } else {
    console.log('   Memory context ID:', response.data.memoryContextId);
  }
  
  return response.data;
}

// Test 5: Get memory insights for contact
async function testGetContactMemoryInsights() {
  const response = await apiRequest(`/memory/contact-insights/${CONTACT_ID}`);
  
  if (response.status !== 200) {
    throw new Error(`Failed to get contact memory insights: ${JSON.stringify(response)}`);
  }
  
  console.log('   Retrieved contact memory insights');
  console.log('   Number of insights:', response.data.length);
  
  // Log some insights if available
  if (response.data.length > 0) {
    console.log('   Sample insights:');
    response.data.slice(0, 2).forEach(insight => {
      console.log(`     - [${insight.memory_type}] ${insight.content.substring(0, 50)}...`);
    });
  }
  
  return response.data;
}

// Test 6: Get agent memory statistics
async function testGetAgentMemoryStats() {
  const response = await apiRequest(`/memory/agent-stats/${AGENT_ID}`);
  
  if (response.status !== 200) {
    throw new Error(`Failed to get agent memory stats: ${JSON.stringify(response)}`);
  }
  
  console.log('   Retrieved agent memory statistics');
  console.log('   Total memories:', response.data.total_memories);
  console.log('   Memory types:', response.data.memory_types.map(t => `${t.memory_type}(${t.count})`).join(', '));
  
  return response.data;
}

// Main test sequence
async function runTests() {
  console.log('🚀 Starting Agent Memory Integration Tests');
  console.log('==========================================');
  console.log('Agent ID:', AGENT_ID);
  console.log('Contact ID:', CONTACT_ID);
  console.log('API Base URL:', API_BASE_URL);
  console.log('==========================================\n');

  try {
    // Run tests in sequence
    await runTest('Create Agent Memory Configuration', testCreateAgentMemoryConfig);
    await runTest('Get Agent Memory Configuration', testGetAgentMemoryConfig);
    await runTest('Update Agent Memory Configuration', testUpdateAgentMemoryConfig);
    await runTest('Process Message with Memory-Enhanced Agent', testProcessMessageWithMemory);
    await runTest('Get Contact Memory Insights', testGetContactMemoryInsights);
    await runTest('Get Agent Memory Statistics', testGetAgentMemoryStats);
    
    // Print test summary
    console.log('\n==========================================');
    console.log('📊 TEST SUMMARY');
    console.log('==========================================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⏭️ Skipped: ${testResults.skipped}`);
    console.log('==========================================');
    
    // Return appropriate exit code
    if (testResults.failed > 0) {
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  } catch (error) {
    console.error('❌ Unexpected error during test execution:', error);
    process.exitCode = 1;
  }
}

// Run the tests
runTests();

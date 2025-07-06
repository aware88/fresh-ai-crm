#!/usr/bin/env node

/**
 * Sales Agent Core Integration Test Script
 * 
 * This script tests the Sales Agent Core functionality including:
 * - Agent personality management
 * - Agent configuration
 * - Memory preferences
 * - Message processing
 * 
 * Usage:
 * 1. Copy test-sales-agent-core.env.sample to .env in the scripts directory
 * 2. Update the AUTH_TOKEN with a valid authentication token
 * 3. Run the script: node test-sales-agent-core.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const chalk = require('chalk');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error(chalk.red('Error: AUTH_TOKEN is required. Please set it in the .env file.'));
  process.exit(1);
}

// Test tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  details: []
};

// Helper function for API calls
async function callAPI(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    },
    body: body ? JSON.stringify(body) : undefined
  };

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { status: response.status, data };
    } else {
      const text = await response.text();
      return { status: response.status, text };
    }
  } catch (error) {
    console.error(chalk.red(`API call failed: ${error.message}`));
    return { status: 500, error: error.message };
  }
}

// Test function
async function runTest(name, testFn, skip = false) {
  testResults.total++;
  
  if (skip) {
    console.log(chalk.yellow(`⏭️ SKIPPED: ${name}`));
    testResults.skipped++;
    testResults.details.push({ name, status: 'skipped' });
    return null;
  }
  
  console.log(chalk.blue(`\n🧪 RUNNING TEST: ${name}`));
  
  try {
    const result = await testFn();
    console.log(chalk.green(`✅ PASSED: ${name}`));
    testResults.passed++;
    testResults.details.push({ name, status: 'passed' });
    return result;
  } catch (error) {
    console.log(chalk.red(`❌ FAILED: ${name}`));
    console.log(chalk.red(`   Error: ${error.message}`));
    testResults.failed++;
    testResults.details.push({ name, status: 'failed', error: error.message });
    return null;
  }
}

// Print test summary
function printSummary() {
  console.log(chalk.blue('\n=================================='));
  console.log(chalk.blue('       TEST SUMMARY'));
  console.log(chalk.blue('=================================='));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(chalk.green(`Passed: ${testResults.passed}`));
  console.log(chalk.red(`Failed: ${testResults.failed}`));
  console.log(chalk.yellow(`Skipped: ${testResults.skipped}`));
  console.log(chalk.blue('==================================\n'));
  
  if (testResults.failed > 0) {
    console.log(chalk.red('Failed Tests:'));
    testResults.details
      .filter(test => test.status === 'failed')
      .forEach(test => {
        console.log(chalk.red(`- ${test.name}: ${test.error}`));
      });
    console.log('');
  }
}

// Main test function
async function runTests() {
  console.log(chalk.blue('Starting Sales Agent Core Integration Tests...'));
  console.log(chalk.blue(`API Base URL: ${API_BASE_URL}`));
  
  let personalityId, agentId;
  
  // Test 1: Create Agent Personality
  const personality = await runTest('Create Agent Personality', async () => {
    const newPersonality = {
      name: 'Test Sales Agent',
      description: 'A friendly and helpful sales agent for testing',
      tone: ['friendly', 'professional', 'helpful'],
      communication_style: 'conversational',
      empathy_level: 0.8,
      assertiveness_level: 0.6,
      formality_level: 0.5,
      humor_level: 0.4,
      expertise_areas: ['product knowledge', 'customer service']
    };
    
    const response = await callAPI('/api/ai/agent/personalities', 'POST', newPersonality);
    
    if (response.status !== 201 || !response.data || !response.data.id) {
      throw new Error(`Failed to create personality: ${JSON.stringify(response)}`);
    }
    
    console.log(chalk.green(`Created personality with ID: ${response.data.id}`));
    return response.data;
  });
  
  if (personality) {
    personalityId = personality.id;
  } else {
    // If personality creation failed, try to get an existing one
    const listResponse = await callAPI('/api/ai/agent/personalities');
    if (listResponse.status === 200 && listResponse.data && listResponse.data.length > 0) {
      personalityId = listResponse.data[0].id;
      console.log(chalk.yellow(`Using existing personality with ID: ${personalityId}`));
    }
  }
  
  if (!personalityId) {
    console.error(chalk.red('No personality ID available. Aborting tests.'));
    printSummary();
    process.exit(1);
  }
  
  // Test 2: Get Agent Personality
  await runTest('Get Agent Personality', async () => {
    const response = await callAPI(`/api/ai/agent/personalities?id=${personalityId}`);
    
    if (response.status !== 200 || !response.data || response.data.id !== personalityId) {
      throw new Error(`Failed to get personality: ${JSON.stringify(response)}`);
    }
    
    console.log(chalk.green(`Retrieved personality: ${response.data.name}`));
    return response.data;
  });
  
  // Test 3: Create Agent Configuration
  const agentConfig = await runTest('Create Agent Configuration', async () => {
    const newConfig = {
      name: 'Test Agent Config',
      description: 'Configuration for testing the sales agent',
      personality_id: personalityId,
      default_goals: ['Provide helpful information', 'Answer customer questions'],
      allowed_actions: ['NEXT_MESSAGE', 'ASK_QUESTION', 'PRESENT_OFFER'],
      memory_access_level: 'READ_WRITE',
      decision_confidence_threshold: 0.7,
      max_message_length: 1000,
      response_time_target_ms: 3000,
      active: true
    };
    
    const response = await callAPI('/api/ai/agent/configs', 'POST', newConfig);
    
    if (response.status !== 201 || !response.data || !response.data.id) {
      throw new Error(`Failed to create agent config: ${JSON.stringify(response)}`);
    }
    
    console.log(chalk.green(`Created agent config with ID: ${response.data.id}`));
    return response.data;
  });
  
  if (agentConfig) {
    agentId = agentConfig.id;
  } else {
    // If agent config creation failed, try to get an existing one
    const listResponse = await callAPI('/api/ai/agent/configs');
    if (listResponse.status === 200 && listResponse.data && listResponse.data.length > 0) {
      agentId = listResponse.data[0].id;
      console.log(chalk.yellow(`Using existing agent config with ID: ${agentId}`));
    }
  }
  
  if (!agentId) {
    console.error(chalk.red('No agent ID available. Aborting tests.'));
    printSummary();
    process.exit(1);
  }
  
  // Test 4: Get Agent Configuration
  await runTest('Get Agent Configuration', async () => {
    const response = await callAPI(`/api/ai/agent/configs?id=${agentId}`);
    
    if (response.status !== 200 || !response.data || response.data.id !== agentId) {
      throw new Error(`Failed to get agent config: ${JSON.stringify(response)}`);
    }
    
    console.log(chalk.green(`Retrieved agent config: ${response.data.name}`));
    return response.data;
  });
  
  // Test 5: Get Agent Memory Preferences
  const memoryPrefs = await runTest('Get Agent Memory Preferences', async () => {
    const response = await callAPI(`/api/ai/agent/memory-preferences?agent_id=${agentId}`);
    
    if (response.status !== 200 || !response.data) {
      throw new Error(`Failed to get memory preferences: ${JSON.stringify(response)}`);
    }
    
    console.log(chalk.green(`Retrieved memory preferences for agent: ${agentId}`));
    return response.data;
  });
  
  // Test 6: Update Agent Memory Preferences
  await runTest('Update Agent Memory Preferences', async () => {
    const updateData = {
      max_memories_per_context: 15,
      min_importance_to_access: 0.4,
      recency_weight: 0.4,
      relevance_weight: 0.4,
      importance_weight: 0.2
    };
    
    const response = await callAPI(`/api/ai/agent/memory-preferences?agent_id=${agentId}`, 'PUT', updateData);
    
    if (response.status !== 200 || !response.data) {
      throw new Error(`Failed to update memory preferences: ${JSON.stringify(response)}`);
    }
    
    console.log(chalk.green(`Updated memory preferences for agent: ${agentId}`));
    return response.data;
  });
  
  // Test 7: Process Contact Message
  await runTest('Process Contact Message', async () => {
    const conversationId = `test-conversation-${Date.now()}`;
    
    const message = {
      conversation_id: conversationId,
      content: "Hello, I'm interested in learning more about your products.",
      metadata: {
        agent_id: agentId,
        source: 'test'
      }
    };
    
    const response = await callAPI('/api/ai/agent/process-message', 'POST', { message });
    
    if (response.status !== 200 || !response.data || !response.data.success) {
      throw new Error(`Failed to process message: ${JSON.stringify(response)}`);
    }
    
    console.log(chalk.green(`Processed message and got response: "${response.data.response.content.substring(0, 50)}..."`));
    return response.data;
  });
  
  // Test 8: Update Agent Configuration
  await runTest('Update Agent Configuration', async () => {
    const updateData = {
      description: 'Updated configuration for testing',
      decision_confidence_threshold: 0.8
    };
    
    const response = await callAPI(`/api/ai/agent/configs?id=${agentId}`, 'PUT', updateData);
    
    if (response.status !== 200 || !response.data) {
      throw new Error(`Failed to update agent config: ${JSON.stringify(response)}`);
    }
    
    console.log(chalk.green(`Updated agent config: ${response.data.description}`));
    return response.data;
  });
  
  // Test 9: Update Agent Personality
  await runTest('Update Agent Personality', async () => {
    const updateData = {
      description: 'Updated personality for testing',
      empathy_level: 0.9
    };
    
    const response = await callAPI(`/api/ai/agent/personalities?id=${personalityId}`, 'PUT', updateData);
    
    if (response.status !== 200 || !response.data) {
      throw new Error(`Failed to update personality: ${JSON.stringify(response)}`);
    }
    
    console.log(chalk.green(`Updated personality: ${response.data.description}`));
    return response.data;
  });
  
  // Test 10: Clean Up (Delete created resources)
  await runTest('Clean Up Resources', async () => {
    // Only attempt to delete if we created new resources
    if (personality && agentConfig) {
      // Delete agent config first (due to foreign key constraints)
      const configResponse = await callAPI(`/api/ai/agent/configs?id=${agentId}`, 'DELETE');
      
      if (configResponse.status !== 204) {
        console.log(chalk.yellow(`Warning: Failed to delete agent config: ${JSON.stringify(configResponse)}`));
      } else {
        console.log(chalk.green(`Deleted agent config: ${agentId}`));
      }
      
      // Delete personality
      const personalityResponse = await callAPI(`/api/ai/agent/personalities?id=${personalityId}`, 'DELETE');
      
      if (personalityResponse.status !== 204) {
        console.log(chalk.yellow(`Warning: Failed to delete personality: ${JSON.stringify(personalityResponse)}`));
      } else {
        console.log(chalk.green(`Deleted personality: ${personalityId}`));
      }
    } else {
      console.log(chalk.yellow('Skipping resource deletion as we used existing resources'));
    }
    
    return true;
  });
  
  // Print test summary
  printSummary();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red(`Test execution failed: ${error.message}`));
  process.exit(1);
});

/**
 * Test Script for Metakocka Error Log Management System
 * 
 * This script tests the API endpoints for the Metakocka error log management system.
 * It verifies that logs can be created, retrieved, filtered, resolved, and exported.
 */

const fetch = require('node-fetch');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('❌ ERROR: AUTH_TOKEN environment variable is required');
  process.exit(1);
}

// Test tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0
};

// Helper functions
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
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
    console.error(`❌ Request failed: ${error.message}`);
    return { status: 500, error: error.message };
  }
}

async function runTest(name, testFn) {
  console.log(`\n🧪 Running test: ${name}`);
  try {
    await testFn();
    console.log(`✅ Test passed: ${name}`);
    testResults.passed++;
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

async function skipTest(name, reason) {
  console.log(`\n⏭️ Skipping test: ${name}`);
  console.log(`   Reason: ${reason}`);
  testResults.skipped++;
}

// Test functions
async function testFetchLogs() {
  const response = await makeRequest('/integrations/metakocka/logs');
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data || !response.data.logs || !Array.isArray(response.data.logs)) {
    throw new Error('Response does not contain logs array');
  }
  
  if (!response.data.pagination) {
    throw new Error('Response does not contain pagination information');
  }
  
  console.log(`   Found ${response.data.logs.length} logs`);
  console.log(`   Total logs: ${response.data.pagination.total}`);
  
  return response.data;
}

async function testFilterLogs() {
  // Test filtering by error level
  const errorResponse = await makeRequest('/integrations/metakocka/logs?level=ERROR');
  
  if (errorResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${errorResponse.status}`);
  }
  
  // Test filtering by resolved status
  const unresolvedResponse = await makeRequest('/integrations/metakocka/logs?resolved=false');
  
  if (unresolvedResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${unresolvedResponse.status}`);
  }
  
  // Test filtering by category
  const categoryResponse = await makeRequest('/integrations/metakocka/logs?category=SYNC');
  
  if (categoryResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${categoryResponse.status}`);
  }
  
  console.log(`   Filter by level: ${errorResponse.data.logs.length} logs`);
  console.log(`   Filter by resolved: ${unresolvedResponse.data.logs.length} logs`);
  console.log(`   Filter by category: ${categoryResponse.data.logs.length} logs`);
  
  return true;
}

async function testResolveLog() {
  // First get an unresolved log
  const logsResponse = await makeRequest('/integrations/metakocka/logs?resolved=false&limit=1');
  
  if (logsResponse.status !== 200 || !logsResponse.data.logs || logsResponse.data.logs.length === 0) {
    throw new Error('No unresolved logs found to test resolution');
  }
  
  const logId = logsResponse.data.logs[0].id;
  console.log(`   Attempting to resolve log ID: ${logId}`);
  
  // Resolve the log
  const resolveResponse = await makeRequest('/integrations/metakocka/logs', 'POST', {
    id: logId,
    resolved: true,
    resolution_notes: 'Resolved by test script'
  });
  
  if (resolveResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${resolveResponse.status}`);
  }
  
  // Verify the log is now resolved
  const verifyResponse = await makeRequest(`/integrations/metakocka/logs?id=${logId}`);
  
  if (verifyResponse.status !== 200 || !verifyResponse.data.logs || verifyResponse.data.logs.length === 0) {
    throw new Error('Could not verify log resolution');
  }
  
  const resolvedLog = verifyResponse.data.logs[0];
  if (!resolvedLog.resolved) {
    throw new Error('Log was not properly resolved');
  }
  
  console.log(`   Log successfully resolved with notes: ${resolvedLog.resolution_notes}`);
  
  return resolvedLog;
}

async function testBulkResolveLogs() {
  // Get multiple unresolved logs
  const logsResponse = await makeRequest('/integrations/metakocka/logs?resolved=false&limit=3');
  
  if (logsResponse.status !== 200 || !logsResponse.data.logs || logsResponse.data.logs.length < 2) {
    throw new Error('Not enough unresolved logs found to test bulk resolution');
  }
  
  const logIds = logsResponse.data.logs.map(log => log.id);
  console.log(`   Attempting to bulk resolve ${logIds.length} logs`);
  
  // Bulk resolve the logs
  const resolveResponse = await makeRequest('/integrations/metakocka/logs/bulk-resolve', 'POST', {
    ids: logIds,
    resolution_notes: 'Bulk resolved by test script'
  });
  
  if (resolveResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${resolveResponse.status}`);
  }
  
  // Verify the logs are now resolved
  const idList = logIds.join(',');
  const verifyResponse = await makeRequest(`/integrations/metakocka/logs?ids=${idList}`);
  
  if (verifyResponse.status !== 200 || !verifyResponse.data.logs) {
    throw new Error('Could not verify bulk log resolution');
  }
  
  const unresolvedLogs = verifyResponse.data.logs.filter(log => !log.resolved);
  if (unresolvedLogs.length > 0) {
    throw new Error(`${unresolvedLogs.length} logs were not properly resolved`);
  }
  
  console.log(`   ${logIds.length} logs successfully bulk resolved`);
  
  return verifyResponse.data.logs;
}

async function testExportLogs() {
  // Test the export endpoint
  const exportResponse = await makeRequest('/integrations/metakocka/logs/export');
  
  if (exportResponse.status !== 200) {
    throw new Error(`Expected status 200, got ${exportResponse.status}`);
  }
  
  // Check if we got CSV data
  if (!exportResponse.text || !exportResponse.text.includes(',')) {
    throw new Error('Export did not return CSV data');
  }
  
  // Count the number of rows (subtract 1 for header)
  const rows = exportResponse.text.split('\n');
  const numLogs = rows.length - 1;
  
  console.log(`   Successfully exported ${numLogs} logs to CSV`);
  console.log(`   CSV header: ${rows[0]}`);
  
  return exportResponse.text;
}

async function testLogStats() {
  const response = await makeRequest('/integrations/metakocka/logs/stats');
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data || !response.data.stats) {
    throw new Error('Response does not contain stats object');
  }
  
  console.log(`   Stats: ${JSON.stringify(response.data.stats, null, 2)}`);
  
  return response.data.stats;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Metakocka Error Log Management Tests');
  console.log(`🌐 API Base URL: ${API_BASE_URL}`);
  
  let logs;
  
  // Test 1: Fetch logs
  await runTest('Fetch logs', async () => {
    logs = await testFetchLogs();
  });
  
  // Test 2: Filter logs
  await runTest('Filter logs', testFilterLogs);
  
  // Test 3: Resolve a single log
  let resolvedLog;
  const resolveResult = await runTest('Resolve log', async () => {
    resolvedLog = await testResolveLog();
  });
  
  // Test 4: Bulk resolve logs
  if (resolveResult) {
    await runTest('Bulk resolve logs', testBulkResolveLogs);
  } else {
    await skipTest('Bulk resolve logs', 'Single log resolution failed');
  }
  
  // Test 5: Export logs
  await runTest('Export logs', testExportLogs);
  
  // Test 6: Get log stats
  await runTest('Get log stats', testLogStats);
  
  // Print test summary
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⏭️ Skipped: ${testResults.skipped}`);
  console.log(`   🔢 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`\n❌ Unhandled error: ${error.message}`);
  process.exit(1);
});

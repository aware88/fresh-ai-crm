#!/usr/bin/env node

/**
 * ARIS CRM AI Agent Testing Script
 * 
 * This script provides automated testing for all AI agents and system components.
 * It can be run independently or as part of a CI/CD pipeline.
 * 
 * Usage:
 *   node scripts/test-ai-agents.js [options]
 * 
 * Options:
 *   --suite <name>    Run specific test suite (email, product, customer, sales, etc.)
 *   --quick           Run quick tests only (skip performance tests)
 *   --verbose         Show detailed output
 *   --json            Output results in JSON format
 *   --api             Test via API endpoints instead of direct calls
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 3,
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
  suites: [],
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  suite: null,
  quick: false,
  verbose: false,
  json: false,
  api: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--suite':
      options.suite = args[++i];
      break;
    case '--quick':
      options.quick = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--json':
      options.json = true;
      break;
    case '--api':
      options.api = true;
      break;
    case '--help':
      showHelp();
      process.exit(0);
  }
}

// Helper functions
function log(message, color = 'reset') {
  if (!options.json) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

function logVerbose(message) {
  if (options.verbose && !options.json) {
    console.log(`${colors.cyan}[VERBOSE] ${message}${colors.reset}`);
  }
}

function showHelp() {
  console.log(`
ARIS CRM AI Agent Testing Script

Usage: node scripts/test-ai-agents.js [options]

Options:
  --suite <name>    Run specific test suite:
                    - email: Email Agent tests
                    - product: Product Agent tests
                    - customer: Customer Agent tests
                    - sales: Sales Agent tests
                    - orchestrator: Multi-Agent Orchestrator tests
                    - predictive: Predictive Intelligence tests
                    - workflow: Advanced Workflow Engine tests
                    - monitor: Real-Time Monitor tests
                    - analytics: Advanced Analytics tests
                    - security: Security Manager tests
                    - production: Production Manager tests
                    - integration: Integration tests
                    - performance: Performance tests
                    - all: All test suites (default)

  --quick           Run quick tests only (skip performance tests)
  --verbose         Show detailed output
  --json            Output results in JSON format
  --api             Test via API endpoints instead of direct calls
  --help            Show this help message

Examples:
  node scripts/test-ai-agents.js                    # Run all tests
  node scripts/test-ai-agents.js --suite email      # Run email agent tests only
  node scripts/test-ai-agents.js --quick --verbose  # Run quick tests with verbose output
  node scripts/test-ai-agents.js --api --json       # Test via API with JSON output
`);
}

// Test API endpoint
async function testViaAPI(suite = null) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    logVerbose('Testing via API endpoint...');
    
    const url = suite 
      ? `${CONFIG.baseUrl}/api/test`
      : `${CONFIG.baseUrl}/api/test`;
      
    const body = suite 
      ? JSON.stringify({ action: 'run_suite', suite })
      : null;
    
    const response = await fetch(url, {
      method: suite ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      timeout: CONFIG.timeout,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        data: result.results || result.suite,
        summary: result.summary,
      };
    } else {
      throw new Error(result.error || 'API test failed');
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Test health endpoint
async function testHealth() {
  const fetch = (await import('node-fetch')).default;
  
  try {
    logVerbose('Testing system health...');
    
    const response = await fetch(`${CONFIG.baseUrl}/api/health?check=detailed`, {
      timeout: CONFIG.timeout,
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: HTTP ${response.status}`);
    }
    
    const health = await response.json();
    
    return {
      success: true,
      status: health.status,
      services: health.services,
      metrics: health.metrics,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Test security endpoint
async function testSecurity() {
  const fetch = (await import('node-fetch')).default;
  
  try {
    logVerbose('Testing security system...');
    
    // Test encryption
    const encryptResponse = await fetch(`${CONFIG.baseUrl}/api/security`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test_encryption',
        data: { text: 'test encryption data' },
      }),
      timeout: CONFIG.timeout,
    });
    
    if (!encryptResponse.ok) {
      throw new Error(`Security test failed: HTTP ${encryptResponse.status}`);
    }
    
    const encryptResult = await encryptResponse.json();
    
    // Test security stats
    const statsResponse = await fetch(`${CONFIG.baseUrl}/api/security?action=stats`, {
      timeout: CONFIG.timeout,
    });
    
    if (!statsResponse.ok) {
      throw new Error(`Security stats failed: HTTP ${statsResponse.status}`);
    }
    
    const statsResult = await statsResponse.json();
    
    return {
      success: true,
      encryption: encryptResult.success,
      stats: statsResult.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run specific test suite
async function runTestSuite(suiteName) {
  const startTime = Date.now();
  
  log(`\n${colors.blue}=== Running ${suiteName} Test Suite ===${colors.reset}`);
  
  try {
    let result;
    
    if (options.api) {
      result = await testViaAPI(suiteName);
    } else {
      // For direct testing, we'd need to import and run the test suite
      // For now, we'll use the API approach
      result = await testViaAPI(suiteName);
    }
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      const suiteData = result.data;
      const passed = suiteData.passed || 0;
      const failed = suiteData.failed || 0;
      const total = suiteData.tests?.length || (passed + failed);
      
      testResults.total += total;
      testResults.passed += passed;
      testResults.failed += failed;
      testResults.duration += duration;
      
      testResults.suites.push({
        name: suiteName,
        passed,
        failed,
        total,
        duration,
        tests: suiteData.tests || [],
      });
      
      if (failed === 0) {
        log(`${colors.green}✅ ${suiteName} - All ${total} tests passed (${duration}ms)${colors.reset}`);
      } else {
        log(`${colors.yellow}⚠️  ${suiteName} - ${passed}/${total} tests passed (${duration}ms)${colors.reset}`);
      }
      
      if (options.verbose && suiteData.tests) {
        suiteData.tests.forEach(test => {
          const status = test.passed ? '✅' : '❌';
          log(`  ${status} ${test.name} (${test.duration}ms)`);
          if (!test.passed && test.error) {
            log(`    Error: ${test.error}`, 'red');
          }
        });
      }
    } else {
      testResults.failed++;
      testResults.total++;
      
      log(`${colors.red}❌ ${suiteName} - Test suite failed: ${result.error}${colors.reset}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.total++;
    
    log(`${colors.red}❌ ${suiteName} - Error: ${error.message}${colors.reset}`);
  }
}

// Main test runner
async function runTests() {
  const startTime = Date.now();
  
  if (!options.json) {
    log(`${colors.bright}🧪 ARIS CRM AI Agent Testing${colors.reset}`);
    log(`${colors.cyan}Configuration:${colors.reset}`);
    log(`  Base URL: ${CONFIG.baseUrl}`);
    log(`  Suite: ${options.suite || 'all'}`);
    log(`  Quick: ${options.quick}`);
    log(`  API Mode: ${options.api}`);
    log('');
  }
  
  // Test system health first
  logVerbose('Checking system health...');
  const healthResult = await testHealth();
  if (!healthResult.success) {
    log(`${colors.red}❌ System health check failed: ${healthResult.error}${colors.reset}`);
    if (!options.json) {
      log(`${colors.yellow}⚠️  Continuing with tests anyway...${colors.reset}`);
    }
  } else {
    logVerbose(`System health: ${healthResult.status}`);
  }
  
  // Test security system
  logVerbose('Testing security system...');
  const securityResult = await testSecurity();
  if (!securityResult.success) {
    log(`${colors.red}❌ Security test failed: ${securityResult.error}${colors.reset}`);
  } else {
    logVerbose('Security system operational');
  }
  
  // Define test suites
  const testSuites = [
    'Email Agent',
    'Product Agent',
    'Customer Agent',
    'Sales Agent',
    'Multi-Agent Orchestrator',
    'Predictive Intelligence',
    'Advanced Workflow Engine',
    'Real-Time Monitor',
    'Advanced Analytics',
    'Security Manager',
    'Production Manager',
    'Integration Scenarios',
  ];
  
  // Add performance tests if not quick mode
  if (!options.quick) {
    testSuites.push('Performance Tests');
  }
  
  // Run specific suite or all suites
  if (options.suite && options.suite !== 'all') {
    const suiteName = testSuites.find(s => 
      s.toLowerCase().includes(options.suite.toLowerCase())
    );
    
    if (suiteName) {
      await runTestSuite(suiteName);
    } else {
      log(`${colors.red}❌ Test suite '${options.suite}' not found${colors.reset}`);
      log(`Available suites: ${testSuites.join(', ')}`);
      process.exit(1);
    }
  } else {
    // Run all test suites
    for (const suite of testSuites) {
      await runTestSuite(suite);
    }
  }
  
  // Calculate final results
  testResults.duration = Date.now() - startTime;
  const passRate = testResults.total > 0 
    ? ((testResults.passed / testResults.total) * 100).toFixed(1)
    : '0.0';
  
  // Output results
  if (options.json) {
    console.log(JSON.stringify({
      success: testResults.failed === 0,
      results: testResults,
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        passRate: `${passRate}%`,
        duration: testResults.duration,
      },
    }, null, 2));
  } else {
    log(`\n${colors.bright}📊 Test Results Summary${colors.reset}`);
    log(`${colors.cyan}Total Tests: ${testResults.total}${colors.reset}`);
    log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
    log(`${colors.yellow}Pass Rate: ${passRate}%${colors.reset}`);
    log(`${colors.blue}Duration: ${testResults.duration}ms${colors.reset}`);
    
    if (testResults.failed === 0) {
      log(`\n${colors.green}🎉 All tests passed! System is ready for production.${colors.reset}`);
    } else {
      log(`\n${colors.red}❌ ${testResults.failed} test(s) failed. Please review and fix issues.${colors.reset}`);
    }
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n🛑 Testing interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n🛑 Testing terminated');
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  if (options.json) {
    console.log(JSON.stringify({
      success: false,
      error: error.message,
    }));
  } else {
    log(`${colors.red}❌ Testing failed: ${error.message}${colors.reset}`);
  }
  process.exit(1);
}); 
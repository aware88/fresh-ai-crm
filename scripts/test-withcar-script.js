#!/usr/bin/env node

/**
 * Test script for Withcar Email Fetching
 * 
 * This script tests the basic functionality and dependencies of the Withcar email fetching script
 * without actually fetching emails.
 */

const fs = require('fs').promises;
const path = require('path');

async function testDependencies() {
  console.log('🧪 Testing Withcar Email Fetching Script Dependencies...');
  console.log('=' .repeat(60));

  const tests = [];

  // Test 1: Check if the main script exists
  try {
    const scriptPath = path.join(__dirname, 'fetch-withcar-emails.js');
    await fs.access(scriptPath);
    tests.push({ name: 'Main script exists', status: '✅ PASS' });
  } catch (error) {
    tests.push({ name: 'Main script exists', status: '❌ FAIL', error: error.message });
  }

  // Test 2: Check if we can import the script
  try {
    const WithcarEmailFetcher = require('./fetch-withcar-emails.js');
    if (typeof WithcarEmailFetcher === 'function') {
      tests.push({ name: 'Script can be imported', status: '✅ PASS' });
    } else {
      tests.push({ name: 'Script can be imported', status: '❌ FAIL', error: 'Not a valid class' });
    }
  } catch (error) {
    tests.push({ name: 'Script can be imported', status: '❌ FAIL', error: error.message });
  }

  // Test 3: Check if output directory can be created
  try {
    const testOutputDir = path.join(__dirname, '../data/test-withcar-emails');
    await fs.mkdir(testOutputDir, { recursive: true });
    await fs.rmdir(testOutputDir);
    tests.push({ name: 'Output directory creation', status: '✅ PASS' });
  } catch (error) {
    tests.push({ name: 'Output directory creation', status: '❌ FAIL', error: error.message });
  }

  // Test 4: Check if we can create a test fetcher instance
  try {
    const WithcarEmailFetcher = require('./fetch-withcar-emails.js');
    const fetcher = new WithcarEmailFetcher();
    if (fetcher && typeof fetcher.ensureOutputDirectory === 'function') {
      tests.push({ name: 'Fetcher instance creation', status: '✅ PASS' });
    } else {
      tests.push({ name: 'Fetcher instance creation', status: '❌ FAIL', error: 'Invalid instance' });
    }
  } catch (error) {
    tests.push({ name: 'Fetcher instance creation', status: '❌ FAIL', error: error.message });
  }

  // Test 5: Check if fetch is available (Node.js 18+)
  try {
    if (typeof fetch !== 'undefined') {
      tests.push({ name: 'Fetch API available', status: '✅ PASS' });
    } else {
      tests.push({ name: 'Fetch API available', status: '⚠️  WARN', error: 'Fetch not available, may need polyfill' });
    }
  } catch (error) {
    tests.push({ name: 'Fetch API available', status: '❌ FAIL', error: error.message });
  }

  // Test 6: Check Node.js version
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion >= 18) {
      tests.push({ name: 'Node.js version check', status: '✅ PASS', info: nodeVersion });
    } else {
      tests.push({ name: 'Node.js version check', status: '⚠️  WARN', info: `${nodeVersion} (recommend 18+)` });
    }
  } catch (error) {
    tests.push({ name: 'Node.js version check', status: '❌ FAIL', error: error.message });
  }

  // Test 7: Check if package.json script exists
  try {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    if (packageJson.scripts && packageJson.scripts['fetch:withcar-emails']) {
      tests.push({ name: 'NPM script exists', status: '✅ PASS' });
    } else {
      tests.push({ name: 'NPM script exists', status: '❌ FAIL', error: 'Script not found in package.json' });
    }
  } catch (error) {
    tests.push({ name: 'NPM script exists', status: '❌ FAIL', error: error.message });
  }

  // Display results
  console.log('\n📊 Test Results:');
  console.log('-' .repeat(60));
  
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  tests.forEach(test => {
    console.log(`${test.status} ${test.name}`);
    if (test.info) {
      console.log(`    ℹ️  ${test.info}`);
    }
    if (test.error) {
      console.log(`    ❌ ${test.error}`);
    }
    
    if (test.status.includes('PASS')) passCount++;
    else if (test.status.includes('WARN')) warnCount++;
    else if (test.status.includes('FAIL')) failCount++;
  });

  console.log('-' .repeat(60));
  console.log(`📈 Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);

  if (failCount === 0) {
    console.log('\n🎉 All critical tests passed! The Withcar email fetching script should work correctly.');
    console.log('\n💡 Next steps:');
    console.log('1. Ensure your Next.js server is running (npm run dev)');
    console.log('2. Connect the Withcar Italian email account');
    console.log('3. Run the script: npm run fetch:withcar-emails');
  } else {
    console.log('\n⚠️  Some tests failed. Please resolve the issues before running the email fetching script.');
  }

  return failCount === 0;
}

async function testEmailProcessing() {
  console.log('\n🧪 Testing Email Processing Functions...');
  console.log('=' .repeat(60));

  try {
    const WithcarEmailFetcher = require('./fetch-withcar-emails.js');
    const fetcher = new WithcarEmailFetcher();

    // Test email processing with sample data
    const sampleEmail = {
      id: 'test-123',
      subject: 'Test Email - Ciao, come va?',
      from: 'test@withcar.it',
      to: 'customer@example.com',
      date: new Date().toISOString(),
      body: '<p>Ciao! Come posso aiutarti oggi? Abbiamo ricevuto la tua richiesta e ti risponderemo presto.</p>',
      attachments: []
    };

    const processedEmail = fetcher.processEmailForAnalysis(sampleEmail);
    
    console.log('✅ Email processing test passed');
    console.log('📧 Sample processed email:');
    console.log(`   - Word count: ${processedEmail.wordCount}`);
    console.log(`   - Language: ${processedEmail.language}`);
    console.log(`   - Has attachments: ${processedEmail.hasAttachments}`);
    console.log(`   - Body text preview: ${processedEmail.bodyText.substring(0, 50)}...`);

    return true;
  } catch (error) {
    console.log('❌ Email processing test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  try {
    const dependenciesOk = await testDependencies();
    const processingOk = await testEmailProcessing();
    
    if (dependenciesOk && processingOk) {
      console.log('\n🚀 All tests passed! Ready to fetch Withcar emails.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please fix the issues before proceeding.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
} 
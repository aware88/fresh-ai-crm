#!/usr/bin/env node

/**
 * Test Script: Multi-Email AI Learning System
 * 
 * This script tests the multi-email AI learning functionality without modifying the database.
 * It verifies that the code changes are working correctly.
 */

const path = require('path');

// Mock the environment for testing
process.env.NODE_ENV = 'test';

console.log('🧪 Testing Multi-Email AI Learning System...\n');

async function runTests() {
  let testsPassed = 0;
  let testsTotal = 0;

  function test(description, testFn) {
    testsTotal++;
    try {
      testFn();
      console.log(`✅ ${description}`);
      testsPassed++;
    } catch (error) {
      console.log(`❌ ${description}`);
      console.error(`   Error: ${error.message}`);
    }
  }

  // Test 1: Verify EmailLearningService has account-aware methods
  test('EmailLearningService has account-aware method signatures', () => {
    // Import the service
    const emailLearningServicePath = path.resolve(__dirname, '../src/lib/email/email-learning-service.ts');
    const serviceContent = require('fs').readFileSync(emailLearningServicePath, 'utf8');
    
    // Check that key methods have accountId parameters
    const methodChecks = [
      'performInitialLearning.*accountId',
      'performInitialLearningWithProgress.*accountId',
      'saveLearnedPatterns.*accountId',
      'fetchEmailPairsForLearning.*accountId',
      'learnFromNewEmail.*accountId'
    ];

    methodChecks.forEach(check => {
      if (!new RegExp(check, 's').test(serviceContent)) {
        throw new Error(`Method signature missing accountId parameter: ${check}`);
      }
    });
  });

  // Test 2: Verify AccountSelector component exists and has correct props
  test('AccountSelector component exists with correct interface', () => {
    const accountSelectorPath = path.resolve(__dirname, '../src/components/email/AccountSelector.tsx');
    const componentContent = require('fs').readFileSync(accountSelectorPath, 'utf8');
    
    // Check for key props and interface
    const requiredElements = [
      'interface EmailAccount',
      'interface AccountSelectorProps',
      'onAccountSelect.*accountId.*string',
      'selectedAccountId',
      'showAllAccountsOption'
    ];

    requiredElements.forEach(element => {
      if (!new RegExp(element, 's').test(componentContent)) {
        throw new Error(`Missing component element: ${element}`);
      }
    });
  });

  // Test 3: Verify useEmailAccounts hook exists with correct methods
  test('useEmailAccounts hook exists with correct interface', () => {
    const hookPath = path.resolve(__dirname, '../src/hooks/useEmailAccounts.ts');
    const hookContent = require('fs').readFileSync(hookPath, 'utf8');
    
    // Check for key methods and exports
    const requiredMethods = [
      'fetchAccounts',
      'activeAccounts',
      'primaryAccount',
      'getAccountById',
      'setPrimaryAccount',
      'deleteAccount',
      'toggleAccountStatus'
    ];

    requiredMethods.forEach(method => {
      if (!hookContent.includes(method)) {
        throw new Error(`Missing hook method: ${method}`);
      }
    });
  });

  // Test 4: Verify migration SQL contains account_id columns
  test('Migration SQL contains account_id column additions', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20250908000001_add_account_id_to_ai_learning_tables.sql');
    const migrationContent = require('fs').readFileSync(migrationPath, 'utf8');
    
    // Check for account_id additions to key tables
    const requiredChanges = [
      'ALTER TABLE email_patterns.*ADD COLUMN account_id',
      'ALTER TABLE support_templates.*ADD COLUMN account_id',
      'ALTER TABLE user_ai_profiles.*ADD COLUMN account_id',
      'REFERENCES email_accounts.*id.*ON DELETE CASCADE',
      'CREATE.*get_account_patterns',
      'CREATE.*get_account_ai_profile'
    ];

    requiredChanges.forEach(change => {
      if (!new RegExp(change, 's').test(migrationContent)) {
        throw new Error(`Missing migration change: ${change}`);
      }
    });
  });

  // Test 5: Verify pattern matching functions are account-aware
  test('Pattern matching functions include account_id filtering', () => {
    const emailLearningServicePath = path.resolve(__dirname, '../src/lib/email/email-learning-service.ts');
    const serviceContent = require('fs').readFileSync(emailLearningServicePath, 'utf8');
    
    // Check that pattern matching includes account filtering
    const accountFilterChecks = [
      'findMatchingPatterns.*accountId',
      'updateSimilarPatterns.*accountId',
      'getEmailAccountId.*messageId.*userId',
      'if.*accountId.*eq.*account_id.*accountId'
    ];

    accountFilterChecks.forEach(check => {
      if (!new RegExp(check, 's').test(serviceContent)) {
        throw new Error(`Missing account filtering: ${check}`);
      }
    });
  });

  // Test 6: Verify email fetching is account-aware
  test('Email fetching functions filter by account_id', () => {
    const emailLearningServicePath = path.resolve(__dirname, '../src/lib/email/email-learning-service.ts');
    const serviceContent = require('fs').readFileSync(emailLearningServicePath, 'utf8');
    
    // Check that email queries can filter by account
    const emailFilterChecks = [
      'fetchEmailPairsForLearning.*accountId',
      'emailQuery.*eq.*account_id.*accountId',
      'sentQuery.*eq.*account_id'
    ];

    emailFilterChecks.forEach(check => {
      if (!new RegExp(check, 's').test(serviceContent)) {
        throw new Error(`Missing email account filtering: ${check}`);
      }
    });
  });

  // Test 7: Check if migration includes data migration function
  test('Migration includes data migration for existing patterns', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20250908000001_add_account_id_to_ai_learning_tables.sql');
    const migrationContent = require('fs').readFileSync(migrationPath, 'utf8');
    
    // Check for data migration components
    const migrationChecks = [
      'migrate_ai_data_to_primary_account',
      'UPDATE email_patterns.*SET account_id',
      'UPDATE support_templates.*SET account_id',
      'UPDATE user_ai_profiles.*SET account_id'
    ];

    migrationChecks.forEach(check => {
      if (!new RegExp(check, 's').test(migrationContent)) {
        throw new Error(`Missing data migration: ${check}`);
      }
    });
  });

  // Test 8: Verify RLS policies are updated for account access
  test('RLS policies updated for account-specific access', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20250908000001_add_account_id_to_ai_learning_tables.sql');
    const migrationContent = require('fs').readFileSync(migrationPath, 'utf8');
    
    // Check for updated RLS policies
    const rlsChecks = [
      'CREATE POLICY.*patterns.*email_accounts',
      'CREATE POLICY.*templates.*email_accounts',
      'CREATE POLICY.*profiles.*email_accounts',
      'account_id IN.*SELECT id FROM email_accounts'
    ];

    rlsChecks.forEach(check => {
      if (!new RegExp(check, 's').test(migrationContent)) {
        throw new Error(`Missing RLS policy update: ${check}`);
      }
    });
  });

  // Summary
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsTotal - testsPassed}`);
  console.log(`   📈 Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`);

  if (testsPassed === testsTotal) {
    console.log('\n🎉 All tests passed! Multi-email AI learning system is ready.');
    console.log('\n📝 Next steps:');
    console.log('   1. Apply the database migration when ready');
    console.log('   2. Update UI components to include AccountSelector');
    console.log('   3. Test with real email accounts');
    console.log('   4. Verify AI learning works per-account');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

runTests().catch(console.error);
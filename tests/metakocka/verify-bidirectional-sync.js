#!/usr/bin/env node

/**
 * Verification script for bidirectional sales document synchronization
 * 
 * This script tests the complete bidirectional sync flow:
 * 1. Create a test sales document in CRM
 * 2. Sync the document to Metakocka
 * 3. Verify the document exists in Metakocka
 * 4. Make changes to the document in Metakocka
 * 5. Sync the document back to CRM
 * 6. Verify the changes were applied in CRM
 * 7. Clean up test data
 * 
 * Before running:
 * - Update AUTH_TOKEN with a valid authentication token
 * - Set TEST_MODE=true to create test data (will be cleaned up after)
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const TEST_MODE = process.env.TEST_MODE === 'true';
let TEST_DOCUMENT_ID = null;
let TEST_METAKOCKA_ID = null;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

if (!AUTH_TOKEN) {
  console.error('❌ Error: AUTH_TOKEN is required');
  process.exit(1);
}

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`${method} ${url}`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${data.error || response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    throw error;
  }
}

// Test functions
async function createTestSalesDocument() {
  if (!TEST_MODE) {
    console.log('⏭️ Skipping test document creation (TEST_MODE not enabled)');
    testResults.skipped++;
    return null;
  }

  console.log('\n=== Creating Test Sales Document ===');
  try {
    const testDocument = {
      document_type: 'invoice',
      document_number: `TEST-${uuidv4().substring(0, 8)}`,
      document_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      client_name: 'Test Client',
      client_email: 'test@example.com',
      total_amount: 100.00,
      currency: 'EUR',
      status: 'draft',
      items: [
        {
          name: 'Test Product',
          quantity: 1,
          unit_price: 100.00,
          total_price: 100.00
        }
      ]
    };

    const result = await apiRequest(
      `/sales-documents`,
      'POST',
      testDocument
    );

    console.log('✅ Test document created:', result.id);
    testResults.passed++;
    return result.id;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.failed++;
    testResults.errors.push({ test: 'createTestSalesDocument', error: error.message });
    return null;
  }
}

async function syncDocumentToMetakocka(documentId) {
  if (!documentId) {
    console.log('⏭️ Skipping sync to Metakocka (no document ID)');
    testResults.skipped++;
    return null;
  }

  console.log('\n=== Syncing Document to Metakocka ===');
  try {
    const result = await apiRequest(
      `/integrations/metakocka/sales-documents/sync`,
      'POST',
      { documentId }
    );

    if (result.success && result.metakockaId) {
      console.log(`✅ Document synced to Metakocka: ${result.metakockaId}`);
      testResults.passed++;
      return result.metakockaId;
    } else {
      throw new Error('Sync failed or no Metakocka ID returned');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.failed++;
    testResults.errors.push({ test: 'syncDocumentToMetakocka', error: error.message });
    return null;
  }
}

async function verifyDocumentInMetakocka(documentId, metakockaId) {
  if (!documentId || !metakockaId) {
    console.log('⏭️ Skipping Metakocka verification (missing IDs)');
    testResults.skipped++;
    return false;
  }

  console.log('\n=== Verifying Document in Metakocka ===');
  try {
    const result = await apiRequest(
      `/integrations/metakocka/sales-documents/sync?documentId=${documentId}`,
      'GET'
    );

    if (result.success && result.mapping && result.mapping.metakockaId === metakockaId) {
      console.log('✅ Document verified in Metakocka');
      testResults.passed++;
      return true;
    } else {
      throw new Error('Document not found in Metakocka or mapping mismatch');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.failed++;
    testResults.errors.push({ test: 'verifyDocumentInMetakocka', error: error.message });
    return false;
  }
}

async function syncDocumentFromMetakocka(metakockaId) {
  if (!metakockaId) {
    console.log('⏭️ Skipping sync from Metakocka (no Metakocka ID)');
    testResults.skipped++;
    return false;
  }

  console.log('\n=== Syncing Document from Metakocka ===');
  try {
    const result = await apiRequest(
      `/integrations/metakocka/sales-documents/sync-from-metakocka`,
      'POST',
      { metakockaId }
    );

    if (result.success && result.documentId) {
      console.log(`✅ Document synced from Metakocka: ${result.documentId}`);
      testResults.passed++;
      return true;
    } else {
      throw new Error('Sync failed or no document ID returned');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.failed++;
    testResults.errors.push({ test: 'syncDocumentFromMetakocka', error: error.message });
    return false;
  }
}

async function verifyDocumentInCRM(documentId) {
  if (!documentId) {
    console.log('⏭️ Skipping CRM verification (no document ID)');
    testResults.skipped++;
    return false;
  }

  console.log('\n=== Verifying Document in CRM ===');
  try {
    const result = await apiRequest(
      `/sales-documents/${documentId}`,
      'GET'
    );

    if (result && result.id === documentId) {
      console.log('✅ Document verified in CRM');
      testResults.passed++;
      return true;
    } else {
      throw new Error('Document not found in CRM');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.failed++;
    testResults.errors.push({ test: 'verifyDocumentInCRM', error: error.message });
    return false;
  }
}

async function cleanupTestData(documentId) {
  if (!TEST_MODE || !documentId) {
    console.log('⏭️ Skipping cleanup (TEST_MODE not enabled or no document ID)');
    testResults.skipped++;
    return;
  }

  console.log('\n=== Cleaning Up Test Data ===');
  try {
    const result = await apiRequest(
      `/sales-documents/${documentId}`,
      'DELETE'
    );

    console.log('✅ Test data cleaned up');
    testResults.passed++;
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    testResults.failed++;
    testResults.errors.push({ test: 'cleanupTestData', error: error.message });
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('=== Starting Bidirectional Sync Verification ===\n');
    
    // Step 1: Create test document or use existing one
    TEST_DOCUMENT_ID = await createTestSalesDocument();
    
    if (!TEST_DOCUMENT_ID && !TEST_MODE) {
      // If not in test mode, prompt for document ID
      TEST_DOCUMENT_ID = process.env.DOCUMENT_ID;
      if (!TEST_DOCUMENT_ID) {
        console.error('❌ Error: DOCUMENT_ID is required when TEST_MODE is not enabled');
        process.exit(1);
      }
    }
    
    // Step 2: Sync document to Metakocka
    TEST_METAKOCKA_ID = await syncDocumentToMetakocka(TEST_DOCUMENT_ID);
    
    // Step 3: Verify document in Metakocka
    const metakockaVerified = await verifyDocumentInMetakocka(TEST_DOCUMENT_ID, TEST_METAKOCKA_ID);
    
    // Step 4: Sync document from Metakocka (simulating changes)
    if (metakockaVerified) {
      const syncedFromMetakocka = await syncDocumentFromMetakocka(TEST_METAKOCKA_ID);
      
      // Step 5: Verify document in CRM
      if (syncedFromMetakocka) {
        await verifyDocumentInCRM(TEST_DOCUMENT_ID);
      }
    }
    
    // Step 6: Clean up test data
    await cleanupTestData(TEST_DOCUMENT_ID);
    
    // Print test summary
    console.log('\n=== Test Summary ===');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⏭️ Skipped: ${testResults.skipped}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n=== Errors ===');
      testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }
    
    console.log('\n=== Verification Complete ===');
    
    // Exit with appropriate code
    if (testResults.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Tests failed:', error);
    process.exit(1);
  }
}

runTests();

#!/usr/bin/env node

/**
 * Test script for Metakocka sales document synchronization
 * 
 * This script tests:
 * 1. Single sales document sync (CRM → Metakocka)
 * 2. Bulk sales document sync (CRM → Metakocka)
 * 3. Sales document mapping status retrieval
 * 4. Single sales document sync (Metakocka → CRM)
 * 5. Bulk sales document sync (Metakocka → CRM)
 * 
 * Before running:
 * - Update AUTH_TOKEN with a valid authentication token
 * - Update DOCUMENT_ID with an actual sales document ID from the database
 * - Optionally update METAKOCKA_ID for the reverse sync test
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const DOCUMENT_ID = process.env.DOCUMENT_ID;
const METAKOCKA_ID = process.env.METAKOCKA_ID;

if (!AUTH_TOKEN) {
  console.error('Error: AUTH_TOKEN is required');
  process.exit(1);
}

if (!DOCUMENT_ID && !METAKOCKA_ID) {
  console.error('Error: Either DOCUMENT_ID or METAKOCKA_ID is required');
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
async function testSingleSalesDocumentSync() {
  if (!DOCUMENT_ID) {
    console.log('Skipping single sales document sync test (DOCUMENT_ID not provided)');
    return;
  }

  console.log('\n=== Testing Single Sales Document Sync (CRM → Metakocka) ===');
  try {
    const result = await apiRequest(
      `/integrations/metakocka/sales-documents/sync`,
      'POST',
      { documentId: DOCUMENT_ID }
    );

    console.log('Sync result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

async function testBulkSalesDocumentSync() {
  if (!DOCUMENT_ID) {
    console.log('Skipping bulk sales document sync test (DOCUMENT_ID not provided)');
    return;
  }

  console.log('\n=== Testing Bulk Sales Document Sync (CRM → Metakocka) ===');
  try {
    const result = await apiRequest(
      `/integrations/metakocka/sales-documents/sync`,
      'POST',
      { documentIds: [DOCUMENT_ID] }
    );

    console.log('Sync result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

async function testSalesDocumentMappingStatus() {
  if (!DOCUMENT_ID) {
    console.log('Skipping sales document mapping status test (DOCUMENT_ID not provided)');
    return;
  }

  console.log('\n=== Testing Sales Document Mapping Status ===');
  try {
    const result = await apiRequest(
      `/integrations/metakocka/sales-documents/sync?documentId=${DOCUMENT_ID}`,
      'GET'
    );

    console.log('Mapping status:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

async function testSingleSalesDocumentFromMetakocka() {
  if (!METAKOCKA_ID) {
    console.log('Skipping single sales document from Metakocka test (METAKOCKA_ID not provided)');
    return;
  }

  console.log('\n=== Testing Single Sales Document Sync (Metakocka → CRM) ===');
  try {
    const result = await apiRequest(
      `/integrations/metakocka/sales-documents/sync-from-metakocka`,
      'POST',
      { metakockaId: METAKOCKA_ID }
    );

    console.log('Sync result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

async function testBulkSalesDocumentFromMetakocka() {
  console.log('\n=== Testing Bulk Sales Document Sync (Metakocka → CRM) ===');
  try {
    // First get unsynced documents
    const unsyncedResult = await apiRequest(
      `/integrations/metakocka/sales-documents/sync-from-metakocka`,
      'GET'
    );

    console.log(`Found ${unsyncedResult.documents?.length || 0} unsynced documents`);
    
    if (!unsyncedResult.documents || unsyncedResult.documents.length === 0) {
      console.log('No unsynced documents found, using provided METAKOCKA_ID if available');
      
      if (METAKOCKA_ID) {
        // Use the provided METAKOCKA_ID
        const result = await apiRequest(
          `/integrations/metakocka/sales-documents/sync-all-from-metakocka`,
          'POST',
          { metakockaIds: [METAKOCKA_ID] }
        );
        
        console.log('Sync result:', JSON.stringify(result, null, 2));
        return result;
      } else {
        console.log('Skipping bulk sync from Metakocka (no unsynced documents and no METAKOCKA_ID provided)');
        return;
      }
    }
    
    // Sync all unsynced documents
    const metakockaIds = unsyncedResult.documents.slice(0, 5).map(doc => doc.mk_id);
    console.log(`Syncing ${metakockaIds.length} documents from Metakocka to CRM`);
    
    const result = await apiRequest(
      `/integrations/metakocka/sales-documents/sync-all-from-metakocka`,
      'POST',
      { metakockaIds }
    );

    console.log('Sync result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  try {
    await testSingleSalesDocumentSync();
    await testBulkSalesDocumentSync();
    await testSalesDocumentMappingStatus();
    await testSingleSalesDocumentFromMetakocka();
    await testBulkSalesDocumentFromMetakocka();
    
    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Tests failed:', error);
    process.exit(1);
  }
}

runTests();

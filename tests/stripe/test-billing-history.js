/**
 * Test script for Stripe billing history
 * 
 * This script tests the billing history retrieval functionality:
 * - Fetching invoice history for an organization
 * - Verifying invoice data format
 */

const fetch = require('node-fetch');
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID;

if (!AUTH_TOKEN || !ORGANIZATION_ID) {
  console.error('Missing required environment variables. Please set AUTH_TOKEN and ORGANIZATION_ID.');
  process.exit(1);
}

// Helper function for API requests
async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  });

  return response;
}

// Test function for billing history
async function testGetBillingHistory() {
  console.log('\n🔍 Testing billing history retrieval...');
  
  try {
    const response = await fetchWithAuth(
      `/api/organizations/${ORGANIZATION_ID}/subscription/invoices`
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully retrieved billing history');
      console.log(`Found ${data.invoices.length} invoices`);
      
      if (data.invoices.length > 0) {
        console.log('\nSample invoice:');
        const sampleInvoice = data.invoices[0];
        console.log(JSON.stringify({
          id: sampleInvoice.id,
          created: sampleInvoice.created,
          amount_paid: sampleInvoice.amount_paid,
          status: sampleInvoice.status,
          invoice_pdf: sampleInvoice.invoice_pdf ? '✓ Available' : '✗ Not available'
        }, null, 2));
        
        // Validate invoice structure
        validateInvoiceStructure(sampleInvoice);
      }
      
      return data.invoices;
    } else {
      console.error('❌ Failed to retrieve billing history:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error retrieving billing history:', error.message);
    return null;
  }
}

// Validate invoice structure
function validateInvoiceStructure(invoice) {
  console.log('\n🔍 Validating invoice structure...');
  
  const requiredFields = [
    'id',
    'created',
    'amount_due',
    'amount_paid',
    'status'
  ];
  
  const missingFields = requiredFields.filter(field => !invoice.hasOwnProperty(field));
  
  if (missingFields.length > 0) {
    console.error(`❌ Invoice is missing required fields: ${missingFields.join(', ')}`);
  } else {
    console.log('✅ Invoice has all required fields');
  }
  
  // Check data types
  if (typeof invoice.id !== 'string') {
    console.error('❌ Invoice ID should be a string');
  }
  
  if (isNaN(Date.parse(invoice.created))) {
    console.error('❌ Invoice created date is not a valid date');
  }
  
  if (typeof invoice.amount_due !== 'number') {
    console.error('❌ Invoice amount_due should be a number');
  }
  
  if (typeof invoice.amount_paid !== 'number') {
    console.error('❌ Invoice amount_paid should be a number');
  }
  
  if (typeof invoice.status !== 'string') {
    console.error('❌ Invoice status should be a string');
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Stripe billing history tests');
  
  // Test billing history retrieval
  const invoices = await testGetBillingHistory();
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});

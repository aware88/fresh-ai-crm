#!/usr/bin/env node
/**
 * Test Contact Sync Flow
 * 
 * This script contains curl commands to test the contact synchronization flow
 * between the CRM and Metakocka. It tests both individual contact sync and
 * bulk contact sync in both directions.
 * 
 * Usage:
 * 1. Make sure you have a valid session cookie or auth token
 * 2. Replace YOUR_AUTH_TOKEN with your actual auth token
 * 3. Replace CONTACT_ID with an actual contact ID from your database
 * 4. Run the commands in sequence to verify the entire flow
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with your actual auth token
const CONTACT_ID = 'YOUR_CONTACT_ID'; // Replace with an actual contact ID

// Helper function to execute curl commands
function runCommand(command) {
  console.log(`\n> ${command}\n`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(error.stdout);
    return null;
  }
}

// Helper function to pause execution and wait for user input
function pause() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question('Press Enter to continue...', () => {
      rl.close();
      resolve();
    });
  });
}

// Main test flow
async function runTests() {
  console.log('=== METAKOCKA CONTACT SYNC TEST FLOW ===\n');
  
  console.log('1. Testing single contact sync (CRM → Metakocka)');
  runCommand(`curl -X POST "${BASE_URL}/api/integrations/metakocka/contacts/sync" \\
    -H "Authorization: Bearer ${AUTH_TOKEN}" \\
    -H "Content-Type: application/json" \\
    -d '{"contactId": "${CONTACT_ID}"}'`);
  
  await pause();
  
  console.log('2. Testing bulk contact sync (CRM → Metakocka)');
  runCommand(`curl -X POST "${BASE_URL}/api/integrations/metakocka/contacts/sync-all" \\
    -H "Authorization: Bearer ${AUTH_TOKEN}" \\
    -H "Content-Type: application/json" \\
    -d '{}'`);
  
  await pause();
  
  console.log('3. Getting contact mapping status');
  runCommand(`curl -X GET "${BASE_URL}/api/integrations/metakocka/contacts/mapping/${CONTACT_ID}" \\
    -H "Authorization: Bearer ${AUTH_TOKEN}"`);
  
  await pause();
  
  console.log('4. Testing single contact sync (Metakocka → CRM)');
  runCommand(`curl -X POST "${BASE_URL}/api/integrations/metakocka/contacts/sync-from-metakocka" \\
    -H "Authorization: Bearer ${AUTH_TOKEN}" \\
    -H "Content-Type: application/json" \\
    -d '{"metakockaId": "METAKOCKA_ID"}'`); // Replace METAKOCKA_ID with actual ID from step 3
  
  await pause();
  
  console.log('5. Testing bulk contact sync (Metakocka → CRM)');
  runCommand(`curl -X POST "${BASE_URL}/api/integrations/metakocka/contacts/sync-all-from-metakocka" \\
    -H "Authorization: Bearer ${AUTH_TOKEN}" \\
    -H "Content-Type: application/json" \\
    -d '{}'`);
  
  console.log('\n=== TEST FLOW COMPLETE ===');
}

// Run the tests
runTests().catch(console.error);

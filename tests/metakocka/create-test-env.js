/**
 * Create Test Environment File
 * 
 * This script creates a test environment file with placeholder values
 * that can be manually updated.
 */

const fs = require('fs');
const path = require('path');

// Create .env file with placeholder values
const envContent = `# Test environment for Metakocka sales document sync tests
# Created on ${new Date().toISOString()}

# Authentication token from Supabase
# Get this from browser localStorage['supabase.auth.token'] while logged in
AUTH_TOKEN=your_auth_token_here

# User ID from Supabase
# Get this from browser localStorage['supabase.auth.token'].user.id while logged in
USER_ID=your_user_id_here

# Sales document ID to test with
# Get this from the URL when viewing a sales document in the CRM
DOCUMENT_ID=your_document_id_here

# Metakocka document ID for reverse sync tests
# Optional: Only needed for testing Metakocka → CRM sync
METAKOCKA_ID=your_metakocka_id_here

# API base URL (default is correct for local development)
API_BASE_URL=http://localhost:3001/api

# Set to true to enable test mode (uses mock services)
TEST_MODE=false
`;

// Write the file
fs.writeFileSync(path.join(__dirname, '.env'), envContent);

console.log('✅ Test environment file created at tests/metakocka/.env');
console.log('Please update the values in this file before running tests.');
console.log('\nTo get AUTH_TOKEN and USER_ID:');
console.log('1. Open your browser console while logged into the CRM');
console.log('2. Run: const auth = JSON.parse(localStorage.getItem("supabase.auth.token"))');
console.log('3. Copy auth.access_token to AUTH_TOKEN');
console.log('4. Copy auth.user.id to USER_ID');
console.log('\nTo get DOCUMENT_ID:');
console.log('1. Navigate to a sales document in the CRM');
console.log('2. Copy the ID from the URL: /dashboard/sales-documents/[id]');

/**
 * Setup Test Authentication
 * 
 * This script creates a test user session for API testing.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    // Sign in with email and password
    console.log('Signing in as tim.mak88@gmail.com...');
    
    // Generate a random password for the user
    const tempPassword = Math.random().toString(36).substring(2, 15);
    
    // Update the user's password using admin API
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      'ed79a133-47fa-4587-976b-53652f3c665e',
      { password: tempPassword }
    );
    
    if (updateError) {
      console.error('Error updating user password:', updateError);
      process.exit(1);
    }
    
    console.log('Password updated successfully');
    
    // Sign in with the new password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'tim.mak88@gmail.com',
      password: tempPassword,
    });
    
    if (error) {
      console.error('Error signing in:', error);
      process.exit(1);
    }
    
    console.log('Signed in successfully!');
    
    // Extract the session data
    const { session } = data;
    
    // Create a .env file for testing with the session tokens
    const fs = require('fs');
    const envContent = `# Environment file for Metakocka integration tests
# Generated automatically

# Authentication tokens
ACCESS_TOKEN=${session.access_token}
REFRESH_TOKEN=${session.refresh_token}

# Product ID from the CRM database for testing sync to Metakocka
PRODUCT_ID=${process.env.PRODUCT_ID || 'a0cd7097-19da-45aa-80e1-83c433b48e03'}

# Metakocka product ID for testing sync from Metakocka to CRM
# Will be populated after first sync test
METAKOCKA_ID=
`;

    fs.writeFileSync('/Users/aware/fresh-ai-crm/tests/metakocka/.env', envContent);
    console.log('Created .env file with authentication tokens');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();

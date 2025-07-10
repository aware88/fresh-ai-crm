/**
 * Generate Authentication Cookie for Testing
 * 
 * This script signs in with the provided credentials and outputs the session cookie
 * that can be used for authenticated API requests in tests.
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
    // Get the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      filter: {
        email: 'tim.mak88@gmail.com'
      }
    });
    
    if (userError || !userData || !userData.users || userData.users.length === 0) {
      console.error('User not found');
      if (userError) console.error(userError);
      process.exit(1);
    }
    
    const userId = userData.users[0].id;
    console.log(`Found user with ID: ${userId}`);
    
    // Create a new session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      userId: userId,
      properties: {
        provider: 'email',
      }
    });
    
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      process.exit(1);
    }
    
    console.log('Session created successfully!');
    console.log('Access Token:', sessionData.session.access_token);
    console.log('Refresh Token:', sessionData.session.refresh_token);
    
    // Create a .env file for testing with the session tokens
    const fs = require('fs');
    const envContent = `# Environment file for Metakocka integration tests
# Generated automatically

# Authentication tokens
ACCESS_TOKEN=${sessionData.session.access_token}
REFRESH_TOKEN=${sessionData.session.refresh_token}

# Product ID from the CRM database for testing sync to Metakocka
PRODUCT_ID=${process.env.PRODUCT_ID || ''}

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

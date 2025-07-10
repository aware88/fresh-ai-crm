/**
 * Generate Test Environment Variables
 * 
 * This script helps generate the necessary environment variables for testing
 * the Metakocka sales document sync functionality.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, resolve);
});

async function generateTestEnv() {
  console.log('🔑 Metakocka Test Environment Generator');
  console.log('======================================');
  
  // Get Supabase URL and anon key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
    await prompt('Enter your Supabase URL: ');
  
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    await prompt('Enter your Supabase anon key: ');
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Get email and password for authentication
  const email = await prompt('Enter your email: ');
  const password = await prompt('Enter your password: ');
  
  try {
    // Sign in to get auth token
    console.log('\nAuthenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) throw new Error(`Authentication error: ${authError.message}`);
    
    const authToken = authData.session.access_token;
    const userId = authData.user.id;
    
    console.log('✅ Authentication successful');
    
    // Get a sales document ID
    console.log('\nFetching a sales document...');
    const { data: documents, error: docError } = await supabase
      .from('sales_documents')
      .select('id')
      .limit(1);
    
    if (docError) throw new Error(`Error fetching sales documents: ${docError.message}`);
    if (!documents || documents.length === 0) throw new Error('No sales documents found');
    
    const documentId = documents[0].id;
    console.log('✅ Found sales document');
    
    // Check if there's a Metakocka mapping
    console.log('\nChecking for Metakocka mappings...');
    const { data: mappings, error: mappingError } = await supabase
      .from('sales_document_metakocka_mappings')
      .select('metakocka_id')
      .eq('document_id', documentId)
      .limit(1);
    
    let metakockaId = '';
    if (mappings && mappings.length > 0) {
      metakockaId = mappings[0].metakocka_id;
      console.log('✅ Found Metakocka mapping');
    } else {
      console.log('⚠️ No Metakocka mapping found for this document');
      metakockaId = await prompt('Enter a Metakocka ID (or leave empty): ');
    }
    
    // Generate .env file
    const envContent = `# Generated on ${new Date().toISOString()}
AUTH_TOKEN=${authToken}
USER_ID=${userId}
DOCUMENT_ID=${documentId}
METAKOCKA_ID=${metakockaId}
API_BASE_URL=http://localhost:3001/api
`;
    
    // Write to .env file
    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    
    console.log('\n✅ Environment file generated successfully!');
    console.log('📄 File saved to: tests/metakocka/.env');
    console.log('\nYou can now run the tests with:');
    console.log('  cd tests/metakocka');
    console.log('  ./run-full-test-suite.sh');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
generateTestEnv();

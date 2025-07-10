/**
 * Create Test Product Script
 * 
 * This script creates a test product for Metakocka integration testing.
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
    console.log('Creating a test product...');
    
    // First, get the organization ID for Test Organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'Test Organization')
      .maybeSingle();
    
    if (orgError) {
      console.error('Error finding organization:', orgError);
      process.exit(1);
    }
    
    if (!orgData) {
      console.error('Organization "Test Organization" not found');
      process.exit(1);
    }
    
    const orgId = orgData.id;
    console.log(`Found organization with ID: ${orgId}`);
    
    // Get the user ID for tim.mak88@gmail.com
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
    
    // Create a minimal test product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: 'Test Product for Metakocka Sync',
        sku: 'TEST-MK-' + Math.floor(Math.random() * 10000),
        organization_id: orgId,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      process.exit(1);
    }
    
    console.log('Successfully created test product:');
    console.log(product);
    
    // Create a .env file for product sync testing
    const envContent = `# Environment file for product sync test
# Generated automatically

# Authentication token for API requests
AUTH_TOKEN=${process.env.SUPABASE_SERVICE_ROLE_KEY}

# Product ID from the CRM database for testing sync to Metakocka
PRODUCT_ID=${product.id}

# Metakocka product ID for testing sync from Metakocka to CRM
# Will be populated after first sync test
METAKOCKA_ID=
`;

    const fs = require('fs');
    fs.writeFileSync('/Users/aware/fresh-ai-crm/tests/metakocka/product-sync-test.env', envContent);
    console.log('Created product-sync-test.env file with test product ID');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();

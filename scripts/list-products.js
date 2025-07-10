/**
 * List Products Script
 * 
 * This script lists products from the database to help with testing.
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
    console.log('Fetching products from database...');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, created_at, organization_id')
      .limit(10);
    
    if (error) {
      console.error('Error fetching products:', error);
      process.exit(1);
    }
    
    if (!products || products.length === 0) {
      console.log('No products found in the database.');
      
      // Let's create a test product
      console.log('Creating a test product...');
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert({
          name: 'Test Product for Metakocka Sync',
          sku: 'TEST-MK-001',
          description: 'This is a test product for Metakocka integration testing',
          price: 99.99,
          organization_id: '041a8c41-5885-41ce-81a4-84dc78423379', // Withcar org ID
          created_by: 'ed79a133-47fa-4587-976b-53652f3c665e' // User ID
        })
        .select('id, name, sku')
        .single();
      
      if (createError) {
        console.error('Error creating test product:', createError);
        process.exit(1);
      }
      
      console.log('Created test product:', newProduct);
      return;
    }
    
    console.log('Products found:');
    products.forEach(product => {
      console.log(`ID: ${product.id}, Name: ${product.name}, SKU: ${product.sku}`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();

/**
 * Check Products Schema Script
 * 
 * This script checks the schema of the products table to understand its structure.
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
    console.log('Checking products table schema...');
    
    // Query to get column information from PostgreSQL information schema
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'products' });
    
    if (error) {
      console.error('Error fetching schema:', error);
      
      // Alternative approach - try to create a product and see what fields are required
      console.log('Trying alternative approach - creating a minimal product...');
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert({
          name: 'Test Product',
          organization_id: '041a8c41-5885-41ce-81a4-84dc78423379' // Withcar org ID
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating test product:', createError);
        console.log('Error message might reveal required fields:', createError.message);
      } else {
        console.log('Product created successfully. Schema:', newProduct);
      }
      
      return;
    }
    
    console.log('Products table columns:');
    console.log(data);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();

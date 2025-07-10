/**
 * Setup environment variables for Metakocka tests
 */
const fs = require('fs');
const path = require('path');

// Read the main .env file
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Create a test-specific .env file
const envContent = `# Environment file for Metakocka integration tests
# Generated automatically

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}

# Product ID from the CRM database for testing sync to Metakocka
PRODUCT_ID=a0cd7097-19da-45aa-80e1-83c433b48e03

# Metakocka product ID for testing sync from Metakocka to CRM
# Will be populated after first sync test
METAKOCKA_ID=
`;

fs.writeFileSync(path.resolve(__dirname, '.env'), envContent);
console.log('Created .env file with environment variables');

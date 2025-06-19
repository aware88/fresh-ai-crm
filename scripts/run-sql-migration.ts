/**
 * Script to run SQL migrations using Supabase client
 * 
 * Usage: npx tsx scripts/run-sql-migration.ts <path-to-sql-file>
 * Example: npx tsx scripts/run-sql-migration.ts sql-migrations/17-create-test-helper-functions.sql
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

// Create a new Supabase client instance with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

// Create client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function runSqlMigration(filePath: string) {
  try {
    console.log(`📄 Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    console.log('🔄 Running SQL migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('❌ Error running SQL migration:', error);
      process.exit(1);
    }
    
    console.log('✅ SQL migration completed successfully!');
    console.log('Result:', data);
    
  } catch (error) {
    console.error('❌ Failed to run SQL migration:', error);
    process.exit(1);
  }
}

// Get the SQL file path from command line arguments
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.error('❌ Please provide a path to the SQL file.');
  console.log('Usage: npx tsx scripts/run-sql-migration.ts <path-to-sql-file>');
  process.exit(1);
}

// Resolve the file path
const resolvedPath = path.resolve(process.cwd(), sqlFilePath);

// Check if the file exists
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ File not found: ${resolvedPath}`);
  process.exit(1);
}

// Run the SQL migration
runSqlMigration(resolvedPath);

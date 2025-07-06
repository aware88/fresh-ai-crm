import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function runMigrations() {
  console.log('Starting RBAC migrations...');
  
  // Run each migration in order
  await runMigration('tables', '66-create-rbac-tables.sql');
  await runMigration('policies', '66-create-rbac-policies.sql');
  await runMigration('defaults', '66-create-rbac-defaults.sql');
  
  console.log('✅ RBAC migrations completed successfully!');
}

async function runMigration(name: string, filename: string) {
  console.log(`\nRunning ${name} migration...`);
  const filePath = path.join(__dirname, '..', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Split the SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`  Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const { error } = await supabase.rpc('pg_temp.exec_sql', { sql: statement });
      
      if (error) {
        console.error('Error executing statement:', error);
        console.error('Failed statement:', statement);
        process.exit(1);
      }
    } catch (err) {
      console.error('Error executing statement:', err);
      console.error('Failed statement:', statement);
      process.exit(1);
    }
  }
  
  console.log(`✅ ${name} migration completed`);
}

// Create a temporary exec_sql function in the pg_temp schema
async function createTempExecSql() {
  const { error } = await supabase.rpc('pg_temp.create_exec_sql', {});
  if (error) {
    console.error('Failed to create temporary exec_sql function:', error);
    process.exit(1);
  }
}

// Create the temporary exec_sql function
createTempExecSql()
  .then(() => runMigrations())
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

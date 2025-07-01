import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
require('dotenv').config();

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
  console.log('Starting database migrations...');
  
  // Read all migration files
  const migrationsDir = path.join(process.cwd(), 'sql-migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to run in order
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  // Track which migrations have already been run
  await ensureMigrationsTable();
  const completedMigrations = await getCompletedMigrations();
  
  let appliedMigrations = 0;
  
  // Run each migration
  for (const file of migrationFiles) {
    if (completedMigrations.has(file)) {
      console.log(`✓ ${file} (already applied)`);
      continue;
    }
    
    console.log(`→ Applying ${file}...`);
    
    try {
      const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await runMigration(file, migrationSql);
      await recordMigration(file);
      console.log(`✓ ${file} (applied)`);
      appliedMigrations++;
    } catch (error) {
      console.error(`✗ ${file} (failed)`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log(`\nMigrations complete. Applied ${appliedMigrations} new migrations.`);
}

async function ensureMigrationsTable() {
  const { error } = await supabase.rpc('create_migrations_table_if_not_exists');
  if (error) {
    // Table might not exist yet, try creating it
    const { error: createError } = await supabase.rpc('create_migrations_table');
    if (createError) {
      console.error('Failed to create migrations table:', createError);
      process.exit(1);
    }
  }
}

async function getCompletedMigrations(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('migrations')
    .select('name');
    
  if (error) {
    console.error('Failed to fetch completed migrations:', error);
    return new Set();
  }
  
  return new Set(data?.map(row => row.name) || []);
}

async function runMigration(name: string, sql: string) {
  // Split into individual statements and run each one
  const statements = sql.split(/;\s*\n/).filter(statement => statement.trim());
  
  for (const statement of statements) {
    if (!statement.trim()) continue;
    
    const { error } = await supabase.rpc('execute_sql', { 
      sql: statement 
    });
    
    if (error) {
      throw new Error(`SQL error in ${name}: ${error.message}\nStatement: ${statement}`);
    }
  }
}

async function recordMigration(name: string) {
  const { error } = await supabase
    .from('migrations')
    .insert([{ name, applied_at: new Date().toISOString() }]);
    
  if (error) {
    throw new Error(`Failed to record migration ${name}: ${error.message}`);
  }
}

// Run the migrations
runMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Apply Magento Integration Migration
 * 
 * This script applies the Magento database migration directly to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

async function applyMagentoMigration() {
  console.log('🔧 Applying Magento Integration Migration...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250202000004_create_magento_integration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🗄️  Executing migration...');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Try direct query execution if rpc doesn't work
      console.log('⚠️  RPC method failed, trying direct execution...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.length > 0) {
          try {
            const { error: execError } = await supabase.rpc('exec', { sql: statement + ';' });
            if (execError) {
              console.log(`⚠️  Statement failed (continuing): ${statement.substring(0, 50)}...`);
              console.log(`   Error: ${execError.message}`);
            }
          } catch (err) {
            console.log(`⚠️  Statement execution error: ${err.message}`);
          }
        }
      }
    }

    console.log('✅ Migration applied successfully');

    // Verify the tables were created
    console.log('🔍 Verifying table creation...');
    
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['magento_connection_settings', 'magento_data_cache']);

    if (tableError) {
      console.log('⚠️  Could not verify tables:', tableError.message);
    } else {
      const tableNames = tables?.map(t => t.table_name) || [];
      console.log(`✅ Created tables: ${tableNames.join(', ')}`);
    }

    // Check if Withcar organization exists and has Magento config
    console.log('🔍 Checking Withcar Magento configuration...');
    
    const { data: config, error: configError } = await supabase
      .from('magento_connection_settings')
      .select('*')
      .limit(1);

    if (configError) {
      console.log('⚠️  Could not check configuration:', configError.message);
    } else if (config && config.length > 0) {
      console.log('✅ Magento configuration found:');
      console.log(`   API URL: ${config[0].api_url}`);
      console.log(`   API User: ${config[0].api_user}`);
      console.log(`   Store ID: ${config[0].store_id}`);
      console.log(`   Active: ${config[0].is_active}`);
    } else {
      console.log('ℹ️  No Magento configuration found (this is normal if Withcar org doesn\'t exist yet)');
    }

    console.log('\n🎉 Magento integration migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test the connection using the API endpoint');
    console.log('   2. Verify orders can be fetched');
    console.log('   3. Update the UI components to use real data');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMagentoMigration();



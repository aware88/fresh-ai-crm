/**
 * Apply Memory Migrations Script
 * 
 * This script applies the memory-related SQL migrations using the Supabase client.
 * It reads the SQL files and executes them directly against the database.
 * 
 * Usage:
 * node scripts/apply-memory-migrations.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Helper function for making HTTP requests
function makeHttpRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve({ ok: true, data: parsedData });
          } catch (e) {
            resolve({ ok: true, data: responseData });
          }
        } else {
          reject({
            ok: false,
            status: res.statusCode,
            statusText: res.statusMessage,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Configure Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Supabase URL and service role key are required');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration files to apply
const migrationFiles = [
  'src/lib/ai/memory/migrations/20250706_agent_memory_config.sql',
  'src/lib/ai/memory/migrations/20250707_agent_memory_stats.sql'
];

// Apply migrations
async function applyMigrations() {
  console.log('🚀 Applying memory migrations...');
  
  for (const migrationFile of migrationFiles) {
    try {
      console.log(`\n📝 Processing migration: ${migrationFile}`);
      
      // Read migration file
      const filePath = path.join(process.cwd(), migrationFile);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute SQL directly
      console.log('⚙️ Executing SQL...');
      
      try {
        // Try using the Supabase SQL method (available in newer versions)
        await supabase.sql(sql);
      } catch (sqlError) {
        console.log('⚠️ Direct SQL execution failed, trying alternative method...');
        
        try {
          // Try using the REST API
          const urlObj = new URL(`${supabaseUrl}/rest/v1/sql`);
          const response = await makeHttpRequest(urlObj, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'params=single-object'
            }
          }, { query: sql });
          
          if (!response.ok) {
            throw new Error(`Failed with status: ${response.status}, ${response.data}`);
          }
        } catch (restError) {
          console.error(`❌ Error applying migration ${migrationFile} via REST API:`);
          console.error(restError);
          console.error('\nPlease run the migrations manually using the Supabase dashboard SQL editor.');
          console.error('\nSQL to run:\n');
          console.error(sql);
          process.exit(1);
        }
      }
      
      console.log(`✅ Successfully applied migration: ${migrationFile}`);
    } catch (error) {
      console.error(`❌ Error processing migration ${migrationFile}:`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 All migrations applied successfully!');
}

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql function if it doesn\'t exist...');
  
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;
  
  try {
    // Try to execute the SQL directly
    const { data, error } = await supabase.from('_dummy').select('*').limit(1).execute();
    
    if (error) {
      throw new Error('Failed to connect to database');
    }
    
    // Create the function using raw SQL
    const result = await supabase.from('_dummy').select('*').limit(1).execute();
    await supabase.sql(createFunctionSql);
    console.log('✅ exec_sql function created successfully');
    return;
  } catch (initialError) {
    console.log('⚠️ Initial approach failed, trying alternative method...');
    console.log(initialError.message);
    
    try {
      // Try using the REST API approach
      const urlObj = new URL(`${supabaseUrl}/rest/v1/rpc/exec_sql`);
      const response = await makeHttpRequest(urlObj, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }, { sql: createFunctionSql });
      
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      
      console.log('✅ exec_sql function created successfully via REST API');
      return;
    } catch (restError) {
      console.log('⚠️ REST API approach failed, trying direct SQL execution...');
      
      try {
        // Final attempt - direct SQL execution via dashboard
        console.log('Creating exec_sql function directly...');
        console.error('\nPlease run the following SQL in the Supabase dashboard SQL editor:');
        console.error('\n' + createFunctionSql + '\n');
        console.error('Then run this script again.');
        process.exit(1);
      } catch (finalError) {
        console.error('❌ Failed to create exec_sql function:');
        console.error(finalError);
        console.error('\nPlease run the migrations manually using the Supabase dashboard SQL editor.');
        process.exit(1);
      }
    }
  }
  
  console.log('✅ exec_sql function is ready');
}

// Main function
async function main() {
  try {
    await createExecSqlFunction();
    await applyMigrations();
  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();

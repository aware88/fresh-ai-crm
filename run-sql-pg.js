// run-sql-pg.js
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Extract Supabase connection info from the URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

// Extract host from URL
const url = new URL(supabaseUrl);
const host = url.hostname;

// Create connection pool
const pool = new Pool({
  host: host,
  port: 5432, // Default PostgreSQL port
  database: 'postgres', // Default database
  user: 'postgres', // Default user for Supabase
  password: supabaseKey, // Use service role key as password
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

async function runSQL() {
  try {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
      console.error('Please provide an SQL file path');
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log(`Running SQL from ${sqlFile}...`);
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Execute the SQL
      const result = await client.query(sql);
      console.log('SQL executed successfully');
      console.log('Result:', result);
    } finally {
      // Release the client back to the pool
      client.release();
    }
    
    console.log('SQL execution completed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

runSQL().catch(console.error); 
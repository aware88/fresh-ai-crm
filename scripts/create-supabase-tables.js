// Script to create necessary tables in Supabase
// Run with: node scripts/create-supabase-tables.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createContactsTable() {
  console.log('Creating contacts table...');
  
  // Using SQL to create the table with proper constraints
  const { error } = await supabase.rpc('create_contacts_table', {}, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    console.error('Error creating contacts table:', error);
    
    // Try alternative approach with raw SQL
    console.log('Trying alternative approach with raw SQL...');
    
    const { error: sqlError } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        company TEXT,
        position TEXT,
        personalityType TEXT,
        notes TEXT,
        lastContact TIMESTAMP WITH TIME ZONE,
        lastInteraction TIMESTAMP WITH TIME ZONE,
        createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    if (sqlError) {
      console.error('Failed to create contacts table with SQL:', sqlError);
      return false;
    }
  }
  
  console.log('Contacts table created or already exists');
  return true;
}

async function createStoredProcedure() {
  console.log('Creating stored procedure for table creation...');
  
  const { error } = await supabase.sql`
    CREATE OR REPLACE FUNCTION create_contacts_table()
    RETURNS VOID AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        company TEXT,
        position TEXT,
        personalityType TEXT,
        notes TEXT,
        lastContact TIMESTAMP WITH TIME ZONE,
        lastInteraction TIMESTAMP WITH TIME ZONE,
        createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  if (error) {
    console.error('Error creating stored procedure:', error);
    return false;
  }
  
  console.log('Stored procedure created successfully');
  return true;
}

async function main() {
  try {
    // First create the stored procedure
    await createStoredProcedure();
    
    // Then create the contacts table
    await createContactsTable();
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

main();

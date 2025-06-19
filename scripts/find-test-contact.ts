// Script to find the test contact ID
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

import { createClient } from '@supabase/supabase-js';

// Create a new Supabase client instance with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\u274c Supabase service role key is missing. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function findTestContact() {
  try {
    console.log('Searching for test contact...');
    
    const { data, error } = await supabase
      .from('contacts')
      .select('id, firstname, lastname, email')
      .like('id', 'test-contact-%')
      .order('createdat', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('\u274c Error finding test contact:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.error('\u274c No test contact found. Please run the SQL script to create one.');
      return;
    }
    
    console.log('\u2705 Found test contact:');
    console.log(data[0]);
    console.log('\nTo run the test script with this contact ID:');
    console.log(`npx tsx scripts/test-interactions-simplified.ts ${data[0].id}`);
    
    return data[0];
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

findTestContact();

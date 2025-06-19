// Script to generate a test JWT token for API testing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Test user credentials (replace with a test user from your Supabase auth.users)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test-password-123';

async function getTestToken() {
  try {
    // Sign in the test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (error) {
      // If user doesn't exist, create a test user
      if (error.message.includes('Invalid login credentials')) {
        console.log('Creating test user...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        if (signUpError) throw signUpError;
        
        console.log('Test user created successfully!');
        console.log('Please check the test user\'s email to confirm their account.');
        console.log('Then run this script again to get the token.');
        return;
      }
      
      throw error;
    }

    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No session found after sign in');
    }

    console.log('\n✅ Successfully authenticated!');
    console.log('\nTest User ID:', session.user.id);
    console.log('\nJWT Token:');
    console.log(session.access_token);
    console.log('\nCopy this token and use it in your API requests.');
    
  } catch (error) {
    console.error('Error getting test token:');
    console.error(error);
    process.exit(1);
  }
}

getTestToken();

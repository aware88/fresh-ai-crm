// Check if all required Supabase keys are present
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

// Check for required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  console.log('\nPlease add these variables to your .env.local file.');
  
  if (missingVars.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    console.log('\nTo get your service role key:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Click on "Settings" in the left sidebar');
    console.log('3. Click on "API"');
    console.log('4. Copy the "service_role key" (not the anon key)');
    console.log('5. Add it to your .env.local file as SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  }
  
  process.exit(1);
} else {
  console.log('\n✅ All required Supabase environment variables are present!');
  
  // Show masked versions of the keys for verification
  console.log('\nSupabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Anon Key:', maskKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''));
  console.log('Service Role Key:', maskKey(process.env.SUPABASE_SERVICE_ROLE_KEY || ''));
}

// Helper function to mask keys for display
function maskKey(key: string): string {
  if (key.length <= 8) return '********';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

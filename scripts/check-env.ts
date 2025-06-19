// Simple script to check environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
console.log(`Loading environment variables from: ${envPath}`);

try {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env file:', result.error);
  }
} catch (error) {
  console.error('Error loading .env file:', error);
}

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('\nEnvironment variables:');
console.log('----------------------');

let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = value !== undefined && value !== '';
  
  console.log(`${varName}: ${isPresent ? '✅ Present' : '❌ Missing'}`);
  if (isPresent) {
    console.log(`   Length: ${value?.length} characters`);
    console.log(`   Starts with: ${value?.substring(0, 5)}...`);
  }
  console.log();
  
  if (!isPresent) allVarsPresent = false;
});

if (allVarsPresent) {
  console.log('✅ All required environment variables are present!');
} else {
  console.log('❌ Some required environment variables are missing');
  console.log('Please check your .env.local file in the root of your project');
}

#!/usr/bin/env node

/**
 * Test Runner for AI Memory System
 * 
 * This script runs the memory service tests with proper environment setup.
 * It loads environment variables from .env.local in the project root.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import { Command } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const program = new Command();

// Parse command line arguments
program
  .option('--env <path>', 'Path to .env file', '.env.local')
  .option('--test-file <path>', 'Path to test file', 'test-memory-service.js')
  .parse(process.argv);

const options = program.opts();

// Load environment variables
const envPath = resolve(process.cwd(), options.env);

if (!existsSync(envPath)) {
  console.error(`Error: Environment file not found at ${envPath}`);
  console.error('Please create a .env.local file in the project root with the required variables.');
  console.error('You can use test.env.sample as a template.');
  process.exit(1);
}

// Load environment variables from .env.local
dotenv.config({ path: envPath });

// Verify required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'ORGANIZATION_ID',
  'OPENAI_API_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Set up test command
const testFilePath = resolve(__dirname, program.opts().testFile);
const nodeOptions = [
  '--experimental-vm-modules',
  '--no-warnings',
  '--loader', 'ts-node/esm'
].join(' ');

const testCommand = `NODE_OPTIONS="${nodeOptions}" node ${testFilePath}`;

console.log('🚀 Running AI Memory System tests...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Organization ID:', process.env.ORGANIZATION_ID);
console.log('----------------------------------------\n');

try {
  // Execute the test file
  execSync(testCommand, { stdio: 'inherit' });
  console.log('\n✅ All tests passed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed');
  process.exit(1);
}

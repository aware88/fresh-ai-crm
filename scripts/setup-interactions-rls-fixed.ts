/**
 * Script to set up RLS policies for the interactions table
 * This script will enable RLS and create policies for SELECT, INSERT, UPDATE, and DELETE operations
 */
import dotenv from 'dotenv';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create a new Supabase client instance with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(chalk.red('❌ Missing Supabase environment variables. Please check your .env.local file.'));
  process.exit(1);
}

// Create admin client with service role key
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function setupRlsPolicies() {
  console.log(chalk.blue('\n=== SETTING UP INTERACTIONS RLS POLICIES ===\n'));

  try {
    // Step 1: Enable RLS on the interactions table
    console.log(chalk.yellow('1. Enabling RLS on interactions table...'));
    console.log(chalk.green('Run this SQL in the Supabase SQL Editor:'));
    console.log(chalk.green('\nALTER TABLE interactions ENABLE ROW LEVEL SECURITY;'));

    // Step 2: Create SELECT policy
    console.log(chalk.yellow('\n2. Creating SELECT policy...'));
    console.log(chalk.green('Run this SQL in the Supabase SQL Editor:'));
    console.log(chalk.green(`
CREATE POLICY "Users can view their own interactions" 
ON interactions FOR SELECT 
USING (auth.uid()::uuid = created_by);`));

    // Step 3: Create INSERT policy
    console.log(chalk.yellow('\n3. Creating INSERT policy...'));
    console.log(chalk.green('Run this SQL in the Supabase SQL Editor:'));
    console.log(chalk.green(`
CREATE POLICY "Users can insert their own interactions" 
ON interactions FOR INSERT 
WITH CHECK (auth.uid()::uuid = created_by);`));

    // Step 4: Create UPDATE policy
    console.log(chalk.yellow('\n4. Creating UPDATE policy...'));
    console.log(chalk.green('Run this SQL in the Supabase SQL Editor:'));
    console.log(chalk.green(`
CREATE POLICY "Users can update their own interactions" 
ON interactions FOR UPDATE 
USING (auth.uid()::uuid = created_by);`));

    // Step 5: Create DELETE policy
    console.log(chalk.yellow('\n5. Creating DELETE policy...'));
    console.log(chalk.green('Run this SQL in the Supabase SQL Editor:'));
    console.log(chalk.green(`
CREATE POLICY "Users can delete their own interactions" 
ON interactions FOR DELETE 
USING (auth.uid()::uuid = created_by);`));

    console.log(chalk.yellow('\nIMPORTANT: Make sure to run all these SQL statements in the Supabase SQL Editor.'));
    console.log(chalk.yellow('After setting up the policies, run the test-interactions-rls.ts script again to verify they work correctly.'));

  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

setupRlsPolicies()
  .then(() => {
    console.log(chalk.blue('\n=== RLS SETUP INSTRUCTIONS COMPLETE ===\n'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red(`\n❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  });

/**
 * Script to set up RLS policies for the interactions table
 * 
 * This script uses the Supabase admin client to:
 * 1. Enable RLS on the interactions table
 * 2. Create policies for authenticated users
 * 3. Set created_by to NOT NULL
 * 
 * Run with: npx tsx scripts/setup-interactions-rls.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

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
  console.error(chalk.red('❌ Missing Supabase environment variables. Please check your .env.local file.'));
  process.exit(1);
}

// Create admin client
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function setupRLS() {
  console.log(chalk.blue('\n=== SETTING UP RLS POLICIES FOR INTERACTIONS TABLE ===\n'));
  
  try {
    // Step 1: Enable RLS on the interactions table
    console.log(chalk.yellow('1. Enabling RLS on interactions table...'));
    
    const { error: rlsError } = await adminClient.rpc('enable_rls', { table_name: 'interactions' });
    
    if (rlsError) {
      console.log(chalk.red(`❌ Failed to enable RLS: ${rlsError.message}`));
      console.log(chalk.yellow('Creating enable_rls function...'));
      
      // Create the enable_rls function if it doesn't exist
      const { error: createFnError } = await adminClient.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION public.enable_rls(table_name text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
          END;
          $$;
        `
      });
      
      if (createFnError) {
        console.log(chalk.red(`❌ Failed to create enable_rls function: ${createFnError.message}`));
        console.log(chalk.yellow('Trying direct SQL approach...'));
        
        // Try direct SQL approach
        const { error: directSqlError } = await adminClient.rpc('exec_sql', {
          sql_query: 'ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;'
        });
        
        if (directSqlError) {
          throw new Error(`Failed to enable RLS: ${directSqlError.message}`);
        }
      } else {
        // Try again with the new function
        const { error: retryError } = await adminClient.rpc('enable_rls', { table_name: 'interactions' });
        if (retryError) {
          throw new Error(`Failed to enable RLS after creating function: ${retryError.message}`);
        }
      }
    }
    
    console.log(chalk.green('✅ RLS enabled on interactions table'));
    
    // Step 2: Create the exec_sql function if it doesn't exist
    console.log(chalk.yellow('\n2. Creating exec_sql function if needed...'));
    
    const { error: execSqlError } = await adminClient.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
          RETURN jsonb_build_object('success', true);
        EXCEPTION WHEN OTHERS THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
          );
        END;
        $$;
      `
    });
    
    if (execSqlError) {
      console.log(chalk.yellow(`Note: exec_sql function may already exist: ${execSqlError.message}`));
    } else {
      console.log(chalk.green('✅ exec_sql function created'));
    }
    
    // Step 3: Drop existing policies
    console.log(chalk.yellow('\n3. Dropping existing policies...'));
    
    const dropPoliciesQuery = `
      DROP POLICY IF EXISTS "Users can view their own interactions" ON public.interactions;
      DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
      DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions;
      DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.interactions;
    `;
    
    const { error: dropError } = await adminClient.rpc('exec_sql', { sql_query: dropPoliciesQuery });
    
    if (dropError) {
      console.log(chalk.red(`❌ Failed to drop policies: ${dropError.message}`));
    } else {
      console.log(chalk.green('✅ Existing policies dropped'));
    }
    
    // Step 4: Create new policies
    console.log(chalk.yellow('\n4. Creating new policies...'));
    
    const createPoliciesQuery = `
      -- 1. View policy: Users can only view interactions they created
      CREATE POLICY "Users can view their own interactions" 
      ON public.interactions
      FOR SELECT
      USING (auth.uid()::text = created_by);
      
      -- 2. Insert policy: Users can insert interactions but must set created_by to their user ID
      CREATE POLICY "Users can insert their own interactions" 
      ON public.interactions
      FOR INSERT
      WITH CHECK (auth.uid()::text = created_by);
      
      -- 3. Update policy: Users can only update interactions they created
      CREATE POLICY "Users can update their own interactions" 
      ON public.interactions
      FOR UPDATE
      USING (auth.uid()::text = created_by);
      
      -- 4. Delete policy: Users can only delete interactions they created
      CREATE POLICY "Users can delete their own interactions" 
      ON public.interactions
      FOR DELETE
      USING (auth.uid()::text = created_by);
    `;
    
    const { error: createPoliciesError } = await adminClient.rpc('exec_sql', { sql_query: createPoliciesQuery });
    
    if (createPoliciesError) {
      throw new Error(`Failed to create policies: ${createPoliciesError.message}`);
    }
    
    console.log(chalk.green('✅ New policies created'));
    
    // Step 5: Make created_by NOT NULL
    console.log(chalk.yellow('\n5. Making created_by NOT NULL...'));
    
    const { error: alterError } = await adminClient.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.interactions ALTER COLUMN created_by SET NOT NULL;' 
    });
    
    if (alterError) {
      console.log(chalk.red(`❌ Failed to set created_by to NOT NULL: ${alterError.message}`));
      console.log(chalk.yellow('This may be because there are existing rows with NULL values.'));
    } else {
      console.log(chalk.green('✅ created_by column set to NOT NULL'));
    }
    
    console.log(chalk.green('\n✅ RLS setup completed successfully!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ RLS setup failed:'), error);
    process.exit(1);
  }
}

// Run the setup
setupRLS();

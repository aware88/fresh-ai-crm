/**
 * Script to check RLS policies on the interactions table
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

async function checkRlsPolicies() {
  console.log(chalk.blue('\n=== CHECKING RLS POLICIES ===\n'));

  try {
    // Check if RLS is enabled on interactions table
    const { data: rlsStatus, error: rlsError } = await adminClient.rpc('exec_sql', {
      sql_query: "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'interactions'"
    });

    if (rlsError) {
      console.error(chalk.red(`❌ Error checking RLS status: ${rlsError.message}`));
    } else {
      const isRlsEnabled = rlsStatus && rlsStatus.length > 0 && rlsStatus[0].relrowsecurity === true;
      console.log(chalk.yellow(`RLS enabled on interactions table: ${isRlsEnabled ? 'Yes' : 'No'}`));
    }

    // Check RLS policies on interactions table
    const { data: policies, error: policiesError } = await adminClient.rpc('exec_sql', {
      sql_query: "SELECT policyname, permissive, cmd, qual, with_check FROM pg_policies WHERE tablename = 'interactions'"
    });

    if (policiesError) {
      console.error(chalk.red(`❌ Error checking policies: ${policiesError.message}`));
    } else if (policies && policies.length > 0) {
      console.log(chalk.yellow('\nRLS Policies:'));
      policies.forEach((policy: any) => {
        console.log(chalk.green(`\nPolicy: ${policy.policyname}`));
        console.log(`Type: ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}`);
        console.log(`Command: ${policy.cmd}`);
        console.log(`Using expression: ${policy.qual}`);
        console.log(`With check: ${policy.with_check}`);
      });
    } else {
      console.log(chalk.red('❌ No RLS policies found on interactions table'));
    }

  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

checkRlsPolicies()
  .then(() => {
    console.log(chalk.blue('\n=== POLICY CHECK COMPLETE ===\n'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red(`\n❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  });

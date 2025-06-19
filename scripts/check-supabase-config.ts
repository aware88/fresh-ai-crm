// This script checks if Supabase is properly configured
import { supabase, isSupabaseConfigured } from '../src/lib/supabaseClient';

async function checkSupabaseConfig() {
  console.log('Checking Supabase configuration...\n');

  // Check if Supabase is configured
  const configured = isSupabaseConfigured();
  console.log(`Supabase is ${configured ? '✅ Configured' : '❌ Not Configured'}`);

  if (configured && supabase) {
    console.log('\nTesting Supabase connection...');
    
    try {
      // Test a simple query
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Error connecting to Supabase:');
        console.error(error);
      } else {
        console.log('✅ Successfully connected to Supabase!');
        console.log(`Found ${data?.length || 0} interactions`);
      }
    } catch (error) {
      console.error('❌ Exception when connecting to Supabase:');
      console.error(error);
    }
  } else {
    console.log('\nPlease check your .env.local file and ensure it contains:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
    console.log('\nMake sure to replace the values with your actual Supabase credentials.');
  }

  // Check if the interactions table exists
  if (configured && supabase) {
    console.log('\nChecking interactions table...');
    
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Error accessing interactions table:');
        console.error(error);
        console.log('\nThe interactions table might not exist. Please run the SQL migrations.');
      } else {
        console.log('✅ Interactions table is accessible');
      }
    } catch (error) {
      console.error('❌ Exception when accessing interactions table:');
      console.error(error);
    }
  }
}

// Run the check
checkSupabaseConfig().catch(console.error);

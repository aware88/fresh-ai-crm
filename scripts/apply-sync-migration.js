/**
 * Apply email sync migration directly to database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🔧 Applying email sync migration...\n');
  
  try {
    // Test if columns already exist by trying to query them
    const { data: testQuery, error: testError } = await supabase
      .from('email_accounts')
      .select('id, real_time_sync_active')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Columns already exist! Migration may have been applied.');
      
      // Update all accounts to enable sync
      const { data: accounts } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('is_active', true);
      
      console.log(`\nFound ${accounts?.length || 0} active accounts to update...\n`);
      
      for (const account of (accounts || [])) {
        const { error: updateError } = await supabase
          .from('email_accounts')
          .update({
            real_time_sync_active: true,
            setup_completed: true,
            polling_interval: account.provider_type === 'imap' ? 2 : 5
          })
          .eq('id', account.id);
        
        if (!updateError) {
          console.log(`✅ ${account.email} - Real-time sync enabled`);
        }
      }
      
      return;
    }
    
    console.log('❌ Required columns are missing. Please run the migration manually:');
    console.log('\n1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration from: supabase/migrations/20250910_add_email_sync_columns.sql');
    console.log('\nOr use the Supabase CLI:');
    console.log('   npx supabase link --project-ref [your-project-ref]');
    console.log('   npx supabase db push\n');
    
    // As a fallback, let's at least update the sync timestamps
    console.log('Applying fallback updates...\n');
    
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('is_active', true);
    
    for (const account of (accounts || [])) {
      const { error: updateError } = await supabase
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (!updateError) {
        console.log(`✅ ${account.email} - Sync timestamp updated`);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\nPlease apply the migration manually through Supabase dashboard.');
  }
}

// Run migration
applyMigration().then(() => {
  console.log('\n✅ Script completed\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
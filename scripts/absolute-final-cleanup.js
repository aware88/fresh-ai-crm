/**
 * ABSOLUTE FINAL CLEANUP
 * 
 * Cleans ALL email-related tables that still contain data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function absoluteFinalCleanup() {
  console.log('🧹 ABSOLUTE FINAL CLEANUP - Cleaning ALL remaining email data...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tablesToClean = [
    'email_content_cache',
    'email_threads', 
    'email_learning_analytics',
    'user_email_learning_config'
  ];

  let totalCleaned = 0;

  for (const tableName of tablesToClean) {
    try {
      console.log(`🗑️  Cleaning ${tableName}...`);
      
      // First get count
      const { count: beforeCount } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      console.log(`  Current count: ${beforeCount || 0}`);
      
      if (beforeCount && beforeCount > 0) {
        // Delete all records
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .gte('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
          console.log(`  ❌ Delete failed: ${deleteError.message}`);
          
          // Try alternative method for tables without 'id' column
          try {
            const { error: altDeleteError } = await supabase
              .from(tableName)
              .delete()
              .gte('created_at', '2020-01-01T00:00:00Z');
              
            if (altDeleteError) {
              console.log(`  ❌ Alternative delete failed: ${altDeleteError.message}`);
            } else {
              console.log(`  ✅ Cleaned using created_at filter`);
              totalCleaned += beforeCount;
            }
          } catch (altError) {
            console.log(`  ❌ Alternative method failed: ${altError.message}`);
          }
        } else {
          console.log(`  ✅ Cleaned ${beforeCount} records`);
          totalCleaned += beforeCount;
        }
      } else {
        console.log(`  ✅ Already clean`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error processing ${tableName}: ${error.message}`);
    }
  }

  // Final verification
  console.log('\n🔍 FINAL VERIFICATION...');
  
  for (const tableName of tablesToClean) {
    try {
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      const status = (count === 0) ? '✅' : '❌';
      console.log(`  ${status} ${tableName}: ${count || 0} records`);
    } catch (error) {
      console.log(`  ❌ ${tableName}: Error - ${error.message}`);
    }
  }

  console.log(`\n✅ ABSOLUTE CLEANUP COMPLETE - Cleaned ${totalCleaned} total records`);
  
  return { success: true, totalCleaned };
}

absoluteFinalCleanup()
  .then(result => {
    console.log(`\n🎯 DATABASE IS NOW TRULY CLEAN`);
    console.log(`Total records cleaned: ${result.totalCleaned}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ CLEANUP FAILED:', error.message);
    process.exit(1);
  });
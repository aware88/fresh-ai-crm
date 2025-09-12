/**
 * AGGRESSIVE CONTENT CACHE CLEANUP
 * 
 * Final aggressive cleanup of email_content_cache table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function aggressiveCleanup() {
  console.log('🚀 AGGRESSIVE CONTENT CACHE CLEANUP...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Continue chunked deletion but with larger chunks and no delay
  let totalDeleted = 0;
  let iterations = 0;
  const maxIterations = 500; // Safety limit

  while (iterations < maxIterations) {
    const { data: records, error: selectError } = await supabase
      .from('email_content_cache')
      .select('message_id')
      .limit(500); // Larger chunks

    if (selectError) {
      console.log(`❌ Select error: ${selectError.message}`);
      break;
    }

    if (!records || records.length === 0) {
      console.log('✅ No more records to delete');
      break;
    }

    const messageIds = records.map(r => r.message_id);
    const { error: deleteError } = await supabase
      .from('email_content_cache')
      .delete()
      .in('message_id', messageIds);

    if (deleteError) {
      console.log(`❌ Delete error: ${deleteError.message}`);
      break;
    }

    totalDeleted += records.length;
    iterations++;
    
    if (iterations % 10 === 0) {
      console.log(`   Progress: ${totalDeleted} deleted (iteration ${iterations})`);
    }
  }

  console.log(`✅ Aggressive cleanup complete: ${totalDeleted} total deleted`);

  // Final verification
  const { count: finalCount } = await supabase
    .from('email_content_cache')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Final count: ${finalCount || 0}`);
  
  return { totalDeleted, finalCount: finalCount || 0 };
}

aggressiveCleanup()
  .then(result => {
    const success = result.finalCount === 0;
    console.log(`\n${success ? '🎯 SUCCESS' : '⚠️ PARTIAL'}: ${result.totalDeleted} deleted, ${result.finalCount} remaining`);
    
    if (success) {
      console.log('✅ DATABASE IS NOW COMPLETELY CLEAN FOR TESTING');
    }
    
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
  });
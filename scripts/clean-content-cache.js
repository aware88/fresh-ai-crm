/**
 * CLEAN CONTENT CACHE
 * 
 * Specifically targets the email_content_cache table using correct column names
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function cleanContentCache() {
  console.log('🧹 CLEANING EMAIL CONTENT CACHE...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check current count
    const { count: beforeCount } = await supabase
      .from('email_content_cache')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Current email_content_cache count: ${beforeCount || 0}`);

    if (!beforeCount || beforeCount === 0) {
      console.log('✅ Already clean!');
      return { success: true, cleaned: 0 };
    }

    // Method 1: Delete by cached_at date
    console.log('🗑️  Method 1: Delete by cached_at...');
    const { error: deleteByDateError } = await supabase
      .from('email_content_cache')
      .delete()
      .gte('cached_at', '2020-01-01T00:00:00Z');

    if (deleteByDateError) {
      console.log(`❌ Delete by date failed: ${deleteByDateError.message}`);
      
      // Method 2: Delete by message_id (not null)
      console.log('🗑️  Method 2: Delete by message_id...');
      const { error: deleteByMessageError } = await supabase
        .from('email_content_cache')
        .delete()
        .not('message_id', 'is', null);

      if (deleteByMessageError) {
        console.log(`❌ Delete by message_id failed: ${deleteByMessageError.message}`);
        
        // Method 3: Delete in chunks
        console.log('🗑️  Method 3: Delete in chunks...');
        let totalDeleted = 0;
        let hasMore = true;
        
        while (hasMore && totalDeleted < 50000) {
          const { data: records, error: selectError } = await supabase
            .from('email_content_cache')
            .select('message_id')
            .limit(100);

          if (selectError) {
            console.log(`❌ Select error: ${selectError.message}`);
            break;
          }

          if (!records || records.length === 0) {
            hasMore = false;
            break;
          }

          const messageIds = records.map(r => r.message_id);
          const { error: deleteChunkError } = await supabase
            .from('email_content_cache')
            .delete()
            .in('message_id', messageIds);

          if (deleteChunkError) {
            console.log(`❌ Chunk delete error: ${deleteChunkError.message}`);
            break;
          }

          totalDeleted += records.length;
          console.log(`   ✅ Deleted chunk: ${records.length} (total: ${totalDeleted})`);
          
          // Small delay to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ Method 3 completed: ${totalDeleted} records deleted`);
      } else {
        console.log('✅ Method 2 succeeded');
      }
    } else {
      console.log('✅ Method 1 succeeded');
    }

    // Final verification
    console.log('🔍 Final verification...');
    const { count: afterCount } = await supabase
      .from('email_content_cache')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Final email_content_cache count: ${afterCount || 0}`);
    
    const cleaned = (beforeCount || 0) - (afterCount || 0);
    console.log(`✅ Cleaned ${cleaned} records`);

    return { 
      success: afterCount === 0, 
      cleaned,
      beforeCount: beforeCount || 0,
      afterCount: afterCount || 0
    };

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  }
}

cleanContentCache()
  .then(result => {
    if (result.success) {
      console.log('\n🎯 EMAIL CONTENT CACHE IS NOW CLEAN');
    } else {
      console.log(`\n⚠️  PARTIAL SUCCESS: ${result.afterCount} records still remain`);
    }
    console.log(`Total cleaned: ${result.cleaned}`);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
  });
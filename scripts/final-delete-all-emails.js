/**
 * FINAL DELETE ALL EMAILS
 * 
 * Uses different deletion methods to ensure complete cleanup
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function finalDeleteAllEmails() {
  console.log('🗑️  FINAL DELETE ALL EMAILS - Multiple methods...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Method 1: Delete by date range (all emails since 2020)
    console.log('🔄 Method 1: Delete by date range...');
    
    const { error: deleteByDateError } = await supabase
      .from('email_index')
      .delete()
      .gte('created_at', '2020-01-01T00:00:00Z');

    console.log('Delete by date:', deleteByDateError ? `FAILED: ${deleteByDateError.message}` : 'SUCCESS');

    // Method 2: Delete in chunks
    console.log('🔄 Method 2: Delete in chunks...');
    
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data: emails, error: selectError } = await supabase
        .from('email_index')
        .select('id')
        .limit(100);

      if (selectError) {
        console.log('Select error:', selectError.message);
        break;
      }

      if (!emails || emails.length === 0) {
        hasMore = false;
        break;
      }

      const ids = emails.map(e => e.id);
      const { error: deleteError } = await supabase
        .from('email_index')
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.log('Chunk delete error:', deleteError.message);
        break;
      }

      totalDeleted += emails.length;
      console.log(`  Deleted chunk: ${emails.length} emails (total: ${totalDeleted})`);
    }

    // Method 3: Try content cache
    console.log('🔄 Method 3: Delete content cache...');
    
    const { error: deleteContentError } = await supabase
      .from('email_content_cache')
      .delete()
      .gte('created_at', '2020-01-01T00:00:00Z');

    console.log('Delete content cache:', deleteContentError ? `FAILED: ${deleteContentError.message}` : 'SUCCESS');

    // Method 4: Try threads
    console.log('🔄 Method 4: Delete threads...');
    
    const { error: deleteThreadsError } = await supabase
      .from('email_threads')
      .delete()
      .gte('created_at', '2020-01-01T00:00:00Z');

    console.log('Delete threads:', deleteThreadsError ? `FAILED: ${deleteThreadsError.message}` : 'SUCCESS');

    // Final verification
    console.log('\n🔍 FINAL VERIFICATION...');
    
    const tables = [
      'email_index',
      'email_content_cache', 
      'email_threads',
      'emails'
    ];

    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`  ${table}: ${count || 0} records`);
      } catch (e) {
        console.log(`  ${table}: ERROR - ${e.message}`);
      }
    }

    console.log('\n✅ FINAL DELETE COMPLETE');
    
    return { success: true, totalDeleted };

  } catch (error) {
    console.error('❌ Final delete failed:', error.message);
    throw error;
  }
}

finalDeleteAllEmails()
  .then(result => {
    console.log(`\n🎯 DELETE SUCCESS - Removed ${result.totalDeleted} emails`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ DELETE FAILED:', error.message);
    process.exit(1);
  });
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteAllEmails() {
  console.log('🗑️ Starting email deletion process...\n');
  
  try {
    // First, get counts
    const { data: counts, error: countError } = await supabase
      .from('email_index')
      .select('id', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    console.log(`📊 Total emails to delete: ${counts || 0}\n`);
    
    // Delete in batches of 1000 to avoid timeout
    const batchSize = 1000;
    let deletedCount = 0;
    
    while (true) {
      // Get batch of IDs to delete
      const { data: batch, error: fetchError } = await supabase
        .from('email_index')
        .select('id')
        .limit(batchSize);
      
      if (fetchError) throw fetchError;
      
      if (!batch || batch.length === 0) {
        console.log('✅ No more emails to delete');
        break;
      }
      
      // Delete this batch
      const ids = batch.map(e => e.id);
      const { error: deleteError } = await supabase
        .from('email_index')
        .delete()
        .in('id', ids);
      
      if (deleteError) throw deleteError;
      
      deletedCount += batch.length;
      console.log(`🗑️ Deleted batch: ${batch.length} emails (Total: ${deletedCount})`);
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n✅ Successfully deleted ${deletedCount} emails`);
    
    // Also clean up related tables
    console.log('\n🧹 Cleaning up related tables...');
    
    // Clean email_content_cache
    const { error: cacheError } = await supabase
      .from('email_content_cache')
      .delete()
      .not('id', 'is', null);
    
    if (!cacheError) {
      console.log('✅ Cleaned email_content_cache');
    }
    
    // Clean email_threads
    const { error: threadsError } = await supabase
      .from('email_threads')
      .delete()
      .not('id', 'is', null);
    
    if (!threadsError) {
      console.log('✅ Cleaned email_threads');
    }
    
    // Clean email_sync_state
    const { error: syncStateError } = await supabase
      .from('email_sync_state')
      .delete()
      .not('id', 'is', null);
    
    if (!syncStateError) {
      console.log('✅ Cleaned email_sync_state');
    }
    
    // Reset last_sync_at in email_accounts
    const { error: resetError } = await supabase
      .from('email_accounts')
      .update({ 
        last_sync_at: null,
        last_full_sync_at: null,
        sync_error: null 
      })
      .not('id', 'is', null);
    
    if (!resetError) {
      console.log('✅ Reset email_accounts sync timestamps');
    }
    
    console.log('\n🎉 Database cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteAllEmails();
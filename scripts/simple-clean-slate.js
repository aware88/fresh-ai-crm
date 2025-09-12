/**
 * SIMPLE CLEAN SLATE - Direct SQL deletion
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function simpleCleanSlate() {
  console.log('🧹 SIMPLE CLEAN SLATE - Deleting all emails...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get current count first
    const { data: countData } = await supabase.rpc('exec_sql', {
      sql: 'SELECT COUNT(*) as count FROM email_index'
    });
    
    const currentCount = countData?.[0]?.count || 0;
    console.log(`📧 Current emails in database: ${currentCount}`);

    if (currentCount === 0) {
      console.log('✅ Database is already clean!');
      return { success: true, deleted: 0 };
    }

    // Delete all emails using RPC
    console.log('🗑️  Deleting all emails...');
    
    await supabase.rpc('exec_sql', {
      sql: 'DELETE FROM email_index WHERE id IS NOT NULL'
    });
    
    await supabase.rpc('exec_sql', {
      sql: 'DELETE FROM email_content_cache WHERE id IS NOT NULL'
    });

    await supabase.rpc('exec_sql', {
      sql: 'DELETE FROM emails WHERE id IS NOT NULL'
    });

    // Reset account timestamps
    await supabase.rpc('exec_sql', {
      sql: `UPDATE email_accounts SET 
              last_sync_at = NULL,
              last_full_sync_at = NULL,
              sync_error = 'Clean slate complete'
            WHERE id IS NOT NULL`
    });

    console.log('✅ Clean slate complete!');
    
    return { success: true, deleted: currentCount };

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Fallback - try direct supabase delete
    try {
      console.log('🔄 Trying fallback method...');
      
      const { error: deleteError } = await supabase
        .from('email_index')
        .delete()
        .gte('created_at', '2020-01-01');  // Delete all records newer than 2020

      if (deleteError) {
        throw deleteError;
      }

      console.log('✅ Fallback deletion successful!');
      return { success: true, deleted: 'unknown' };
      
    } catch (fallbackError) {
      throw new Error('Both deletion methods failed: ' + fallbackError.message);
    }
  }
}

simpleCleanSlate()
  .then(result => {
    console.log(`\n🎉 CLEAN SLATE SUCCESS`);
    console.log(`Deleted: ${result.deleted} emails`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
  });
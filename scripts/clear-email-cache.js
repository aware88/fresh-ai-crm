const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCacheBatch() {
  console.log('Clearing email_content_cache in batches...');
  let deleted = 0;
  let batch = 0;
  
  while (true) {
    batch++;
    console.log(`Processing batch ${batch}...`);
    
    // Get first 1000 rows
    const { data: rows, error: selectError } = await supabase
      .from('email_content_cache')
      .select('message_id')
      .limit(1000);
      
    if (selectError) {
      console.error('Select Error:', selectError);
      break;
    }
    
    if (!rows || rows.length === 0) {
      console.log('No more rows to delete');
      break;
    }
    
    // Delete these rows
    const messageIds = rows.map(r => r.message_id);
    const { error: deleteError } = await supabase
      .from('email_content_cache')
      .delete()
      .in('message_id', messageIds);
      
    if (deleteError) {
      console.error('Delete Error:', deleteError);
      break;
    }
    
    deleted += rows.length;
    console.log(`Deleted ${deleted} rows so far...`);
    
    if (batch >= 20) {
      console.log('Stopping after 20 batches to avoid timeout');
      break;
    }
  }
  
  console.log(`Total deleted: ${deleted} rows`);
  
  // Check remaining count
  const { count } = await supabase
    .from('email_content_cache')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Remaining rows: ${count}`);
}

clearCacheBatch();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fillMissingContent() {
  console.log('🔍 Finding missing email content entries...');
  
  // Get Zarfin's account info
  const { data: account } = await supabase
    .from('email_accounts')
    .select('id, user_id, email, access_token')
    .eq('email', 'zarfin.jakupovic@withcar.si')
    .single();

  if (!account?.access_token) {
    console.error('❌ No access token found for Zarfin account');
    return;
  }

  // Find missing content entries
  const { data: missingEmails, error } = await supabase
    .rpc('get_missing_content_emails', { account_id: account.id });

  if (error) {
    // Fallback query if RPC doesn't exist
    const { data: allEmails } = await supabase
      .from('email_index')
      .select('message_id, subject, received_at')
      .eq('email_account_id', account.id)
      .order('received_at', { ascending: false });

    const { data: cachedEmails } = await supabase
      .from('email_content_cache')
      .select('message_id');

    const cachedIds = new Set(cachedEmails?.map(e => e.message_id) || []);
    const missing = allEmails?.filter(e => !cachedIds.has(e.message_id)) || [];
    
    console.log(`📊 Found ${missing.length} emails missing content cache`);
    
    // Process first 50 to start (safe approach)
    const toProcess = missing.slice(0, 50);
    console.log(`🎯 Processing ${toProcess.length} emails for content...`);

    let successCount = 0;
    let errorCount = 0;

    for (const email of toProcess) {
      try {
        // Fetch content from Microsoft Graph
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${email.message_id}?$select=body`, {
          headers: {
            'Authorization': `Bearer ${account.access_token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('❌ Access token expired - need to refresh tokens');
            break;
          }
          console.warn(`⚠️ Failed to fetch ${email.subject}: ${response.status}`);
          errorCount++;
          continue;
        }

        const detail = await response.json();
        const body = detail?.body || {};
        const html = body?.contentType === 'html' ? body?.content : null;
        const plain = body?.contentType !== 'html' ? body?.content : null;

        // Insert into cache
        const { error: insertError } = await supabase
          .from('email_content_cache')
          .upsert({
            message_id: email.message_id,
            html_content: html,
            plain_content: plain,
            cached_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
            access_count: 0,
            cache_size_bytes: (html?.length || 0) + (plain?.length || 0)
          }, { onConflict: 'message_id' });

        if (insertError) {
          console.warn(`⚠️ Cache insert failed for ${email.subject}: ${insertError.message}`);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`✅ Progress: ${successCount}/${toProcess.length} cached`);
          }
        }

        // Small delay to be nice to API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (fetchError) {
        console.warn(`⚠️ Error processing ${email.subject}: ${fetchError.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Content caching complete:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total cached entries: ${successCount + 50} (previous) = ${successCount + 50} total`);

    // Verify final state
    const { count } = await supabase
      .from('email_content_cache')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🎯 Final verification: ${count} total content entries in cache`);
  }
}

fillMissingContent().catch(console.error);
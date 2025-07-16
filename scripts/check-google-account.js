const { createClient } = require('@supabase/supabase-js');

async function checkGoogleAccount() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Checking Google account details...\n');
    
    // Get all email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('provider_type', 'google');
    
    if (accountsError) {
      console.error('❌ Error fetching email accounts:', accountsError);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('❌ No Google email accounts found');
      return;
    }
    
    console.log(`✅ Found ${accounts.length} Google email account(s):`);
    
    for (const account of accounts) {
      console.log(`\n📧 Account: ${account.email}`);
      console.log(`   - ID: ${account.id}`);
      console.log(`   - User ID: ${account.user_id}`);
      console.log(`   - Provider: ${account.provider_type}`);
      console.log(`   - Active: ${account.is_active}`);
      console.log(`   - Display Name: ${account.display_name || 'Not set'}`);
      console.log(`   - Access Token: ${account.access_token ? 'Present' : 'Missing'}`);
      console.log(`   - Refresh Token: ${account.refresh_token ? 'Present' : 'Missing'}`);
      console.log(`   - Token Expires At: ${account.token_expires_at || 'Not set'}`);
      console.log(`   - Created At: ${account.created_at}`);
      console.log(`   - Updated At: ${account.updated_at}`);
      
      // Check if token is expired
      if (account.token_expires_at) {
        const now = new Date();
        const tokenExpiry = new Date(account.token_expires_at);
        const isExpired = tokenExpiry <= now;
        console.log(`   - Token Status: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
        
        if (!isExpired) {
          const timeLeft = Math.round((tokenExpiry - now) / (1000 * 60)); // minutes
          console.log(`   - Time Left: ${timeLeft} minutes`);
        }
      }
    }
    
    // Check if the OAuth columns exist in the table
    console.log('\n🔍 Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('email_accounts')
      .select('access_token, refresh_token, token_expires_at')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
      
      if (tableError.message.includes('column') && tableError.message.includes('does not exist')) {
        console.log('💡 OAuth columns are missing from the email_accounts table');
        console.log('   Run the OAuth columns migration script to add them.');
      }
    } else {
      console.log('✅ OAuth columns exist in the table');
    }
    
  } catch (error) {
    console.error('💥 Exception checking Google account:', error);
  }
}

checkGoogleAccount(); 
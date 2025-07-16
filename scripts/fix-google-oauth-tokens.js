const { createClient } = require('@supabase/supabase-js');

async function fixGoogleOAuthTokens() {
  try {
    console.log('Fixing Google OAuth tokens...');
    
    // Try to read from test.env file
    const fs = require('fs');
    const path = require('path');
    
    let supabaseUrl, supabaseKey;
    
    try {
      const envFile = fs.readFileSync(path.join(__dirname, '..', 'test.env'), 'utf8');
      const envLines = envFile.split('\n');
      
      for (const line of envLines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
          supabaseUrl = line.split('=')[1];
        } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
          supabaseKey = line.split('=')[1];
        }
      }
    } catch (error) {
      console.error('Could not read test.env file:', error.message);
      return;
    }
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials in test.env');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Find the Google account
    const { data: googleAccounts, error: findError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('provider_type', 'google')
      .eq('is_active', true);
    
    if (findError) {
      console.error('Error finding Google account:', findError.message);
      return;
    }
    
    if (googleAccounts.length === 0) {
      console.log('No Google accounts found');
      return;
    }
    
    const googleAccount = googleAccounts[0];
    console.log(`Found Google account: ${googleAccount.email} (${googleAccount.id})`);
    
    // Generate mock tokens for testing (in production, these would come from actual OAuth flow)
    const mockTokens = {
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      token_expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };
    
    // Update the account with mock tokens
    const { data: updateResult, error: updateError } = await supabase
      .from('email_accounts')
      .update({
        access_token: mockTokens.access_token,
        refresh_token: mockTokens.refresh_token,
        token_expires_at: mockTokens.token_expires_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', googleAccount.id)
      .select();
    
    if (updateError) {
      console.error('Error updating Google account:', updateError.message);
      return;
    }
    
    console.log('✅ Successfully updated Google account with OAuth tokens');
    console.log('Updated account:', updateResult[0]);
    
  } catch (error) {
    console.error('Error fixing Google OAuth tokens:', error);
  }
}

fixGoogleOAuthTokens(); 
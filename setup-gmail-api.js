const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupGmailAPI() {
  try {
    console.log('🔧 Gmail API Setup and Test');
    console.log('=' .repeat(50));
    
    // Check environment variables
    console.log('1. Checking environment variables...');
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    let missingVars = [];
    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      console.log('\n💡 Please add these to your .env.local file');
      return;
    }
    
    console.log('✅ All environment variables present');
    
    // Check database connection
    console.log('\n2. Checking database connection...');
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('provider_type', 'google')
      .eq('is_active', true);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('❌ No Gmail accounts found in database');
      console.log('💡 Please connect your Gmail account through the web interface first');
      return;
    }
    
    console.log(`✅ Found ${accounts.length} Gmail account(s)`);
    
    const account = accounts[0];
    console.log(`📧 Account: ${account.email}`);
    
    // Check token status
    console.log('\n3. Checking token status...');
    const now = new Date();
    const tokenExpiry = new Date(account.token_expires_at);
    const isExpired = tokenExpiry <= now;
    
    console.log(`   Token expires: ${tokenExpiry.toLocaleString()}`);
    console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
    
    let accessToken = account.access_token;
    
    // Refresh token if needed
    if (isExpired) {
      console.log('\n4. Refreshing expired token...');
      
      if (!account.refresh_token) {
        console.log('❌ No refresh token available');
        console.log('💡 You need to reconnect your Gmail account');
        return;
      }
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token',
        }),
      });
      
      if (!refreshResponse.ok) {
        console.log('❌ Token refresh failed:', refreshResponse.status, refreshResponse.statusText);
        const errorData = await refreshResponse.json();
        console.log('Error details:', errorData);
        return;
      }
      
      const tokenData = await refreshResponse.json();
      accessToken = tokenData.access_token;
      
      const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      
      // Update database
      const { error: updateError } = await supabase
        .from('email_accounts')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (updateError) {
        console.log('❌ Database update failed:', updateError.message);
        return;
      }
      
      console.log('✅ Token refreshed successfully');
      console.log(`   New expiry: ${newExpiresAt.toLocaleString()}`);
    }
    
    // Test Gmail API access
    console.log('\n5. Testing Gmail API access...');
    
    // Test 1: Get user profile
    console.log('   Testing user profile...');
    const profileResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log(`   ✅ Profile: ${profile.emailAddress}`);
      console.log(`   📊 Total messages: ${profile.messagesTotal}`);
    } else {
      console.log(`   ❌ Profile test failed: ${profileResponse.status} ${profileResponse.statusText}`);
      
      if (profileResponse.status === 403) {
        console.log('   💡 Gmail API might not be enabled in your Google Cloud project');
        console.log('   💡 Or insufficient scopes in your OAuth consent screen');
      }
    }
    
    // Test 2: List messages
    console.log('\n   Testing message listing...');
    const messagesResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=in:inbox',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (messagesResponse.ok) {
      const messagesData = await messagesResponse.json();
      console.log(`   ✅ Found ${messagesData.messages?.length || 0} messages`);
      
      if (messagesData.messages && messagesData.messages.length > 0) {
        // Test getting message details
        console.log('\n   Testing message details...');
        const messageId = messagesData.messages[0].id;
        
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (messageResponse.ok) {
          const messageData = await messageResponse.json();
          const headers = messageData.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
          
          console.log(`   ✅ Message details retrieved`);
          console.log(`      Subject: ${subject}`);
          console.log(`      From: ${from}`);
        } else {
          console.log(`   ❌ Message details failed: ${messageResponse.status} ${messageResponse.statusText}`);
        }
      }
    } else {
      console.log(`   ❌ Message listing failed: ${messagesResponse.status} ${messagesResponse.statusText}`);
    }
    
    console.log('\n' + '=' .repeat(50));
    
    if (profileResponse.ok && messagesResponse.ok) {
      console.log('🎉 Gmail API is working perfectly!');
      console.log('✅ Your Gmail emails should now load in the app');
    } else {
      console.log('❌ Gmail API has issues. Please check:');
      console.log('   1. Gmail API is enabled in Google Cloud Console');
      console.log('   2. OAuth consent screen has correct scopes');
      console.log('   3. Your Google Cloud project has proper permissions');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupGmailAPI(); 
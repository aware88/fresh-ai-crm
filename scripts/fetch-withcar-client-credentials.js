#!/usr/bin/env node

/**
 * Fetch Withcar Emails using Microsoft Client Credentials Flow
 * 
 * This script uses application permissions instead of user permissions,
 * which can bypass the admin consent requirement in some cases.
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TARGET_EMAIL = 'negozio@withcar.it';
const USER_EMAIL = 'tim.mak88@gmail.com';

console.log('🔐 Withcar Email Fetcher - Client Credentials Flow\n');

// Validate environment variables
if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
  console.error('❌ Missing Microsoft credentials in .env.local');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Initialize Supabase with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Get access token using client credentials flow
 */
async function getClientCredentialsToken() {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    }).toString();

    const options = {
      hostname: 'login.microsoftonline.com',
      path: '/common/oauth2/v2.0/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            console.log('✅ Successfully obtained client credentials token');
            resolve(response.access_token);
          } else {
            console.error('❌ Token response:', response);
            reject(new Error('Failed to get access token: ' + (response.error_description || response.error)));
          }
        } catch (e) {
          reject(new Error('Failed to parse token response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Make Microsoft Graph API request
 */
async function makeGraphRequest(accessToken, endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.microsoft.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${response.error?.message || data}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse API response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Find user by email
 */
async function findUser(email) {
  console.log(`🔍 Finding user: ${email}`);
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    throw new Error(`User not found: ${error.message}`);
  }

  console.log(`✅ Found user: ${users.email} (${users.id})`);
  return users;
}

/**
 * Find organization
 */
async function findOrganization(name) {
  console.log(`🔍 Finding organization: ${name}`);
  
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('*')
    .ilike('name', `%${name}%`)
    .single();

  if (error) {
    throw new Error(`Organization not found: ${error.message}`);
  }

  console.log(`✅ Found organization: ${orgs.name} (${orgs.id})`);
  return orgs;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Withcar email fetch with client credentials...\n');

    // Step 1: Get access token
    console.log('📡 Getting Microsoft Graph access token...');
    const accessToken = await getClientCredentialsToken();

    // Step 2: Test API access
    console.log('🧪 Testing Microsoft Graph API access...');
    try {
      // Try to get users (this requires admin permissions)
      const users = await makeGraphRequest(accessToken, '/v1.0/users?$top=5');
      console.log(`✅ API access working - found ${users.value?.length || 0} users`);
      
      // Look for our target user
      const targetUser = await makeGraphRequest(accessToken, `/v1.0/users/${TARGET_EMAIL}`);
      console.log(`✅ Found target user: ${targetUser.displayName} (${targetUser.mail})`);
      
    } catch (apiError) {
      console.error('❌ Microsoft Graph API Error:', apiError.message);
      console.log('\n💡 This error suggests the app needs admin consent or different permissions.');
      console.log('Please run: npm run withcar:admin-consent-solution');
      return;
    }

    // Step 3: Find database records
    const user = await findUser(USER_EMAIL);
    const organization = await findOrganization('Withcar');

    // Step 4: Fetch emails (if API access is working)
    console.log('📧 Attempting to fetch emails...');
    const messages = await makeGraphRequest(accessToken, `/v1.0/users/${TARGET_EMAIL}/messages?$top=10`);
    console.log(`✅ Found ${messages.value?.length || 0} messages`);

    if (messages.value && messages.value.length > 0) {
      console.log('\n📋 Sample messages:');
      messages.value.slice(0, 3).forEach((msg, i) => {
        console.log(`${i + 1}. ${msg.subject} (${msg.receivedDateTime})`);
      });
    }

    console.log('\n🎉 Client credentials flow is working!');
    console.log('Next step: Implement full email fetching and database storage.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Ensure the Azure app has Application permissions (not Delegated)');
    console.log('2. Grant admin consent in Azure Portal');
    console.log('3. Check that MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET are correct');
    console.log('4. Run: npm run withcar:admin-consent-solution');
  }
}

// Run the script
main().catch(console.error);
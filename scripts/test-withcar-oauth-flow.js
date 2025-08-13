#!/usr/bin/env node

/**
 * Test Withcar OAuth Flow - Step by step diagnosis
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 WITHCAR OAUTH FLOW DIAGNOSTICS');
console.log('═'.repeat(50));

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;

if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
  console.error('❌ Missing Microsoft credentials in .env.local');
  process.exit(1);
}

console.log('✅ Environment Variables:');
console.log(`   Client ID: ${MICROSOFT_CLIENT_ID}`);
console.log(`   Client Secret: ${MICROSOFT_CLIENT_SECRET.substring(0, 10)}...`);
console.log();

console.log('🎯 ISSUE ANALYSIS:');
console.log('   Error: AADSTS900561 - Endpoint only accepts POST requests, received GET');
console.log();

console.log('💡 POSSIBLE CAUSES:');
console.log('   1. Redirect URI mismatch in Azure app registration');
console.log('   2. Incorrect OAuth flow configuration');
console.log('   3. Missing redirect URI in Azure portal');
console.log();

console.log('🔧 AZURE APP REGISTRATION CHECK:');
console.log('   Go to: https://portal.azure.com');
console.log('   Navigate to: Azure Active Directory → App registrations');
console.log(`   Find app: ${MICROSOFT_CLIENT_ID}`);
console.log('   Check "Redirect URIs" section should have:');
console.log('   ✓ http://localhost:3000/api/auth/outlook/callback');
console.log('   ✓ Platform: Web');
console.log();

console.log('🧪 TEST URLs:');
console.log('─'.repeat(30));

// Construct the OAuth URL manually
const SCOPES = [
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'Calendars.Read',
  'Contacts.Read'
].join(' ');

const redirectUri = 'http://localhost:3000/api/auth/outlook/callback';
const state = Buffer.from(JSON.stringify({ userId: 'test-user-id' })).toString('base64');

const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID);
authUrl.searchParams.append('response_type', 'code');
authUrl.searchParams.append('redirect_uri', redirectUri);
authUrl.searchParams.append('scope', SCOPES);
authUrl.searchParams.append('response_mode', 'query');
authUrl.searchParams.append('state', state);

console.log('1. Manual OAuth URL:');
console.log(`   ${authUrl.toString()}`);
console.log();

console.log('2. CRM Connect URL:');
console.log('   http://localhost:3000/api/auth/outlook/connect');
console.log();

console.log('📋 STEP-BY-STEP FIX:');
console.log('─'.repeat(30));
console.log('1. Go to Azure Portal (https://portal.azure.com)');
console.log('2. Azure Active Directory → App registrations');
console.log(`3. Search for: ${MICROSOFT_CLIENT_ID}`);
console.log('4. Click on your app');
console.log('5. Go to "Authentication" in left sidebar');
console.log('6. Under "Redirect URIs", add:');
console.log('   Platform: Web');
console.log('   URI: http://localhost:3000/api/auth/outlook/callback');
console.log('7. Save the configuration');
console.log();

console.log('🧪 TEST WITH WITHCAR ACCOUNT:');
console.log('─'.repeat(30));
console.log('Account: zarfin.jakupovic@withcar.si');
console.log('Password: [provided separately]');
console.log();
console.log('Expected flow:');
console.log('1. Visit OAuth URL above');
console.log('2. Login with Withcar account');
console.log('3. Should redirect to callback (not show POST/GET error)');
console.log('4. If successful, will redirect to email settings');
console.log();

console.log('🚨 CURRENT ERROR EXPLANATION:');
console.log('─'.repeat(30));
console.log('AADSTS900561 means Microsoft received a GET request');
console.log('when it expected a POST. This usually happens when:');
console.log('- Redirect URI is not registered in Azure portal');
console.log('- There\'s a redirect loop');
console.log('- OAuth flow parameters are incorrect');
console.log();

console.log('✅ AFTER FIXING REDIRECT URI:');
console.log('   Try the CRM "Add Outlook Account" button again');
console.log('   It should work without the AADSTS900561 error');
console.log();

console.log('═'.repeat(50));


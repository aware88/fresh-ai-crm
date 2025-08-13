#!/usr/bin/env node

/**
 * Direct OAuth Test - Bypass our API and test Microsoft directly
 */

require('dotenv').config({ path: '.env.local' });

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;

if (!MICROSOFT_CLIENT_ID) {
  console.error('❌ Missing MICROSOFT_CLIENT_ID');
  process.exit(1);
}

console.log('🧪 DIRECT OAUTH TEST');
console.log('═'.repeat(50));
console.log();

console.log('🔍 Current Configuration:');
console.log(`   Client ID: ${MICROSOFT_CLIENT_ID}`);
console.log(`   Redirect URI: http://localhost:3000/api/auth/outlook/callback`);
console.log();

// Create a minimal OAuth URL to test
const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID);
authUrl.searchParams.append('response_type', 'code');
authUrl.searchParams.append('redirect_uri', 'http://localhost:3000/api/auth/outlook/callback');
authUrl.searchParams.append('scope', 'User.Read Mail.Read offline_access');
authUrl.searchParams.append('response_mode', 'query');
authUrl.searchParams.append('state', 'test123');

console.log('🚀 TEST THIS URL DIRECTLY:');
console.log('─'.repeat(30));
console.log(authUrl.toString());
console.log();

console.log('📋 INSTRUCTIONS:');
console.log('1. Copy the URL above');
console.log('2. Paste it in a new browser tab');
console.log('3. Login with: zarfin.jakupovic@withcar.si');
console.log('4. If you get AADSTS900561 error, the problem is in Azure configuration');
console.log('5. If it works, the problem is in our CRM code');
console.log();

console.log('✅ EXPECTED RESULT (if working):');
console.log('   - Microsoft login page appears');
console.log('   - After login, redirects to: http://localhost:3000/api/auth/outlook/callback?code=...');
console.log('   - You might see an error there (expected, since server needs session)');
console.log('   - But NO AADSTS900561 error');
console.log();

console.log('❌ IF YOU STILL GET AADSTS900561:');
console.log('   The issue is likely:');
console.log('   1. Redirect URI case sensitivity (http vs https)');
console.log('   2. Trailing slash in redirect URI');
console.log('   3. Azure app registration cache/propagation delay');
console.log();

console.log('🔧 TRY THESE AZURE FIXES:');
console.log('1. In Azure portal, go to your app → Authentication');
console.log('2. Delete the current redirect URI');
console.log('3. Add it again: http://localhost:3000/api/auth/outlook/callback');
console.log('4. Make sure Platform Type is "Web" (not SPA)');
console.log('5. Save and wait 5 minutes for propagation');
console.log();

console.log('═'.repeat(50));


#!/usr/bin/env node

/**
 * Withcar Microsoft Admin Consent Solution
 * 
 * This script provides multiple solutions for the Microsoft admin consent issue
 * when connecting the negozio@withcar.it email account.
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔐 Withcar Microsoft Admin Consent Solutions\n');

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;

if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
  console.error('❌ Missing Microsoft credentials in .env.local');
  console.log('Please ensure you have:');
  console.log('- MICROSOFT_CLIENT_ID');
  console.log('- MICROSOFT_CLIENT_SECRET');
  process.exit(1);
}

console.log('✅ Microsoft credentials found');
console.log(`📧 Target email: negozio@withcar.it`);
console.log(`🆔 Client ID: ${MICROSOFT_CLIENT_ID}`);
console.log('');

console.log('🎯 SOLUTION OPTIONS:\n');

console.log('📋 OPTION 1: Admin Consent URL (Recommended)');
console.log('═══════════════════════════════════════════');
console.log('Ask the Withcar IT administrator to visit this URL to grant admin consent:');
console.log('');
const adminConsentUrl = `https://login.microsoftonline.com/common/adminconsent?client_id=${MICROSOFT_CLIENT_ID}&redirect_uri=http://localhost:3000/api/auth/outlook/callback&scope=https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read&state=admin_consent`;
console.log(`🔗 ${adminConsentUrl}`);
console.log('');
console.log('After admin consent, the regular OAuth flow should work.');
console.log('');

console.log('📋 OPTION 2: Application Permissions (Technical)');
console.log('════════════════════════════════════════════════');
console.log('1. Go to Azure Portal → App Registrations → Your App');
console.log('2. Go to "API permissions"');
console.log('3. Remove all "Delegated permissions"');
console.log('4. Add "Application permissions":');
console.log('   - Mail.Read (Application)');
console.log('   - Mail.Send (Application)');
console.log('   - User.Read.All (Application)');
console.log('5. Click "Grant admin consent" button');
console.log('6. Use client credentials flow instead of OAuth');
console.log('');

console.log('📋 OPTION 3: IMAP with App Password (Fallback)');
console.log('═══════════════════════════════════════════════');
console.log('1. Ask Withcar admin to enable "IMAP access" in Exchange Admin');
console.log('2. Create an "App Password" for negozio@withcar.it');
console.log('3. Use IMAP connection with app password instead of OAuth');
console.log('');

console.log('📋 OPTION 4: Tenant-Specific Registration');
console.log('═══════════════════════════════════════════');
console.log('1. Find Withcar\'s Microsoft tenant ID');
console.log('2. Register the app specifically in their tenant');
console.log('3. Use tenant-specific endpoints');
console.log('');

console.log('🚀 RECOMMENDED NEXT STEPS:');
console.log('1. Share the Admin Consent URL (Option 1) with Withcar IT');
console.log('2. If that fails, try Option 2 (Application Permissions)');
console.log('3. If Microsoft Graph fails entirely, fall back to Option 3 (IMAP)');
console.log('');

console.log('💡 TESTING:');
console.log('After admin consent, test the connection with:');
console.log('npm run connect:withcar-microsoft');
console.log('');

// Test if we can determine the tenant
console.log('🔍 TENANT DISCOVERY:');
console.log('Attempting to discover Withcar tenant...');

const https = require('https');
const tenantDiscoveryUrl = 'https://login.microsoftonline.com/withcar.it/.well-known/openid_configuration';

https.get(tenantDiscoveryUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const config = JSON.parse(data);
      if (config.issuer) {
        const tenantId = config.issuer.split('/')[3];
        console.log(`✅ Found Withcar tenant ID: ${tenantId}`);
        console.log(`🔗 Tenant-specific admin consent URL:`);
        const tenantAdminUrl = `https://login.microsoftonline.com/${tenantId}/adminconsent?client_id=${MICROSOFT_CLIENT_ID}&redirect_uri=http://localhost:3000/api/auth/outlook/callback&scope=https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read`;
        console.log(`   ${tenantAdminUrl}`);
      }
    } catch (e) {
      console.log('❌ Could not parse tenant discovery response');
    }
  });
}).on('error', (err) => {
  console.log('❌ Could not discover tenant (this is normal)');
});

setTimeout(() => {
  console.log('\n🎯 SUMMARY:');
  console.log('The "Need admin approval" error is expected for corporate Microsoft accounts.');
  console.log('Choose the solution that works best with Withcar\'s IT policies.');
  console.log('Most likely, Option 1 (Admin Consent URL) will resolve the issue.');
}, 2000);
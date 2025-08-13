#!/usr/bin/env node

/**
 * Detailed Admin Guide for Withcar Microsoft Email Integration
 * 
 * This provides step-by-step instructions for the Withcar IT administrator
 * to enable Microsoft Graph API access for the CRM application.
 */

require('dotenv').config({ path: '.env.local' });

console.log('📧 WITHCAR MICROSOFT EMAIL INTEGRATION - ADMIN GUIDE');
console.log('═'.repeat(70));
console.log();

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;

if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
  console.error('❌ Missing Microsoft credentials. Please ensure .env.local has:');
  console.log('   MICROSOFT_CLIENT_ID=your-client-id');
  console.log('   MICROSOFT_CLIENT_SECRET=your-client-secret');
  process.exit(1);
}

console.log('✅ Microsoft App Configuration:');
console.log(`   Client ID: ${MICROSOFT_CLIENT_ID}`);
console.log(`   Target Email: negozio@withcar.it`);
console.log();

console.log('🎯 PROBLEM:');
console.log('   When trying to connect negozio@withcar.it to the CRM system,');
console.log('   Microsoft shows "Need admin approval" error.');
console.log();

console.log('💡 SOLUTION OPTIONS FOR WITHCAR IT ADMIN:');
console.log('═'.repeat(50));
console.log();

console.log('📋 OPTION 1: Grant Admin Consent (RECOMMENDED - 5 minutes)');
console.log('─'.repeat(60));
console.log('1. Ask your IT administrator to visit this URL:');
console.log();
const adminConsentUrl = `https://login.microsoftonline.com/common/adminconsent?client_id=${MICROSOFT_CLIENT_ID}&redirect_uri=http://localhost:3000/api/auth/outlook/callback&scope=https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read&state=admin_consent`;
console.log(`🔗 ${adminConsentUrl}`);
console.log();
console.log('2. Login with Withcar admin credentials');
console.log('3. Review and accept the permissions:');
console.log('   - Read user mail');
console.log('   - Send mail as user');
console.log('   - Read user profile');
console.log('4. Click "Accept"');
console.log();
console.log('✅ After this, the regular OAuth flow will work for all Withcar users.');
console.log();

console.log('📋 OPTION 2: Azure Portal Admin Consent (Alternative)');
console.log('─'.repeat(60));
console.log('1. Go to Azure Portal (https://portal.azure.com)');
console.log('2. Navigate to "Azure Active Directory" → "Enterprise applications"');
console.log(`3. Search for app ID: ${MICROSOFT_CLIENT_ID}`);
console.log('4. Click on the application');
console.log('5. Go to "Permissions"');
console.log('6. Click "Grant admin consent for [Organization]"');
console.log('7. Confirm the consent');
console.log();

console.log('📋 OPTION 3: Conditional Access Policy Adjustment');
console.log('─'.repeat(60));
console.log('If you get "Access blocked by Conditional Access" error:');
console.log();
console.log('1. Go to Azure Portal → "Azure Active Directory"');
console.log('2. Navigate to "Security" → "Conditional Access"');
console.log('3. Find policies that might block the application');
console.log('4. Either:');
console.log('   a) Add the CRM application to trusted apps, OR');
console.log('   b) Create an exception for negozio@withcar.it user, OR');
console.log('   c) Temporarily disable relevant policies for testing');
console.log();

console.log('📋 OPTION 4: IMAP Fallback (If Microsoft Graph fails)');
console.log('─'.repeat(60));
console.log('1. Enable IMAP access in Exchange Admin Center:');
console.log('   - Go to Exchange Admin Center');
console.log('   - Navigate to "Recipients" → "Mailboxes"');
console.log('   - Find negozio@withcar.it');
console.log('   - Edit → "Email Apps" → Enable IMAP');
console.log();
console.log('2. Create App Password:');
console.log('   - Go to Microsoft 365 Security → "Sign-in & security"');
console.log('   - Create App Password for negozio@withcar.it');
console.log('   - Use this password instead of regular password');
console.log();

console.log('🔧 TECHNICAL DETAILS FOR IT ADMIN:');
console.log('─'.repeat(60));
console.log('Application Details:');
console.log(`   Name: CRM Email Integration`);
console.log(`   Client ID: ${MICROSOFT_CLIENT_ID}`);
console.log(`   Permissions Requested:`);
console.log(`     - Mail.Read (Delegated): Read user mail`);
console.log(`     - Mail.Send (Delegated): Send mail as user`);
console.log(`     - User.Read (Delegated): Read user profile`);
console.log(`   Redirect URI: http://localhost:3000/api/auth/outlook/callback`);
console.log();
console.log('Security Notes:');
console.log('   - Application uses OAuth 2.0 with PKCE');
console.log('   - No passwords are stored');
console.log('   - Access tokens are encrypted and stored securely');
console.log('   - Application only accesses negozio@withcar.it mailbox');
console.log();

console.log('🧪 TESTING AFTER ADMIN CONSENT:');
console.log('─'.repeat(60));
console.log('1. User goes to CRM → Settings → Email Accounts');
console.log('2. Clicks "Add Outlook Account"');
console.log('3. Logs in with negozio@withcar.it credentials');
console.log('4. Should see successful connection (no admin approval needed)');
console.log();

console.log('📞 SUPPORT CONTACT:');
console.log('─'.repeat(60));
console.log('If you need assistance with any of these steps:');
console.log('   - Contact: CRM Support Team');
console.log('   - Include: Error messages and screenshots');
console.log('   - Reference: Withcar Email Integration Setup');
console.log();

console.log('⏱️  ESTIMATED TIME:');
console.log('   Option 1 (Admin Consent URL): 5 minutes');
console.log('   Option 2 (Azure Portal): 10 minutes');
console.log('   Option 3 (Conditional Access): 15-30 minutes');
console.log('   Option 4 (IMAP Fallback): 20 minutes');
console.log();

console.log('🎉 EXPECTED OUTCOME:');
console.log('   After admin consent, negozio@withcar.it can connect to CRM');
console.log('   system and automatically sync 100 sent + 100 received emails');
console.log('   for analysis and AI training purposes.');
console.log();

console.log('═'.repeat(70));
console.log('END OF ADMIN GUIDE');
console.log('═'.repeat(70));
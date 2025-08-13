#!/usr/bin/env node

/**
 * Complete Instructions for Withcar IT Admin
 * To enable email integration with CRM system
 */

console.log('📧 WITHCAR IT ADMIN - EMAIL INTEGRATION SETUP');
console.log('═'.repeat(70));
console.log();

console.log('🎯 REQUEST: Enable CRM Email Integration');
console.log('─'.repeat(40));
console.log('We need to integrate negozio@withcar.it with our CRM system');
console.log('to analyze email patterns and improve customer service.');
console.log();

console.log('🔐 SECURITY NOTE:');
console.log('This is a secure integration that only reads emails.');
console.log('No passwords are stored, and access can be revoked anytime.');
console.log();

console.log('💡 OPTION 1: Enable App Passwords (RECOMMENDED - 5 minutes)');
console.log('═'.repeat(60));
console.log();
console.log('📋 Steps for Withcar IT Admin:');
console.log('1. Go to Microsoft 365 Admin Center: https://admin.microsoft.com');
console.log('2. Login with your admin credentials');
console.log('3. Navigate to: Settings → Org settings → Security & privacy');
console.log('4. Click "Multi-factor authentication"');
console.log('5. Click "Additional cloud-based MFA settings"');
console.log('6. Go to "App passwords" tab');
console.log('7. Check "Allow users to create app passwords to sign in to non-browser apps"');
console.log('8. Click "Save"');
console.log();
console.log('🔄 Alternative path if above doesn\'t work:');
console.log('1. Go to Azure Portal: https://portal.azure.com');
console.log('2. Navigate to: Azure Active Directory → Users');
console.log('3. Find: negozio@withcar.it');
console.log('4. Click on the user → Authentication methods');
console.log('5. Enable "App passwords" for this specific user');
console.log();

console.log('💡 OPTION 2: Enable Basic Auth for IMAP (Alternative - 10 minutes)');
console.log('═'.repeat(65));
console.log();
console.log('📋 Steps for Withcar IT Admin:');
console.log('1. Go to Exchange Admin Center: https://admin.exchange.microsoft.com');
console.log('2. Navigate to: Mail flow → Authentication policies');
console.log('3. Click "Create" to create new policy');
console.log('4. Name: "CRM IMAP Access"');
console.log('5. Enable: "Basic authentication for IMAP"');
console.log('6. Apply to: negozio@withcar.it');
console.log('7. Save the policy');
console.log();

console.log('💡 OPTION 3: OAuth Admin Consent (Most Secure - 5 minutes)');
console.log('═'.repeat(60));
console.log();
console.log('📋 Steps for Withcar IT Admin:');
console.log('1. Visit this admin consent URL:');
console.log();
console.log('🔗 https://login.microsoftonline.com/common/adminconsent?client_id=2095c06d-db3a-4451-9d58-5f589a38f77f&redirect_uri=http://localhost:3000/api/auth/outlook/callback&scope=https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read&state=admin_consent');
console.log();
console.log('2. Login with Withcar admin credentials');
console.log('3. Review the permissions:');
console.log('   - Read user mail');
console.log('   - Send mail as user');
console.log('   - Read user profile');
console.log('4. Click "Accept"');
console.log();

console.log('🧪 TESTING AFTER SETUP:');
console.log('─'.repeat(25));
console.log();
console.log('After completing ANY of the above options:');
console.log('1. We will test the email connection');
console.log('2. Fetch 100 recent sent + received emails');
console.log('3. Store them securely in our CRM database');
console.log('4. Use them for AI analysis and customer service improvement');
console.log();

console.log('⏱️ TIME ESTIMATES:');
console.log('─'.repeat(20));
console.log('Option 1 (App Passwords): 5 minutes');
console.log('Option 2 (Basic Auth): 10 minutes');
console.log('Option 3 (OAuth Consent): 5 minutes');
console.log();

console.log('🔒 SECURITY BENEFITS:');
console.log('─'.repeat(25));
console.log('✅ No permanent password storage');
console.log('✅ Access can be revoked anytime');
console.log('✅ Read-only access to emails');
console.log('✅ Encrypted data transmission');
console.log('✅ Audit trail of all access');
console.log();

console.log('📞 CONTACT INFO:');
console.log('─'.repeat(15));
console.log('If you need assistance with any of these steps:');
console.log('- Include screenshots of any errors');
console.log('- Mention which option you tried');
console.log('- We can schedule a quick call to walk through it');
console.log();

console.log('🎯 EXPECTED OUTCOME:');
console.log('─'.repeat(20));
console.log('After setup, negozio@withcar.it emails will be');
console.log('automatically synced to our CRM for analysis.');
console.log('This will help us understand Withcar\'s communication');
console.log('patterns and improve our service quality.');
console.log();

console.log('═'.repeat(70));
console.log('Thank you for enabling this integration!');
console.log('═'.repeat(70));


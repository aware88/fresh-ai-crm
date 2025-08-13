#!/usr/bin/env node

/**
 * Withcar App Password Setup Guide
 * Microsoft 365 requires App Passwords for IMAP access when MFA is enabled
 */

console.log('🔐 WITHCAR APP PASSWORD SETUP GUIDE');
console.log('═'.repeat(60));
console.log();

console.log('🎯 PROBLEM:');
console.log('   Microsoft has disabled basic authentication for negozio@withcar.it');
console.log('   IMAP login fails with "AUTHENTICATE failed"');
console.log();

console.log('💡 SOLUTION: Create App Password');
console.log('═'.repeat(40));
console.log();

console.log('📋 STEP-BY-STEP INSTRUCTIONS:');
console.log('─'.repeat(35));
console.log();

console.log('1. 🌐 Go to Microsoft 365 Security Dashboard:');
console.log('   https://mysignins.microsoft.com/security-info');
console.log();

console.log('2. 🔑 Login with Withcar credentials:');
console.log('   Email: negozio@withcar.it');
console.log('   Password: Sux94451');
console.log();

console.log('3. 📱 If prompted for MFA (Multi-Factor Authentication):');
console.log('   - Use the registered phone number or authenticator app');
console.log('   - Complete the verification process');
console.log();

console.log('4. ➕ Add App Password:');
console.log('   - Click "Add sign-in method"');
console.log('   - Select "App password"');
console.log('   - Click "Add"');
console.log();

console.log('5. 🏷️ Create App Password:');
console.log('   - Name: "CRM Email Integration"');
console.log('   - Click "Next"');
console.log('   - COPY THE GENERATED PASSWORD (16 characters)');
console.log('   - Click "Done"');
console.log();

console.log('6. 🔄 Update Our Script:');
console.log('   - Replace "Sux94451" with the new app password');
console.log('   - Run the email fetcher again');
console.log();

console.log('🚨 ALTERNATIVE: Admin Must Enable App Passwords');
console.log('─'.repeat(50));
console.log();
console.log('If App Passwords are disabled by organization policy:');
console.log();
console.log('1. 👨‍💼 Ask Withcar IT Admin to:');
console.log('   - Go to Microsoft 365 Admin Center');
console.log('   - Navigate to "Security" → "Authentication methods"');
console.log('   - Enable "App passwords" for the organization');
console.log('   - OR enable it specifically for negozio@withcar.it');
console.log();

console.log('2. 🔧 Alternative: Enable Basic Auth for IMAP');
console.log('   - Go to Exchange Admin Center');
console.log('   - Navigate to "Mail flow" → "Authentication policies"');
console.log('   - Create policy allowing basic auth for IMAP');
console.log('   - Apply to negozio@withcar.it mailbox');
console.log();

console.log('📞 QUICK TEST AFTER SETUP:');
console.log('─'.repeat(30));
console.log();
console.log('1. Get the app password from step 5 above');
console.log('2. Update the script with the new password');
console.log('3. Run: npm run fetch:withcar-production');
console.log('4. Should connect successfully and fetch emails');
console.log();

console.log('🎯 EXPECTED RESULT:');
console.log('   ✅ IMAP connection established');
console.log('   ✅ 100 received emails fetched');
console.log('   ✅ 100 sent emails fetched');
console.log('   ✅ All emails saved to database');
console.log();

console.log('❓ IF APP PASSWORDS ARE NOT AVAILABLE:');
console.log('─'.repeat(45));
console.log();
console.log('This means Withcar has very strict security policies.');
console.log('In this case, we need to:');
console.log();
console.log('1. 🔐 Complete the OAuth admin consent process');
console.log('2. 🌐 Use Microsoft Graph API instead of IMAP');
console.log('3. 📧 Or export emails manually from Outlook');
console.log();

console.log('═'.repeat(60));
console.log('💬 Let me know which option works for you!');
console.log('═'.repeat(60));


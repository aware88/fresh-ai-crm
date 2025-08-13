#!/usr/bin/env node

/**
 * Guide to Create New Azure App Registration
 * This will replace the current one and work for all customers
 */

console.log('🚀 CREATE NEW AZURE APP REGISTRATION');
console.log('═'.repeat(50));
console.log();

console.log('📋 STEP-BY-STEP GUIDE:');
console.log('─'.repeat(30));
console.log('1. Go to: https://portal.azure.com');
console.log('2. Login with YOUR account (tim.mak88@gmail.com)');
console.log('3. Navigate to: Azure Active Directory → App registrations');
console.log('4. Click "New registration"');
console.log();

console.log('5. Fill in the form:');
console.log('   Name: "CRM Email Integration"');
console.log('   Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"');
console.log('   Redirect URI: ');
console.log('     Platform: Web');
console.log('     URL: http://localhost:3000/api/auth/outlook/callback');
console.log('   Click "Register"');
console.log();

console.log('6. After creation, note down:');
console.log('   - Application (client) ID');
console.log('   - Directory (tenant) ID');
console.log();

console.log('7. Go to "Certificates & secrets":');
console.log('   - Click "New client secret"');
console.log('   - Description: "CRM Integration Secret"');
console.log('   - Expires: 24 months');
console.log('   - Click "Add"');
console.log('   - COPY THE SECRET VALUE (not the ID!)');
console.log();

console.log('8. Go to "API permissions":');
console.log('   - Click "Add a permission"');
console.log('   - Microsoft Graph → Delegated permissions');
console.log('   - Select:');
console.log('     ✓ User.Read');
console.log('     ✓ Mail.Read');
console.log('     ✓ Mail.ReadWrite');
console.log('     ✓ Mail.Send');
console.log('     ✓ Calendars.Read');
console.log('     ✓ Contacts.Read');
console.log('     ✓ offline_access');
console.log('   - Click "Add permissions"');
console.log();

console.log('9. Update .env.local with new values:');
console.log('   MICROSOFT_CLIENT_ID=your-new-client-id');
console.log('   MICROSOFT_CLIENT_SECRET=your-new-secret-value');
console.log();

console.log('10. Restart your Next.js server');
console.log();

console.log('✅ RESULT:');
console.log('   - Any customer can connect their Outlook/Microsoft 365 email');
console.log('   - No Azure configuration needed on customer side');
console.log('   - Works for all organizations (Withcar, others)');
console.log();

console.log('🧪 TEST:');
console.log('   1. Go to CRM → Settings → Email Accounts');
console.log('   2. Click "Add Outlook Account"');
console.log('   3. Login with zarfin.jakupovic@withcar.si');
console.log('   4. Should work without AADSTS900561 error');
console.log();

console.log('═'.repeat(50));


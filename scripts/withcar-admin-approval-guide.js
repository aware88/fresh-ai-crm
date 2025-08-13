#!/usr/bin/env node

/**
 * Withcar Admin Approval Guide
 * 
 * This script provides solutions for the admin approval issue with negozio@withcar.it
 */

console.log('🔐 Withcar Microsoft Admin Approval Solutions');
console.log('=' .repeat(60));
console.log('📧 Email: negozio@withcar.it');
console.log('🏢 Organization: withcar.it');
console.log('❌ Issue: Admin approval required');
console.log('=' .repeat(60));

console.log('\n🎯 SOLUTIONS (in order of preference):');
console.log('=' .repeat(60));

console.log('\n1️⃣ SOLUTION 1: Grant Admin Consent (Recommended)');
console.log('   - Login to Azure Portal as admin of withcar.it');
console.log('   - Go to: Azure Active Directory > App registrations');
console.log('   - Find your app: "CRM Mind - Withcar Integration"');
console.log('   - Go to: API permissions');
console.log('   - Click: "Grant admin consent for [organization]"');
console.log('   - This will allow all users in withcar.it to use the app');

console.log('\n2️⃣ SOLUTION 2: Use Personal Microsoft Account');
console.log('   - Create a personal Microsoft account for negozio@withcar.it');
console.log('   - Add the email as an alias to a personal account');
console.log('   - This bypasses organizational restrictions');

console.log('\n3️⃣ SOLUTION 3: Alternative Authentication Method');
console.log('   - Use IMAP with app-specific password');
console.log('   - Enable 2FA on negozio@withcar.it');
console.log('   - Generate app password for CRM access');

console.log('\n4️⃣ SOLUTION 4: Direct Database Setup (Quick Fix)');
console.log('   - Manually add the account to database');
console.log('   - Use existing tokens if available');
console.log('   - Test with Microsoft Graph API directly');

console.log('\n🚀 QUICK FIX - Try this first:');
console.log('=' .repeat(60));
console.log('1. Login to Azure Portal as withcar.it admin');
console.log('2. Navigate to: Azure Active Directory > App registrations');
console.log('3. Find your app and click "API permissions"');
console.log('4. Click "Grant admin consent for [organization]"');
console.log('5. Try the OAuth flow again');

console.log('\n💡 If admin consent is granted, run:');
console.log('   npm run connect:withcar-microsoft');
console.log('   npm run fetch:withcar-graph');

console.log('\n🔧 Alternative: Use the existing IMAP approach');
console.log('   npm run fetch:withcar-simple');
console.log('   (This uses the existing IMAP setup)');

console.log('\n📞 Need help? Check the Azure admin portal or contact withcar.it IT team');
console.log('🔗 Azure Portal: https://portal.azure.com'); 
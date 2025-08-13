#!/usr/bin/env node

/**
 * Test Withcar Credentials Script
 * 
 * This script tests the Withcar email credentials and provides
 * specific guidance for fixing authentication issues.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { ImapFlow } = require('imapflow');
const { Client } = require('@microsoft/microsoft-graph-client');

class WithcarCredentialTester {
  constructor() {
    this.withcarEmail = 'negozio@withcar.it';
    this.withcarPassword = 'Sux94451';
  }

  async testImapConnection() {
    console.log('🔌 Testing IMAP connection...');
    
    const configs = [
      {
        name: 'Outlook Office 365 (SSL)',
        host: 'outlook.office365.com',
        port: 993,
        secure: true
      },
      {
        name: 'Outlook Office 365 (STARTTLS)',
        host: 'outlook.office365.com',
        port: 143,
        secure: false,
        autotls: 'required'
      },
      {
        name: 'IMAP Mail Outlook (SSL)',
        host: 'imap-mail.outlook.com',
        port: 993,
        secure: true
      },
      {
        name: 'IMAP Mail Outlook (STARTTLS)',
        host: 'imap-mail.outlook.com',
        port: 143,
        secure: false,
        autotls: 'required'
      }
    ];

    for (const config of configs) {
      console.log(`\n🔄 Testing: ${config.name}`);
      try {
        const client = new ImapFlow({
          ...config,
          auth: {
            user: this.withcarEmail,
            pass: this.withcarPassword
          },
          logger: false
        });
        
        await client.connect();
        console.log(`✅ SUCCESS: ${config.name}`);
        await client.logout();
        return { success: true, config };
      } catch (error) {
        console.log(`❌ FAILED: ${config.name} - ${error.message}`);
      }
    }
    
    return { success: false };
  }

  async testMicrosoftGraph() {
    console.log('\n🔑 Testing Microsoft Graph API...');
    
    try {
      // Test client credentials flow
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID || '',
          client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        console.log('✅ SUCCESS: Microsoft Graph API token obtained');
        return { success: true, token: tokenData.access_token };
      } else {
        const errorData = await tokenResponse.text();
        console.log(`❌ FAILED: Microsoft Graph API - ${errorData}`);
        return { success: false, error: errorData };
      }
    } catch (error) {
      console.log(`❌ FAILED: Microsoft Graph API - ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async run() {
    console.log('🔍 Withcar Credential Testing');
    console.log('=' .repeat(60));
    console.log('📧 Email: negozio@withcar.it');
    console.log('🔐 Testing all authentication methods');
    console.log('=' .repeat(60));

    // Test IMAP
    const imapResult = await this.testImapConnection();
    
    // Test Microsoft Graph
    const graphResult = await this.testMicrosoftGraph();

    // Provide guidance
    console.log('\n📋 DIAGNOSIS & SOLUTIONS');
    console.log('=' .repeat(60));

    if (imapResult.success) {
      console.log('✅ IMAP is working!');
      console.log('💡 Use the IMAP approach for email fetching');
    } else {
      console.log('❌ IMAP is not working');
      console.log('💡 This indicates:');
      console.log('   - Modern authentication is enabled');
      console.log('   - Basic IMAP auth is disabled');
      console.log('   - Need app-specific password or OAuth');
    }

    if (graphResult.success) {
      console.log('✅ Microsoft Graph API is working!');
      console.log('💡 Use the Microsoft Graph approach');
    } else {
      console.log('❌ Microsoft Graph API is not working');
      console.log('💡 This indicates:');
      console.log('   - Client secret is invalid/expired');
      console.log('   - Admin consent not granted');
      console.log('   - App registration needs updating');
    }

    console.log('\n🎯 RECOMMENDED ACTIONS:');
    console.log('=' .repeat(60));

    if (!imapResult.success && !graphResult.success) {
      console.log('1️⃣ IMMEDIATE: Fix Microsoft App Registration');
      console.log('   - Go to: https://portal.azure.com');
      console.log('   - Navigate to: App registrations');
      console.log('   - Find your app and go to: Certificates & secrets');
      console.log('   - Delete old secret and create new one');
      console.log('   - Update .env.local with new secret');
      console.log('   - Grant admin consent for organization');
      
      console.log('\n2️⃣ ALTERNATIVE: Enable IMAP with App Password');
      console.log('   - Login to negozio@withcar.it');
      console.log('   - Enable 2-factor authentication');
      console.log('   - Generate app-specific password');
      console.log('   - Use app password instead of regular password');
      
      console.log('\n3️⃣ QUICK FIX: Use Personal Microsoft Account');
      console.log('   - Create personal Microsoft account');
      console.log('   - Add negozio@withcar.it as alias');
      console.log('   - This bypasses organizational restrictions');
    } else if (imapResult.success) {
      console.log('✅ Use IMAP approach: npm run fetch:withcar-imap-final');
    } else if (graphResult.success) {
      console.log('✅ Use Microsoft Graph approach: npm run fetch:withcar-graph');
    }

    console.log('\n🔧 Available Scripts:');
    console.log('   npm run fetch:withcar-imap-final     (IMAP approach)');
    console.log('   npm run fetch:withcar-graph          (Microsoft Graph)');
    console.log('   npm run connect:withcar-microsoft    (OAuth setup)');
    console.log('   npm run withcar:admin-guide          (Admin approval help)');
  }
}

// Run the script if called directly
if (require.main === module) {
  const tester = new WithcarCredentialTester();
  tester.run().catch(console.error);
}

module.exports = WithcarCredentialTester; 
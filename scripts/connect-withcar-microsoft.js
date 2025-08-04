#!/usr/bin/env node

/**
 * Connect Withcar Microsoft Account Script
 * 
 * This script helps set up the Withcar email account to use Microsoft Graph API
 * instead of IMAP authentication. It provides instructions and utilities.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

class WithcarMicrosoftConnector {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);
    
    // Withcar details
    this.withcarOrgId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    this.withcarEmail = 'negozio@withcar.it';
    this.userEmail = 'tim.mak88@gmail.com';
  }

  async checkMicrosoftConfig() {
    console.log('🔍 Checking Microsoft OAuth configuration...');
    
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    
    if (!clientId) {
      console.log('❌ MICROSOFT_CLIENT_ID not found in environment variables');
      return false;
    }
    
    if (!clientSecret) {
      console.log('❌ MICROSOFT_CLIENT_SECRET not found in environment variables');
      return false;
    }
    
    console.log('✅ Microsoft OAuth configuration found');
    console.log(`   Client ID: ${clientId.substring(0, 8)}...`);
    return true;
  }

  async findUser() {
    console.log(`🔍 Looking for user: ${this.userEmail}...`);
    
    const { data: users, error } = await this.supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return null;
    }
    
    const user = users.users.find(u => u.email === this.userEmail);
    
    if (user) {
      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
      return user;
    } else {
      console.log(`❌ User ${this.userEmail} not found`);
      return null;
    }
  }

  async checkExistingAccounts() {
    console.log('🔍 Checking existing email accounts...');
    
    const { data: accounts, error } = await this.supabase
      .from('email_accounts')
      .select('*')
      .eq('email', this.withcarEmail);
    
    if (error) {
      console.error('❌ Error checking accounts:', error);
      return [];
    }
    
    if (accounts && accounts.length > 0) {
      console.log(`📧 Found ${accounts.length} existing account(s) for ${this.withcarEmail}:`);
      accounts.forEach(account => {
        console.log(`   - Provider: ${account.provider_type}, Active: ${account.is_active}`);
        console.log(`   - Has OAuth tokens: ${account.access_token ? 'Yes' : 'No'}`);
      });
      return accounts;
    } else {
      console.log('📭 No existing accounts found');
      return [];
    }
  }

  async removeOldImapAccount() {
    console.log('🗑️  Removing old IMAP account...');
    
    const { error } = await this.supabase
      .from('email_accounts')
      .delete()
      .eq('email', this.withcarEmail)
      .eq('provider_type', 'imap');
    
    if (error) {
      console.error('❌ Error removing IMAP account:', error);
      return false;
    }
    
    console.log('✅ Old IMAP account removed');
    return true;
  }

  generateOAuthUrl() {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const connectUrl = `${baseUrl}/api/auth/outlook/connect`;
    
    console.log('\n🔗 Microsoft OAuth Connection URL:');
    console.log('=' .repeat(60));
    console.log(connectUrl);
    console.log('=' .repeat(60));
    
    return connectUrl;
  }

  async run() {
    console.log('🚀 Starting Withcar Microsoft Account Connection...');
    console.log('=' .repeat(60));
    console.log('📧 Email: negozio@withcar.it');
    console.log('👤 User: tim.mak88@gmail.com');
    console.log('🔐 Method: Microsoft Graph API (OAuth2)');
    console.log('=' .repeat(60));

    try {
      // Step 1: Check Microsoft OAuth configuration
      const configOk = await this.checkMicrosoftConfig();
      if (!configOk) {
        console.log('\n❌ Microsoft OAuth is not configured');
        console.log('💡 Please add the following to your .env.local file:');
        console.log('   MICROSOFT_CLIENT_ID=your_client_id');
        console.log('   MICROSOFT_CLIENT_SECRET=your_client_secret');
        console.log('\n📖 See: docs/email-account-setup-guide.md for setup instructions');
        process.exit(1);
      }

      // Step 2: Find user
      const user = await this.findUser();
      if (!user) {
        console.error('❌ User not found');
        process.exit(1);
      }

      // Step 3: Check existing accounts
      const existingAccounts = await this.checkExistingAccounts();

      // Step 4: Remove old IMAP account if exists
      const imapAccount = existingAccounts.find(acc => acc.provider_type === 'imap');
      if (imapAccount) {
        await this.removeOldImapAccount();
      }

      // Step 5: Check if Microsoft account already exists
      const microsoftAccount = existingAccounts.find(acc => acc.provider_type === 'microsoft');
      if (microsoftAccount) {
        console.log('✅ Microsoft account already exists!');
        
        if (microsoftAccount.access_token) {
          console.log('🎉 Account is ready to use with Microsoft Graph API');
          console.log('\n💡 You can now run: npm run fetch:withcar-graph');
          return;
        } else {
          console.log('⚠️  Account exists but missing OAuth tokens');
          console.log('   Need to re-authenticate via OAuth flow');
        }
      }

      // Step 6: Provide OAuth connection instructions
      console.log('\n📋 Next Steps to Connect Withcar Microsoft Account:');
      console.log('=' .repeat(60));
      console.log('1. Make sure your Next.js server is running (npm run dev)');
      console.log('2. Login as tim.mak88@gmail.com in your browser');
      console.log('3. Visit the OAuth connection URL below:');
      
      const oauthUrl = this.generateOAuthUrl();
      
      console.log('\n4. You will be redirected to Microsoft login');
      console.log('5. Login with negozio@withcar.it credentials');
      console.log('6. Grant permissions to the CRM application');
      console.log('7. You will be redirected back with success message');
      console.log('\n🔄 Alternative: Use the Email Settings page:');
      console.log('   - Go to Settings > Email Accounts');
      console.log('   - Click "Connect with Microsoft"');
      console.log('   - Login with negozio@withcar.it');

      console.log('\n✅ After successful connection:');
      console.log('   - The account will be stored with OAuth tokens');
      console.log('   - You can fetch emails using Microsoft Graph API');
      console.log('   - Run: npm run fetch:withcar-graph');

    } catch (error) {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const connector = new WithcarMicrosoftConnector();
  connector.run().catch(console.error);
}

module.exports = WithcarMicrosoftConnector;
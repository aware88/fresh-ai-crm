#!/usr/bin/env node

/**
 * Fix WithCar Email Connection Script
 * 
 * This script resolves the issue with negozio@withcar.it email connection
 * by cleaning up existing entries and setting up proper Microsoft 365 
 * shared mailbox access through a licensed user account.
 * 
 * Based on IT team feedback:
 * - negozio@withcar.it already exists from previous attempts (causing 404)
 * - Shared mailboxes require access through licensed user accounts
 * - Need to use a licensed account first, then access shared mailbox
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class WithcarEmailFixer {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check your .env file.');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Email accounts
    this.negozioEmail = 'negozio@withcar.it';
    this.licensedUserEmail = 'zarfin.jakupovic@withcar.si'; // Licensed user from IT team
    this.withcarOrgId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad'; // Known WithCar org ID
  }

  async run() {
    console.log('🔧 WITHCAR EMAIL CONNECTION FIXER');
    console.log('═'.repeat(50));
    console.log();
    console.log('📋 Issue: negozio@withcar.it connection fails (404 error)');
    console.log('💡 Solution: Clean up existing entries and use licensed user approach');
    console.log();

    try {
      // Step 1: Analyze current state
      await this.analyzeCurrentState();
      
      // Step 2: Clean up existing problematic entries
      await this.cleanupExistingEntries();
      
      // Step 3: Show Microsoft 365 setup instructions
      await this.showMicrosoft365Instructions();
      
      // Step 4: Create proper email account entry (when licensed user is connected)
      await this.createProperEmailAccount();
      
      console.log('✅ WithCar email connection fix completed!');
      console.log();
      console.log('📝 Next Steps:');
      console.log('1. Follow the Microsoft 365 setup instructions above');
      console.log('2. Connect the licensed user account first');
      console.log('3. Then access the shared mailbox through the licensed account');
      console.log('4. Run: npm run fetch:withcar-production');
      
    } catch (error) {
      console.error('❌ Error fixing WithCar email connection:', error);
      process.exit(1);
    }
  }

  async analyzeCurrentState() {
    console.log('🔍 Step 1: Analyzing current state...');
    
    // Check for existing negozio@withcar.it entries
    const { data: negozioAccounts, error: negozioError } = await this.supabase
      .from('email_accounts')
      .select('*')
      .eq('email', this.negozioEmail);
    
    if (negozioError) {
      console.error('❌ Error checking negozio accounts:', negozioError);
    } else {
      console.log(`📧 Found ${negozioAccounts.length} existing entries for ${this.negozioEmail}`);
      if (negozioAccounts.length > 0) {
        negozioAccounts.forEach((account, index) => {
          console.log(`   ${index + 1}. Provider: ${account.provider_type}, Active: ${account.is_active}, Created: ${account.created_at}`);
          console.log(`      ID: ${account.id}`);
        });
      }
    }

    // Check for licensed user entries
    const { data: licensedAccounts, error: licensedError } = await this.supabase
      .from('email_accounts')
      .select('*')
      .eq('email', this.licensedUserEmail);
    
    if (licensedError) {
      console.error('❌ Error checking licensed user accounts:', licensedError);
    } else {
      console.log(`📧 Found ${licensedAccounts.length} existing entries for ${this.licensedUserEmail}`);
      if (licensedAccounts.length > 0) {
        licensedAccounts.forEach((account, index) => {
          console.log(`   ${index + 1}. Provider: ${account.provider_type}, Active: ${account.is_active}, OAuth: ${account.access_token ? 'Yes' : 'No'}`);
        });
      }
    }

    console.log();
  }

  async cleanupExistingEntries() {
    console.log('🧹 Step 2: Cleaning up problematic entries...');
    
    // Remove all existing negozio@withcar.it entries that are causing issues
    const { data: deletedAccounts, error: deleteError } = await this.supabase
      .from('email_accounts')
      .delete()
      .eq('email', this.negozioEmail)
      .select();
    
    if (deleteError) {
      console.error('❌ Error deleting accounts:', deleteError);
    } else {
      console.log(`🗑️  Removed ${deletedAccounts.length} problematic entries for ${this.negozioEmail}`);
      if (deletedAccounts.length > 0) {
        deletedAccounts.forEach((account, index) => {
          console.log(`   ${index + 1}. Removed: ${account.provider_type} account (ID: ${account.id})`);
        });
      }
    }

    console.log();
  }

  async showMicrosoft365Instructions() {
    console.log('📋 Step 3: Microsoft 365 Shared Mailbox Setup Instructions');
    console.log('─'.repeat(50));
    console.log();
    console.log('🎯 PROBLEM ANALYSIS:');
    console.log('   - negozio@withcar.it is a shared mailbox');
    console.log('   - Shared mailboxes cannot be accessed directly');
    console.log('   - Access requires a licensed Microsoft 365 user');
    console.log();
    console.log('💡 SOLUTION:');
    console.log('   1. Use licensed user account for authentication');
    console.log('   2. Grant licensed user access to shared mailbox');
    console.log('   3. Access shared mailbox through licensed user');
    console.log();
    console.log('🔧 IMPLEMENTATION STEPS:');
    console.log();
    console.log('A) Microsoft 365 Admin Configuration:');
    console.log('   1. Login to Microsoft 365 Admin Center');
    console.log('   2. Go to Teams & groups > Shared mailboxes');
    console.log(`   3. Find: ${this.negozioEmail}`);
    console.log('   4. Click "Edit" > "Members"');
    console.log(`   5. Add user: ${this.licensedUserEmail}`);
    console.log('   6. Grant "Full access" and "Send as" permissions');
    console.log();
    console.log('B) Application Registration (if needed):');
    console.log('   1. Go to Azure AD > App registrations');
    console.log('   2. Find your CRM application');
    console.log('   3. Ensure these API permissions:');
    console.log('      - Mail.Read (Delegated)');
    console.log('      - Mail.Send (Delegated)');
    console.log('      - Mail.ReadWrite (Delegated)');
    console.log('   4. Grant admin consent if required');
    console.log();
    console.log('C) OAuth Connection:');
    console.log(`   1. Connect using: ${this.licensedUserEmail}`);
    console.log('   2. After connection, the system can access:');
    console.log(`      - ${this.licensedUserEmail} (primary mailbox)`);
    console.log(`      - ${this.negozioEmail} (shared mailbox)`);
    console.log();
  }

  async createProperEmailAccount() {
    console.log('🔧 Step 4: Creating proper email account configuration...');
    
    // Check if licensed user is already connected
    const { data: licensedAccount, error: checkError } = await this.supabase
      .from('email_accounts')
      .select('*')
      .eq('email', this.licensedUserEmail)
      .eq('provider_type', 'microsoft')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking licensed user account:', checkError);
      return;
    }

    if (licensedAccount) {
      console.log(`✅ Licensed user account already connected: ${this.licensedUserEmail}`);
      console.log('   This account can now access the shared mailbox');
      
      // Create a reference entry for the shared mailbox
      await this.createSharedMailboxReference(licensedAccount.user_id);
    } else {
      console.log(`⚠️  Licensed user account not connected yet: ${this.licensedUserEmail}`);
      console.log();
      console.log('🚀 TO CONNECT THE LICENSED USER:');
      console.log('1. Go to CRM Settings > Email Accounts');
      console.log('2. Click "Connect Microsoft Account"');
      console.log(`3. Login with: ${this.licensedUserEmail}`);
      console.log('4. Grant the requested permissions');
      console.log('5. After connection, run this script again');
    }

    console.log();
  }

  async createSharedMailboxReference(userId) {
    console.log('📮 Creating shared mailbox reference...');
    
    // Create a reference entry for the shared mailbox that points to the licensed user's OAuth
    const { data: sharedMailboxRef, error } = await this.supabase
      .from('email_accounts')
      .insert({
        user_id: userId,
        organization_id: this.withcarOrgId,
        provider_type: 'microsoft_shared',
        email: this.negozioEmail,
        display_name: 'WithCar Negozio (Shared Mailbox)',
        username: this.negozioEmail,
        // Reference to the licensed user for OAuth access
        imap_host: this.licensedUserEmail, // Store licensed user email in imap_host field
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Error creating shared mailbox reference:', error);
    } else {
      console.log(`✅ Created shared mailbox reference for ${this.negozioEmail}`);
      console.log(`   Access through licensed user: ${this.licensedUserEmail}`);
    }
  }

  async testConnection() {
    console.log('🧪 Testing email connection...');
    
    // This would test the connection to both the licensed user and shared mailbox
    // Implementation would depend on Microsoft Graph API integration
    console.log('⚠️  Connection testing requires Microsoft Graph API integration');
    console.log('   This will be implemented in the email fetching scripts');
  }
}

// Run the fixer
async function main() {
  const fixer = new WithcarEmailFixer();
  await fixer.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WithcarEmailFixer;












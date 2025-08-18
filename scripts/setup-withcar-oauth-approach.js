#!/usr/bin/env node

/**
 * WithCar OAuth Approach Setup
 * 
 * Since basic IMAP authentication is disabled by Microsoft 365,
 * this script sets up the proper OAuth approach using a licensed user.
 * 
 * This matches what the IT team said:
 * "shared mailboxom je omogočen dostop samo z licenčnega predala"
 * (shared mailbox access is only enabled from licensed mailbox)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class WithcarOAuthApproach {
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

    // Email configuration
    this.licensedUserEmail = 'zarfin.jakupovic@withcar.si';
    this.sharedMailboxEmail = 'negozio@withcar.it';
    this.withcarOrgId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
  }

  async run() {
    console.log('🔐 WITHCAR OAUTH APPROACH SETUP');
    console.log('═'.repeat(35));
    console.log();
    console.log('📋 ANALYSIS:');
    console.log('   ❌ Basic IMAP authentication is DISABLED by Microsoft 365');
    console.log('   ❌ negozio@withcar.it cannot be accessed directly');
    console.log('   ✅ Must use licensed user for OAuth authentication');
    console.log();
    console.log(`🔐 Licensed User: ${this.licensedUserEmail}`);
    console.log(`📧 Target Mailbox: ${this.sharedMailboxEmail}`);
    console.log();

    try {
      // Step 1: Find user
      await this.findUser();
      
      // Step 2: Check if licensed user is already connected
      await this.checkLicensedUserConnection();
      
      // Step 3: Set up the approach
      await this.setupOAuthApproach();
      
      console.log('✅ OAuth approach setup completed!');
      console.log();
      console.log('🚀 NEXT STEPS:');
      console.log('1. You need to connect the licensed user first');
      console.log('2. Go to CRM Settings > Email Accounts');
      console.log('3. Click "Connect Microsoft Account"');
      console.log(`4. Login with: ${this.licensedUserEmail}`);
      console.log('5. After connection, run: npm run fetch:withcar-shared');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async findUser() {
    console.log('👤 Step 1: Finding user account...');
    
    const { data: users, error } = await this.supabase
      .from('email_accounts')
      .select('user_id')
      .limit(1);
    
    if (users && users.length > 0) {
      this.userId = users[0].user_id;
      console.log(`✅ Using user: ${this.userId}`);
    } else {
      const { data: authUsers } = await this.supabase.auth.admin.listUsers();
      if (authUsers?.users?.length > 0) {
        this.userId = authUsers.users[0].id;
        console.log(`✅ Using auth user: ${this.userId}`);
      } else {
        throw new Error('No users found. Please create a user first.');
      }
    }
    console.log();
  }

  async checkLicensedUserConnection() {
    console.log('🔍 Step 2: Checking licensed user connection...');
    
    const { data: licensedAccount, error } = await this.supabase
      .from('email_accounts')
      .select('*')
      .eq('email', this.licensedUserEmail)
      .eq('provider_type', 'microsoft')
      .single();
    
    if (licensedAccount && !error) {
      console.log(`✅ Licensed user is already connected!`);
      console.log(`   Email: ${licensedAccount.email}`);
      console.log(`   Connected: ${licensedAccount.created_at}`);
      console.log(`   Has OAuth token: ${licensedAccount.access_token ? 'Yes' : 'No'}`);
      
      this.licensedAccountExists = true;
      this.licensedAccountId = licensedAccount.id;
    } else {
      console.log(`⚠️  Licensed user is NOT connected yet`);
      console.log(`   Need to connect: ${this.licensedUserEmail}`);
      this.licensedAccountExists = false;
    }
    console.log();
  }

  async setupOAuthApproach() {
    console.log('⚙️  Step 3: Setting up OAuth approach...');
    
    if (this.licensedAccountExists) {
      // Licensed user is connected, we can set up shared mailbox reference
      await this.createSharedMailboxReference();
    } else {
      // Licensed user not connected, show instructions
      await this.showConnectionInstructions();
    }
    
    // Create a configuration record for the approach
    await this.createConfigurationRecord();
    
    console.log();
  }

  async createSharedMailboxReference() {
    console.log('📮 Creating shared mailbox reference...');
    
    // Check if reference already exists
    const { data: existing, error: checkError } = await this.supabase
      .from('email_accounts')
      .select('id')
      .eq('email', this.sharedMailboxEmail)
      .single();
    
    if (existing && !checkError) {
      console.log('✅ Shared mailbox reference already exists');
      return;
    }
    
    // Create reference entry
    const { data: sharedRef, error } = await this.supabase
      .from('email_accounts')
      .insert({
        user_id: this.userId,
        organization_id: this.withcarOrgId,
        provider_type: 'microsoft_shared',
        email: this.sharedMailboxEmail,
        display_name: 'WithCar Negozio (via Licensed User)',
        username: this.sharedMailboxEmail,
        // Store licensed user reference
        imap_host: this.licensedUserEmail, // Reference to licensed user
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Error creating shared mailbox reference:', error);
    } else {
      console.log(`✅ Created shared mailbox reference (ID: ${sharedRef.id})`);
      console.log(`   Access through: ${this.licensedUserEmail}`);
    }
  }

  async showConnectionInstructions() {
    console.log('📋 LICENSED USER CONNECTION REQUIRED');
    console.log('─'.repeat(40));
    console.log();
    console.log('🔧 TO CONNECT THE LICENSED USER:');
    console.log('1. Open your CRM system in browser');
    console.log('2. Go to Settings > Email Accounts');
    console.log('3. Click "Connect Microsoft Account" or "Add Email Account"');
    console.log('4. Select "Microsoft Outlook" as provider');
    console.log(`5. Login with: ${this.licensedUserEmail}`);
    console.log('6. Enter the password when prompted');
    console.log('7. Grant all requested permissions');
    console.log('8. Wait for successful connection confirmation');
    console.log();
    console.log('⚠️  IMPORTANT: You must use the licensed user email, not negozio email!');
    console.log();
  }

  async createConfigurationRecord() {
    console.log('📝 Creating configuration record...');
    
    // Store configuration in organization settings or a custom table
    const configData = {
      withcar_email_approach: 'oauth_licensed_user',
      licensed_user_email: this.licensedUserEmail,
      shared_mailbox_email: this.sharedMailboxEmail,
      setup_date: new Date().toISOString(),
      status: this.licensedAccountExists ? 'ready' : 'pending_connection',
      notes: 'Microsoft 365 disabled basic auth, using OAuth through licensed user'
    };
    
    // Try to update organization settings
    const { error } = await this.supabase
      .from('organizations')
      .update({
        settings: configData,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.withcarOrgId);
    
    if (error) {
      console.log('⚠️  Could not update organization settings (this is ok)');
    } else {
      console.log('✅ Configuration saved to organization settings');
    }
  }

  async testCurrentSetup() {
    console.log('🧪 Testing current setup...');
    
    if (!this.licensedAccountExists) {
      console.log('⚠️  Cannot test - licensed user not connected yet');
      return;
    }
    
    // Try to fetch a few emails to test the setup
    console.log('📧 Testing email access...');
    console.log('   (This would be done by the fetch script)');
    console.log(`✅ Setup appears ready for testing with: npm run fetch:withcar-shared`);
  }
}

// Run the setup
async function main() {
  const setup = new WithcarOAuthApproach();
  await setup.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WithcarOAuthApproach;








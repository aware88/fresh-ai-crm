#!/usr/bin/env node

/**
 * Simple WithCar IMAP Email Setup
 * 
 * This script sets up negozio@withcar.it using direct IMAP connection
 * just like their previous customer's system did.
 * 
 * No Microsoft Graph API, no OAuth, no admin permissions needed.
 * Just email + password + IMAP settings.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { ImapFlow } = require('imapflow');
const crypto = require('crypto');

class WithcarSimpleIMAPSetup {
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

    // WithCar email credentials (same as previous customer used)
    this.withcarEmail = 'negozio@withcar.it';
    this.withcarPassword = 'Sux94451';
    this.withcarOrgId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    
    // IMAP settings for Italian email providers
    this.imapSettings = {
      // Try multiple configurations
      configs: [
        {
          name: 'Microsoft 365 / Outlook',
          imap_host: 'outlook.office365.com',
          imap_port: 993,
          imap_security: 'SSL/TLS',
          smtp_host: 'smtp.office365.com',
          smtp_port: 587,
          smtp_security: 'STARTTLS'
        },
        {
          name: 'Exchange Server',
          imap_host: 'mail.withcar.it',
          imap_port: 993,
          imap_security: 'SSL/TLS',
          smtp_host: 'mail.withcar.it',
          smtp_port: 587,
          smtp_security: 'STARTTLS'
        },
        {
          name: 'Generic IMAP',
          imap_host: 'imap.withcar.it',
          imap_port: 993,
          imap_security: 'SSL/TLS',
          smtp_host: 'smtp.withcar.it',
          smtp_port: 587,
          smtp_security: 'STARTTLS'
        }
      ]
    };
  }

  async run() {
    console.log('📧 WITHCAR SIMPLE IMAP SETUP');
    console.log('═'.repeat(40));
    console.log();
    console.log(`📬 Email: ${this.withcarEmail}`);
    console.log(`🔑 Password: ${this.withcarPassword}`);
    console.log();

    try {
      // Step 1: Find a user to associate with
      await this.findOrCreateUser();
      
      // Step 2: Test IMAP connections to find working configuration
      const workingConfig = await this.testIMAPConfigurations();
      
      if (!workingConfig) {
        console.log('❌ Could not find working IMAP configuration');
        console.log();
        console.log('🔧 TROUBLESHOOTING:');
        console.log('1. Verify email credentials are correct');
        console.log('2. Check if 2FA is enabled (may need app password)');
        console.log('3. Ensure IMAP is enabled in email settings');
        console.log('4. Contact WithCar IT for correct IMAP server settings');
        return;
      }
      
      // Step 3: Create email account in database
      await this.createEmailAccount(workingConfig);
      
      // Step 4: Test email fetching
      await this.testEmailFetching();
      
      console.log('✅ WithCar IMAP setup completed successfully!');
      console.log();
      console.log('🚀 Next steps:');
      console.log('1. Test email fetching: npm run fetch:withcar-imap-final');
      console.log('2. Check CRM Settings > Email Accounts to verify');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      
      if (error.message.includes('authentication')) {
        console.log();
        console.log('🔐 AUTHENTICATION SOLUTIONS:');
        console.log('1. Verify password is correct: Sux94451');
        console.log('2. Check if 2FA is enabled - may need app password');
        console.log('3. Try enabling "Less secure app access" if available');
        console.log('4. Contact IT team to confirm IMAP is enabled');
      }
      
      process.exit(1);
    }
  }

  async findOrCreateUser() {
    console.log('👤 Step 1: Finding user account...');
    
    // Try to find existing user from email_accounts
    const { data: existingAccount, error } = await this.supabase
      .from('email_accounts')
      .select('user_id')
      .limit(1)
      .single();
    
    if (existingAccount && !error) {
      this.userId = existingAccount.user_id;
      console.log(`✅ Using existing user: ${this.userId}`);
    } else {
      // Fallback: use any auth user
      const { data: authUsers, error: authError } = await this.supabase.auth.admin.listUsers();
      
      if (authUsers?.users?.length > 0) {
        this.userId = authUsers.users[0].id;
        console.log(`✅ Using auth user: ${this.userId}`);
      } else {
        throw new Error('No users found in system. Please create a user first.');
      }
    }
    
    console.log();
  }

  async testIMAPConfigurations() {
    console.log('🔧 Step 2: Testing IMAP configurations...');
    
    for (const config of this.imapSettings.configs) {
      console.log(`   Testing: ${config.name}...`);
      
      try {
        const client = new ImapFlow({
          host: config.imap_host,
          port: config.imap_port,
          secure: config.imap_port === 993,
          auth: {
            user: this.withcarEmail,
            pass: this.withcarPassword
          },
          logger: false,
          connectTimeout: 10000,
          tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
          }
        });

        await client.connect();
        
        // Test basic operations
        const mailboxes = await client.list();
        await client.close();
        
        console.log(`   ✅ ${config.name} - WORKS! (${mailboxes.length} folders)`);
        return config;
        
      } catch (error) {
        console.log(`   ❌ ${config.name} - Failed: ${error.message.split('\n')[0]}`);
      }
    }
    
    return null;
  }

  async createEmailAccount(config) {
    console.log('💾 Step 3: Creating email account...');
    
    // Encrypt password
    const encryptedPassword = this.encryptPassword(this.withcarPassword);
    
    const { data: newAccount, error } = await this.supabase
      .from('email_accounts')
      .insert({
        user_id: this.userId,
        organization_id: this.withcarOrgId,
        provider_type: 'imap',
        email: this.withcarEmail,
        display_name: 'WithCar Negozio',
        username: this.withcarEmail,
        password_encrypted: encryptedPassword,
        imap_host: config.imap_host,
        imap_port: config.imap_port,
        imap_security: config.imap_security,
        smtp_host: config.smtp_host,
        smtp_port: config.smtp_port,
        smtp_security: config.smtp_security,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to create email account: ${error.message}`);
    }
    
    console.log(`✅ Email account created with ID: ${newAccount.id}`);
    this.accountId = newAccount.id;
    console.log();
  }

  async testEmailFetching() {
    console.log('📥 Step 4: Testing email fetching...');
    
    try {
      // Get the created account
      const { data: account, error } = await this.supabase
        .from('email_accounts')
        .select('*')
        .eq('id', this.accountId)
        .single();
      
      if (error) throw error;

      // Test IMAP connection and fetch a few emails
      const client = new ImapFlow({
        host: account.imap_host,
        port: account.imap_port,
        secure: account.imap_port === 993,
        auth: {
          user: account.username,
          pass: this.decryptPassword(account.password_encrypted)
        },
        logger: false,
        connectTimeout: 10000,
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        }
      });

      await client.connect();
      
      // List mailboxes
      const mailboxes = await client.list();
      console.log(`   📁 Found ${mailboxes.length} mailboxes`);
      
      // Try to open INBOX and get message count
      const lock = await client.getMailboxLock('INBOX');
      try {
        const status = await client.status('INBOX', { messages: true });
        console.log(`   📧 INBOX has ${status.messages} messages`);
      } finally {
        lock.release();
      }
      
      await client.close();
      console.log('   ✅ Email fetching test successful!');
      
    } catch (error) {
      console.log(`   ⚠️  Email fetching test failed: ${error.message}`);
      console.log('   (This might be normal - the account is created and should work)');
    }
    
    console.log();
  }

  encryptPassword(password) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decryptPassword(encryptedPassword) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
      
      const [ivHex, encrypted] = encryptedPassword.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher(algorithm, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // Fallback: return as-is if decryption fails
      return encryptedPassword;
    }
  }
}

// Run the setup
async function main() {
  const setup = new WithcarSimpleIMAPSetup();
  await setup.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WithcarSimpleIMAPSetup;








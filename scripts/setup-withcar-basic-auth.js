#!/usr/bin/env node

/**
 * WithCar Basic Authentication Setup
 * 
 * This script tries multiple approaches to connect negozio@withcar.it:
 * 1. Basic IMAP with different server configurations
 * 2. App Password authentication (if 2FA is enabled)
 * 3. Modern Authentication bypass methods
 * 
 * Based on IT team feedback that previous customers could connect with just email+password
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { ImapFlow } = require('imapflow');
const crypto = require('crypto');

class WithcarBasicAuthSetup {
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

    // WithCar email credentials
    this.withcarEmail = 'negozio@withcar.it';
    this.withcarPassword = 'Sux94451';
    this.withcarOrgId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    
    // Extended IMAP configurations to try
    this.imapConfigs = [
      {
        name: 'Microsoft 365 Basic Auth',
        imap_host: 'outlook.office365.com',
        imap_port: 993,
        imap_security: 'SSL/TLS',
        smtp_host: 'smtp.office365.com',
        smtp_port: 587,
        smtp_security: 'STARTTLS',
        auth_method: 'basic'
      },
      {
        name: 'Microsoft 365 Legacy',
        imap_host: 'imap-mail.outlook.com',
        imap_port: 993,
        imap_security: 'SSL/TLS',
        smtp_host: 'smtp-mail.outlook.com',
        smtp_port: 587,
        smtp_security: 'STARTTLS',
        auth_method: 'basic'
      },
      {
        name: 'Exchange Online',
        imap_host: 'outlook.office365.com',
        imap_port: 143,
        imap_security: 'STARTTLS',
        smtp_host: 'smtp.office365.com',
        smtp_port: 25,
        smtp_security: 'STARTTLS',
        auth_method: 'basic'
      },
      {
        name: 'Microsoft 365 Alternative',
        imap_host: 'outlook.office365.com',
        imap_port: 993,
        imap_security: 'SSL/TLS',
        smtp_host: 'smtp.office365.com',
        smtp_port: 587,
        smtp_security: 'STARTTLS',
        auth_method: 'plain'
      }
    ];
  }

  async run() {
    console.log('🔐 WITHCAR BASIC AUTHENTICATION SETUP');
    console.log('═'.repeat(45));
    console.log();
    console.log(`📬 Email: ${this.withcarEmail}`);
    console.log(`🔑 Password: ${this.withcarPassword}`);
    console.log();
    console.log('🎯 Goal: Set up email connection like previous customers did');
    console.log();

    try {
      // Step 1: Find user
      await this.findUser();
      
      // Step 2: Try basic authentication methods
      const workingConfig = await this.testBasicAuth();
      
      if (!workingConfig) {
        // Step 3: Show alternative solutions
        await this.showAlternativeSolutions();
        return;
      }
      
      // Step 4: Create email account
      await this.createEmailAccount(workingConfig);
      
      // Step 5: Test the connection
      await this.testConnection();
      
      console.log('✅ WithCar email setup completed!');
      console.log();
      console.log('🚀 You can now:');
      console.log('1. Check Settings > Email Accounts in the CRM');
      console.log('2. Test email fetching: npm run fetch:withcar-imap-final');
      console.log('3. Start using the email integration');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      await this.showTroubleshootingSteps(error);
      process.exit(1);
    }
  }

  async findUser() {
    console.log('👤 Step 1: Finding user account...');
    
    // Get any existing user
    const { data: users, error } = await this.supabase
      .from('email_accounts')
      .select('user_id')
      .limit(1);
    
    if (users && users.length > 0) {
      this.userId = users[0].user_id;
      console.log(`✅ Using user: ${this.userId}`);
    } else {
      // Fallback to auth users
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

  async testBasicAuth() {
    console.log('🔧 Step 2: Testing basic authentication methods...');
    console.log();
    
    for (const config of this.imapConfigs) {
      console.log(`   🔍 Testing: ${config.name}`);
      console.log(`      Server: ${config.imap_host}:${config.imap_port}`);
      
      try {
        const clientConfig = {
          host: config.imap_host,
          port: config.imap_port,
          secure: config.imap_port === 993,
          auth: {
            user: this.withcarEmail,
            pass: this.withcarPassword
          },
          logger: false,
          connectTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 30000,
          tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
            ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA'
          }
        };

        // For STARTTLS connections
        if (config.imap_security === 'STARTTLS') {
          clientConfig.secure = false;
          clientConfig.requireTLS = true;
        }

        const client = new ImapFlow(clientConfig);
        
        console.log(`      ⏳ Connecting...`);
        await client.connect();
        
        console.log(`      ✅ Connected! Testing capabilities...`);
        
        // Test basic operations
        const capabilities = client.serverInfo?.capability || [];
        console.log(`      📋 Capabilities: ${capabilities.slice(0, 3).join(', ')}...`);
        
        // List mailboxes
        const mailboxes = await client.list();
        console.log(`      📁 Mailboxes: ${mailboxes.length} found`);
        
        // Try to access INBOX
        const lock = await client.getMailboxLock('INBOX', { readOnly: true });
        try {
          const status = await client.status('INBOX', { messages: true, unseen: true });
          console.log(`      📧 INBOX: ${status.messages} messages (${status.unseen} unread)`);
        } finally {
          lock.release();
        }
        
        await client.close();
        
        console.log(`      🎉 SUCCESS! ${config.name} works perfectly!`);
        console.log();
        return config;
        
      } catch (error) {
        const errorMsg = error.message.split('\n')[0];
        console.log(`      ❌ Failed: ${errorMsg}`);
        
        // Provide specific guidance based on error
        if (errorMsg.includes('authentication') || errorMsg.includes('LOGIN')) {
          console.log(`      💡 Authentication issue - might need app password`);
        } else if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
          console.log(`      💡 Connection timeout - server might be blocked`);
        } else if (errorMsg.includes('ENOTFOUND')) {
          console.log(`      💡 Server not found - incorrect hostname`);
        } else if (errorMsg.includes('Command failed')) {
          console.log(`      💡 Server rejected connection - modern auth required`);
        }
        console.log();
      }
    }
    
    return null;
  }

  async showAlternativeSolutions() {
    console.log('🔧 ALTERNATIVE SOLUTIONS');
    console.log('═'.repeat(30));
    console.log();
    console.log('Since basic IMAP authentication failed, here are the alternatives:');
    console.log();
    
    console.log('💡 OPTION 1: App Password (Recommended)');
    console.log('   If 2FA is enabled, you need an app-specific password:');
    console.log('   1. Login to Microsoft 365 with negozio@withcar.it');
    console.log('   2. Go to Security settings');
    console.log('   3. Create "App Password" for IMAP access');
    console.log('   4. Use app password instead of regular password');
    console.log();
    
    console.log('💡 OPTION 2: Enable Basic Authentication');
    console.log('   Ask WithCar IT admin to:');
    console.log('   1. Go to Microsoft 365 Admin Center');
    console.log('   2. Settings > Org settings > Modern authentication');
    console.log('   3. Enable "Basic authentication for IMAP"');
    console.log('   4. Apply to negozio@withcar.it mailbox');
    console.log();
    
    console.log('💡 OPTION 3: Use Licensed User (zarfin.jakupovic@withcar.si)');
    console.log('   1. Connect zarfin.jakupovic@withcar.si with OAuth');
    console.log('   2. Grant access to negozio@withcar.it shared mailbox');
    console.log('   3. Access emails through licensed user account');
    console.log('   Command: npm run fetch:withcar-shared');
    console.log();
    
    console.log('💡 OPTION 4: Email Forwarding');
    console.log('   Set up forwarding from negozio@withcar.it to another email');
    console.log('   that can be connected more easily.');
    console.log();
    
    console.log('📞 RECOMMENDATION:');
    console.log('   Contact WithCar IT team and ask:');
    console.log('   "How did the previous customer connect negozio@withcar.it?"');
    console.log('   "Can you enable basic IMAP authentication for this mailbox?"');
    console.log();
  }

  async createEmailAccount(config) {
    console.log('💾 Step 3: Creating email account in database...');
    
    // Check if account already exists
    const { data: existing, error: checkError } = await this.supabase
      .from('email_accounts')
      .select('id')
      .eq('email', this.withcarEmail)
      .single();
    
    if (existing && !checkError) {
      console.log('⚠️  Email account already exists, updating configuration...');
      
      const { error: updateError } = await this.supabase
        .from('email_accounts')
        .update({
          imap_host: config.imap_host,
          imap_port: config.imap_port,
          imap_security: config.imap_security,
          smtp_host: config.smtp_host,
          smtp_port: config.smtp_port,
          smtp_security: config.smtp_security,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) {
        throw new Error(`Failed to update email account: ${updateError.message}`);
      }
      
      this.accountId = existing.id;
      console.log(`✅ Email account updated with ID: ${existing.id}`);
    } else {
      // Create new account
      const { data: newAccount, error } = await this.supabase
        .from('email_accounts')
        .insert({
          user_id: this.userId,
          organization_id: this.withcarOrgId,
          provider_type: 'imap',
          email: this.withcarEmail,
          display_name: 'WithCar Negozio',
          username: this.withcarEmail,
          password_encrypted: this.encryptPassword(this.withcarPassword),
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
      
      this.accountId = newAccount.id;
      console.log(`✅ Email account created with ID: ${newAccount.id}`);
    }
    console.log();
  }

  async testConnection() {
    console.log('🧪 Step 4: Final connection test...');
    
    try {
      const { data: account, error } = await this.supabase
        .from('email_accounts')
        .select('*')
        .eq('id', this.accountId)
        .single();
      
      if (error) throw error;

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
      
      // Quick test
      const mailboxes = await client.list();
      const lock = await client.getMailboxLock('INBOX', { readOnly: true });
      try {
        const status = await client.status('INBOX', { messages: true });
        console.log(`✅ Connection verified! INBOX has ${status.messages} messages`);
      } finally {
        lock.release();
      }
      
      await client.close();
      
    } catch (error) {
      console.log(`⚠️  Connection test failed: ${error.message}`);
      console.log('   (Account is created but may need troubleshooting)');
    }
    
    console.log();
  }

  async showTroubleshootingSteps(error) {
    console.log();
    console.log('🔧 TROUBLESHOOTING STEPS:');
    console.log('═'.repeat(30));
    
    if (error.message.includes('authentication')) {
      console.log('🔐 Authentication Error:');
      console.log('   1. Verify password: Sux94451');
      console.log('   2. Check if 2FA is enabled (need app password)');
      console.log('   3. Ask IT to enable basic auth for IMAP');
    } else if (error.message.includes('timeout')) {
      console.log('⏱️  Connection Timeout:');
      console.log('   1. Check firewall settings');
      console.log('   2. Verify IMAP is enabled on mailbox');
      console.log('   3. Try different network connection');
    } else {
      console.log('❓ General Error:');
      console.log('   1. Contact WithCar IT team');
      console.log('   2. Ask how previous customer connected');
      console.log('   3. Request IMAP server details');
    }
    
    console.log();
    console.log('📞 Contact WithCar IT with this information:');
    console.log(`   - Email: ${this.withcarEmail}`);
    console.log(`   - Error: ${error.message}`);
    console.log('   - Request: Enable IMAP basic authentication');
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
      if (!ivHex || !encrypted) return encryptedPassword;
      
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher(algorithm, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      return encryptedPassword;
    }
  }
}

// Run the setup
async function main() {
  const setup = new WithcarBasicAuthSetup();
  await setup.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WithcarBasicAuthSetup;












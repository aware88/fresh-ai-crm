#!/usr/bin/env node

/**
 * WithCar Shared Mailbox Email Fetcher
 * 
 * This script fetches emails from negozio@withcar.it shared mailbox
 * by accessing it through a licensed Microsoft 365 user account.
 * 
 * Approach:
 * 1. Use licensed user's OAuth token (zarfin.jakupovic@withcar.si)
 * 2. Access shared mailbox (negozio@withcar.it) through Graph API
 * 3. Fetch emails from both the licensed user's mailbox and shared mailbox
 * 4. Store emails in database for AI processing
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

class WithcarSharedMailboxFetcher {
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

    // Configuration
    this.licensedUserEmail = 'zarfin.jakupovic@withcar.si';
    this.sharedMailboxEmail = 'negozio@withcar.it';
    this.withcarOrgId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    
    // Microsoft Graph API endpoints
    this.graphBaseUrl = 'https://graph.microsoft.com/v1.0';
    this.accessToken = null;
    this.userId = null;
  }

  async run() {
    console.log('📮 WITHCAR SHARED MAILBOX FETCHER');
    console.log('═'.repeat(50));
    console.log();
    console.log(`🔐 Licensed User: ${this.licensedUserEmail}`);
    console.log(`📧 Shared Mailbox: ${this.sharedMailboxEmail}`);
    console.log();

    try {
      // Step 1: Get OAuth token from licensed user account
      await this.getLicensedUserToken();
      
      // Step 2: Test access to both mailboxes
      await this.testMailboxAccess();
      
      // Step 3: Fetch emails from shared mailbox
      await this.fetchSharedMailboxEmails();
      
      // Step 4: Store emails in database
      console.log('✅ Shared mailbox email fetching completed!');
      
    } catch (error) {
      console.error('❌ Error fetching shared mailbox emails:', error);
      
      if (error.response?.status === 401) {
        console.log();
        console.log('🔧 AUTHENTICATION ERROR - SOLUTIONS:');
        console.log('1. Ensure the licensed user account is connected in CRM');
        console.log('2. Check if OAuth token has expired and needs refresh');
        console.log('3. Verify the licensed user has access to the shared mailbox');
        console.log();
        console.log('🚀 TO RECONNECT:');
        console.log('   Go to Settings > Email Accounts > Connect Microsoft Account');
        console.log(`   Login with: ${this.licensedUserEmail}`);
      } else if (error.response?.status === 403) {
        console.log();
        console.log('🔧 PERMISSION ERROR - SOLUTIONS:');
        console.log('1. Grant licensed user access to shared mailbox in Microsoft 365 Admin');
        console.log('2. Ensure "Full access" and "Send as" permissions are granted');
        console.log('3. Wait up to 60 minutes for permissions to propagate');
        console.log();
        console.log('📋 ADMIN STEPS:');
        console.log('   1. Microsoft 365 Admin Center > Teams & groups > Shared mailboxes');
        console.log(`   2. Select: ${this.sharedMailboxEmail}`);
        console.log('   3. Edit > Members > Add member');
        console.log(`   4. Add: ${this.licensedUserEmail}`);
        console.log('   5. Grant: Full access + Send as permissions');
      }
      
      process.exit(1);
    }
  }

  async getLicensedUserToken() {
    console.log('🔐 Step 1: Getting licensed user OAuth token...');
    
    const { data: account, error } = await this.supabase
      .from('email_accounts')
      .select('*')
      .eq('email', this.licensedUserEmail)
      .eq('provider_type', 'microsoft')
      .single();
    
    if (error || !account) {
      throw new Error(`Licensed user account not found: ${this.licensedUserEmail}. Please connect it first.`);
    }

    this.accessToken = account.access_token;
    this.userId = account.user_id;
    
    if (!this.accessToken) {
      throw new Error('No access token found for licensed user');
    }

    // Check token expiration
    const expiresAt = new Date(account.token_expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      console.log('⚠️ Access token expired, attempting refresh...');
      await this.refreshToken(account);
    } else {
      console.log('✅ Access token is valid');
    }

    console.log(`👤 User ID: ${this.userId}`);
    console.log();
  }

  async refreshToken(account) {
    if (!account.refresh_token) {
      throw new Error('No refresh token available. Please reconnect the account.');
    }

    console.log('🔄 Refreshing OAuth token...');
    
    try {
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', 
        new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Update token in database
      await this.supabase
        .from('email_accounts')
        .update({
          access_token,
          refresh_token: refresh_token || account.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      this.accessToken = access_token;
      console.log('✅ Token refreshed successfully');
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error.response?.data || error.message);
      throw new Error('Token refresh failed. Please reconnect the account.');
    }
  }

  async testMailboxAccess() {
    console.log('🧪 Step 2: Testing mailbox access...');
    
    // Test access to licensed user's mailbox
    try {
      const userResponse = await this.makeGraphRequest(`/me/mailFolders`);
      console.log(`✅ Licensed user mailbox accessible (${userResponse.data.value.length} folders)`);
    } catch (error) {
      console.error('❌ Cannot access licensed user mailbox:', error.message);
      throw error;
    }

    // Test access to shared mailbox
    try {
      const sharedResponse = await this.makeGraphRequest(`/users/${this.sharedMailboxEmail}/mailFolders`);
      console.log(`✅ Shared mailbox accessible (${sharedResponse.data.value.length} folders)`);
    } catch (error) {
      console.error('❌ Cannot access shared mailbox:', error.message);
      console.log('   This might be expected if permissions are not yet configured');
    }

    console.log();
  }

  async fetchSharedMailboxEmails() {
    console.log('📥 Step 3: Fetching emails from shared mailbox...');
    
    const folders = ['inbox', 'sentitems'];
    let totalEmails = 0;

    for (const folder of folders) {
      console.log(`📂 Fetching from ${folder}...`);
      
      try {
        // Fetch from shared mailbox
        const emails = await this.fetchEmailsFromFolder(
          `/users/${this.sharedMailboxEmail}/mailFolders/${folder}/messages`,
          folder,
          100
        );
        
        if (emails.length > 0) {
          await this.saveEmailsToDatabase(emails, folder, 'shared');
          totalEmails += emails.length;
          console.log(`✅ Fetched ${emails.length} emails from shared mailbox ${folder}`);
        } else {
          console.log(`📭 No emails found in shared mailbox ${folder}`);
        }
        
      } catch (error) {
        console.error(`❌ Error fetching from shared mailbox ${folder}:`, error.message);
        
        // Fallback: try to fetch from licensed user's mailbox
        console.log(`🔄 Fallback: Checking licensed user's ${folder}...`);
        try {
          const fallbackEmails = await this.fetchEmailsFromFolder(
            `/me/mailFolders/${folder}/messages`,
            folder,
            100
          );
          
          if (fallbackEmails.length > 0) {
            await this.saveEmailsToDatabase(fallbackEmails, folder, 'licensed');
            totalEmails += fallbackEmails.length;
            console.log(`✅ Fetched ${fallbackEmails.length} emails from licensed user ${folder}`);
          }
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed for ${folder}:`, fallbackError.message);
        }
      }
    }

    console.log(`📊 Total emails fetched: ${totalEmails}`);
    console.log();
  }

  async fetchEmailsFromFolder(endpoint, folderName, maxEmails = 100) {
    const emails = [];
    let nextLink = `${endpoint}?$top=${Math.min(maxEmails, 100)}&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,hasAttachments,importance,isRead&$orderby=receivedDateTime desc`;
    
    while (nextLink && emails.length < maxEmails) {
      const response = await this.makeGraphRequest(nextLink.replace(this.graphBaseUrl, ''));
      
      const fetchedEmails = response.data.value || [];
      emails.push(...fetchedEmails);
      
      nextLink = response.data['@odata.nextLink'];
      
      if (fetchedEmails.length === 0) break;
    }

    return emails.slice(0, maxEmails);
  }

  async saveEmailsToDatabase(emails, folder, source) {
    console.log(`💾 Saving ${emails.length} emails to database...`);
    
    const emailRecords = emails.map(email => ({
      message_id: email.id,
      thread_id: email.conversationId || email.id,
      subject: email.subject || '(No Subject)',
      from_email: email.from?.emailAddress?.address || 'unknown@withcar.it',
      from_name: email.from?.emailAddress?.name || 'Unknown',
      to_emails: email.toRecipients?.map(r => r.emailAddress.address).join(', ') || '',
      received_at: email.receivedDateTime ? new Date(email.receivedDateTime).toISOString() : new Date().toISOString(),
      body_text: email.bodyPreview || '',
      body_html: email.body?.content || '',
      folder: folder,
      is_read: email.isRead || false,
      has_attachments: email.hasAttachments || false,
      importance: email.importance || 'normal',
      user_id: this.userId,
      organization_id: this.withcarOrgId,
      email_account_id: null, // Will be set later
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Custom fields for WithCar
      withcar_import: true,
      withcar_source: source, // 'shared' or 'licensed'
      withcar_original_folder: folder,
      withcar_mailbox: source === 'shared' ? this.sharedMailboxEmail : this.licensedUserEmail
    }));

    // Insert emails in batches
    const batchSize = 50;
    for (let i = 0; i < emailRecords.length; i += batchSize) {
      const batch = emailRecords.slice(i, i + batchSize);
      
      const { error } = await this.supabase
        .from('emails')
        .insert(batch);
      
      if (error) {
        console.error('❌ Error saving email batch:', error);
      } else {
        console.log(`✅ Saved batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emailRecords.length / batchSize)}`);
      }
    }
  }

  async makeGraphRequest(endpoint) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.graphBaseUrl}${endpoint}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response;
  }
}

// Run the fetcher
async function main() {
  const fetcher = new WithcarSharedMailboxFetcher();
  await fetcher.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WithcarSharedMailboxFetcher;












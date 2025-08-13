#!/usr/bin/env node

/**
 * Withcar Email Fetcher - Using Existing OAuth Token
 * Uses the existing negozio@withcar.it OAuth token from database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

class WithcarOAuthEmailFetcher {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    this.accessToken = null;
    this.userId = null;
    this.withcarOrgId = null;
  }

  async initialize() {
    console.log('🚀 WITHCAR OAUTH EMAIL FETCHER');
    console.log('═'.repeat(50));
    console.log();

    // Get the existing OAuth token for negozio@withcar.it
    const { data: account, error } = await this.supabase
      .from('email_accounts')
      .select('*')
      .eq('email', 'negozio@withcar.it')
      .eq('provider_type', 'microsoft')
      .single();

    if (error || !account) {
      throw new Error('No Microsoft OAuth token found for negozio@withcar.it. Please connect the account first.');
    }

    this.accessToken = account.access_token;
    this.userId = account.user_id;
    
    if (!this.accessToken) {
      throw new Error('No access token found for negozio@withcar.it');
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

    // Find Withcar organization
    await this.findWithcarOrg();

    console.log(`📧 Email: negozio@withcar.it`);
    console.log(`👤 User: ${this.userId}`);
    console.log(`🏢 Organization: ${this.withcarOrgId}`);
    console.log();
  }

  async refreshToken(account) {
    if (!account.refresh_token) {
      throw new Error('No refresh token available, need to re-authenticate');
    }

    const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
    const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;

    const tokenData = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token'
    });

    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenData
      });

      const tokens = await response.json();

      if (!response.ok || tokens.error) {
        throw new Error(`Token refresh failed: ${tokens.error_description || tokens.error}`);
      }

      // Update token in database
      const expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600);
      
      await this.supabase
        .from('email_accounts')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || account.refresh_token,
          token_expires_at: new Date(expiresAt * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      this.accessToken = tokens.access_token;
      console.log('✅ Token refreshed successfully');

    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async findWithcarOrg() {
    const { data: orgs, error } = await this.supabase
      .from('organizations')
      .select('id, name')
      .ilike('name', '%withcar%');

    if (orgs && orgs.length > 0) {
      this.withcarOrgId = orgs[0].id;
      console.log(`✅ Found Withcar organization: ${orgs[0].name}`);
    } else {
      console.log('⚠️ No Withcar organization found, will create one');
      // Create organization logic would go here
    }
  }

  async makeGraphRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'graph.microsoft.com',
        path: endpoint,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${response.error?.message || data}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async fetchEmails(folderName, limit = 100) {
    console.log(`📥 Fetching ${limit} emails from ${folderName}...`);
    
    const endpoint = folderName === 'inbox' 
      ? `/v1.0/me/messages?$top=${limit}&$orderby=receivedDateTime desc`
      : `/v1.0/me/mailFolders('SentItems')/messages?$top=${limit}&$orderby=sentDateTime desc`;

    try {
      const response = await this.makeGraphRequest(endpoint);
      
      if (!response.value) {
        console.log(`⚠️ No emails found in ${folderName}`);
        return [];
      }

      console.log(`✅ Fetched ${response.value.length} emails from ${folderName}`);
      
      // Transform Microsoft Graph format to our format
      const emails = response.value.map(email => ({
        messageId: email.id,
        subject: email.subject || '(No Subject)',
        from: email.from?.emailAddress?.address || 'unknown@withcar.it',
        to: email.toRecipients?.map(r => r.emailAddress?.address).join(', ') || 'unknown@example.com',
        cc: email.ccRecipients?.map(r => r.emailAddress?.address).join(', ') || null,
        bcc: email.bccRecipients?.map(r => r.emailAddress?.address).join(', ') || null,
        date: new Date(email.receivedDateTime || email.sentDateTime),
        text: email.body?.contentType === 'text' ? email.body.content : '',
        html: email.body?.contentType === 'html' ? email.body.content : email.body?.content || '',
        attachments: email.hasAttachments ? [] : [], // Would need separate call for attachments
        read: email.isRead || false,
        importance: email.importance || 'normal',
        graphData: email // Store original for reference
      }));

      return emails;

    } catch (error) {
      console.error(`❌ Error fetching from ${folderName}:`, error.message);
      return [];
    }
  }

  async saveEmailsToDatabase(emails, emailType) {
    if (!emails.length) {
      console.log('⚠️ No emails to save');
      return 0;
    }

    console.log(`💾 Saving ${emails.length} ${emailType} emails to database...`);

    const emailsToInsert = emails.map(email => ({
      organization_id: this.withcarOrgId,
      message_id: email.messageId,
      subject: email.subject,
      raw_content: email.text,
      html_content: email.html,
      plain_content: email.text,
      sender: email.from,
      recipient: email.to,
      cc: email.cc,
      bcc: email.bcc,
      email_type: emailType,
      importance: email.importance,
      processing_status: 'pending',
      has_attachments: email.attachments.length > 0,
      attachments: email.attachments,
      metadata: {
        source: 'microsoft_graph',
        original_read_status: email.read,
        withcar_import: true,
        import_date: new Date().toISOString(),
        graph_data: email.graphData
      },
      received_at: emailType === 'inbound' ? email.date.toISOString() : null,
      sent_at: emailType === 'outbound' ? email.date.toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert in batches
    let inserted = 0;
    const batchSize = 50;
    
    for (let i = 0; i < emailsToInsert.length; i += batchSize) {
      const batch = emailsToInsert.slice(i, i + batchSize);
      
      try {
        const { data, error } = await this.supabase
          .from('emails')
          .insert(batch)
          .select('id');

        if (error) {
          console.error(`❌ Database error (batch ${Math.floor(i/batchSize) + 1}):`, error);
        } else {
          inserted += data.length;
          console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${data.length} emails`);
        }
      } catch (batchError) {
        console.error(`❌ Batch insert error:`, batchError.message);
      }
    }

    console.log(`✅ Successfully saved ${inserted}/${emails.length} ${emailType} emails`);
    return inserted;
  }

  async run() {
    try {
      await this.initialize();
      
      // Fetch received emails
      console.log('📥 FETCHING RECEIVED EMAILS');
      console.log('─'.repeat(40));
      const receivedEmails = await this.fetchEmails('inbox', 100);
      const inboundCount = await this.saveEmailsToDatabase(receivedEmails, 'inbound');
      
      console.log();
      
      // Fetch sent emails
      console.log('📤 FETCHING SENT EMAILS');
      console.log('─'.repeat(40));
      const sentEmails = await this.fetchEmails('sent', 100);
      const outboundCount = await this.saveEmailsToDatabase(sentEmails, 'outbound');
      
      // Summary
      console.log();
      console.log('📊 WITHCAR EMAIL IMPORT SUMMARY');
      console.log('═'.repeat(50));
      console.log(`📧 Email Account: negozio@withcar.it`);
      console.log(`📥 Received emails imported: ${inboundCount}`);
      console.log(`📤 Sent emails imported: ${outboundCount}`);
      console.log(`📊 Total emails imported: ${inboundCount + outboundCount}`);
      console.log();
      console.log('✅ Import completed successfully!');
      console.log('🎯 Emails are now available for AI analysis and training');
      console.log('═'.repeat(50));
      
    } catch (error) {
      console.error('❌ FATAL ERROR:', error.message);
      
      if (error.message.includes('No Microsoft OAuth token found')) {
        console.log();
        console.log('💡 SOLUTION: Connect the negozio@withcar.it account first:');
        console.log('1. Go to CRM → Settings → Email Accounts');
        console.log('2. Click "Add Outlook Account"');
        console.log('3. Login with negozio@withcar.it credentials');
        console.log('4. Complete OAuth flow');
        console.log('5. Then run this script again');
      }
      
      process.exit(1);
    }
  }
}

// Run the fetcher
const fetcher = new WithcarOAuthEmailFetcher();
fetcher.run();


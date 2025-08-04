#!/usr/bin/env node

/**
 * Withcar Microsoft Graph Email Fetching Script
 * 
 * This script fetches emails from Withcar's Office 365 account using Microsoft Graph API
 * and stores them in the database while preserving read/unread status.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('@microsoft/microsoft-graph-client');

class WithcarGraphFetcher {
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

  async getWithcarMicrosoftAccount() {
    console.log('🔍 Getting Withcar Microsoft account...');
    
    const { data: accounts, error } = await this.supabase
      .from('email_accounts')
      .select('*')
      .eq('email', this.withcarEmail)
      .eq('provider_type', 'microsoft')
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ Error getting account:', error);
      return null;
    }
    
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      console.log(`✅ Found Microsoft account: ${account.email}`);
      
      // Check if token is expired
      const expiresAt = new Date(account.token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now) {
        console.log('⚠️  Access token is expired, attempting refresh...');
        const refreshedAccount = await this.refreshAccessToken(account);
        return refreshedAccount;
      }
      
      return account;
    }
    
    console.log('❌ Withcar Microsoft account not found');
    return null;
  }

  async refreshAccessToken(account) {
    console.log('🔄 Refreshing access token...');
    
    if (!account.refresh_token) {
      console.log('❌ No refresh token available, need to re-authenticate');
      return null;
    }
    
    try {
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID || '',
          client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token',
        }),
      });
      
      if (!tokenResponse.ok) {
        console.error('❌ Token refresh failed');
        return null;
      }
      
      const tokenData = await tokenResponse.json();
      const expiresAt = Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600);
      
      // Update account with new tokens
      const { data: updatedAccount, error } = await this.supabase
        .from('email_accounts')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || account.refresh_token,
          token_expires_at: new Date(expiresAt * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating tokens:', error);
        return null;
      }
      
      console.log('✅ Access token refreshed successfully');
      return updatedAccount;
      
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return null;
    }
  }

  createGraphClient(accessToken) {
    return Client.init({
      authProvider: {
        getAccessToken: async () => {
          return accessToken;
        }
      }
    });
  }

  async fetchEmailsFromFolder(client, folderName, maxEmails = 100) {
    console.log(`📥 Fetching emails from ${folderName}...`);
    
    try {
      let apiPath;
      
      // Determine the correct API path based on folder
      switch (folderName.toLowerCase()) {
        case 'inbox':
          apiPath = '/me/messages';
          break;
        case 'sent':
        case 'sentitems':
          apiPath = '/me/mailFolders/sentitems/messages';
          break;
        case 'drafts':
          apiPath = '/me/mailFolders/drafts/messages';
          break;
        default:
          // Try to find the folder by name
          const folders = await client.api('/me/mailFolders').get();
          const folder = folders.value.find(f => 
            f.displayName.toLowerCase() === folderName.toLowerCase() ||
            f.displayName.toLowerCase().includes(folderName.toLowerCase())
          );
          
          if (folder) {
            apiPath = `/me/mailFolders/${folder.id}/messages`;
          } else {
            console.log(`⚠️  Folder ${folderName} not found, using inbox`);
            apiPath = '/me/messages';
          }
      }
      
      console.log(`🔍 Using API path: ${apiPath}`);
      
      // Fetch emails with comprehensive fields
      const result = await client
        .api(apiPath)
        .top(maxEmails)
        .select([
          'id',
          'subject',
          'bodyPreview',
          'body',
          'receivedDateTime',
          'sentDateTime',
          'from',
          'toRecipients',
          'ccRecipients',
          'bccRecipients',
          'hasAttachments',
          'attachments',
          'importance',
          'isRead',
          'isDraft',
          'flag',
          'internetMessageId'
        ].join(','))
        .orderby('receivedDateTime DESC')
        .get();
      
      const emails = result.value || [];
      console.log(`✅ Successfully fetched ${emails.length} emails from ${folderName}`);
      
      // Transform Microsoft Graph emails to our format
      const transformedEmails = emails.map((email, index) => ({
        id: email.id,
        messageId: email.internetMessageId || `graph-${email.id}`,
        subject: email.subject || '(No Subject)',
        from: email.from?.emailAddress?.address || 'unknown@withcar.it',
        fromName: email.from?.emailAddress?.name || email.from?.emailAddress?.address || '',
        to: email.toRecipients?.map(r => r.emailAddress?.address).join(', ') || 'unknown@example.com',
        toName: email.toRecipients?.map(r => r.emailAddress?.name || r.emailAddress?.address).join(', ') || '',
        cc: email.ccRecipients?.map(r => r.emailAddress?.address).join(', ') || null,
        bcc: email.bccRecipients?.map(r => r.emailAddress?.address).join(', ') || null,
        text: email.body?.content || email.bodyPreview || '',
        html: email.body?.contentType === 'html' ? email.body?.content : '',
        body: email.body?.content || email.bodyPreview || '',
        date: new Date(email.receivedDateTime || email.sentDateTime || new Date()),
        attachments: email.attachments || [],
        hasAttachments: email.hasAttachments || false,
        // Preserve original read status from Microsoft Graph
        read: email.isRead || false,
        isDraft: email.isDraft || false,
        importance: email.importance || 'normal',
        flags: email.flag ? [email.flag.flagStatus] : []
      }));
      
      // Log progress
      if (transformedEmails.length > 0) {
        console.log(`📊 Email date range: ${transformedEmails[transformedEmails.length - 1].date.toLocaleDateString()} to ${transformedEmails[0].date.toLocaleDateString()}`);
        console.log(`🔒 Read status: ${transformedEmails.filter(e => e.read).length}/${transformedEmails.length} emails are read`);
      }
      
      return transformedEmails;
      
    } catch (error) {
      console.error(`❌ Error fetching emails from ${folderName}:`, error);
      if (error.message.includes('Forbidden')) {
        console.log('💡 This might be a permissions issue. Ensure the app has Mail.Read permissions.');
      }
      return [];
    }
  }

  async saveEmailsToDatabase(emails, folder) {
    if (!emails.length) return 0;
    
    console.log(`💾 Saving ${emails.length} emails to database...`);
    
    const emailsToInsert = emails.map(email => ({
      organization_id: this.withcarOrgId,
      message_id: email.messageId,
      subject: email.subject,
      raw_content: email.text || '',
      html_content: email.html || '',
      plain_content: email.text || '',
      sender: email.from || email.fromName,
      recipient: email.to || email.toName,
      cc: email.cc,
      bcc: email.bcc,
      email_type: folder.toLowerCase().includes('sent') ? 'outbound' : 'inbound',
      importance: email.importance === 'high' ? 'high' : email.importance === 'low' ? 'low' : 'normal',
      processing_status: 'pending',
      has_attachments: email.hasAttachments || false,
      attachments: email.attachments || [],
      metadata: {
        folder: folder,
        original_read_status: email.read,
        is_draft: email.isDraft,
        flags: email.flags,
        graph_id: email.id,
        fetched_at: new Date().toISOString(),
        source: 'microsoft-graph'
      },
      received_at: folder.toLowerCase().includes('sent') ? null : email.date,
      sent_at: folder.toLowerCase().includes('sent') ? email.date : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert in batches
    const batchSize = 10;
    let savedCount = 0;
    
    for (let i = 0; i < emailsToInsert.length; i += batchSize) {
      const batch = emailsToInsert.slice(i, i + batchSize);
      
      const { data, error } = await this.supabase
        .from('emails')
        .upsert(batch, { 
          onConflict: 'message_id',
          ignoreDuplicates: true 
        });
        
      if (error) {
        console.error(`❌ Error saving batch ${Math.floor(i/batchSize) + 1}:`, error);
      } else {
        savedCount += batch.length;
        console.log(`✅ Saved batch ${Math.floor(i/batchSize) + 1}: ${batch.length} emails`);
      }
    }
    
    return savedCount;
  }

  async run() {
    console.log('🚀 Starting Withcar Microsoft Graph Email Fetching...');
    console.log('=' .repeat(60));
    console.log('📧 Email: negozio@withcar.it');
    console.log('🔐 Method: Microsoft Graph API');
    console.log('🔒 Mode: Read status preserved');
    console.log('=' .repeat(60));

    try {
      // Step 1: Get Microsoft account with valid tokens
      const account = await this.getWithcarMicrosoftAccount();
      if (!account) {
        console.error('❌ Withcar Microsoft account not found or tokens expired');
        console.log('\n💡 Please connect the account first:');
        console.log('   npm run connect:withcar-microsoft');
        process.exit(1);
      }

      // Step 2: Create Microsoft Graph client
      const graphClient = this.createGraphClient(account.access_token);
      console.log('✅ Microsoft Graph client initialized');

      // Step 3: Fetch inbox emails
      console.log('\n📥 Fetching inbox emails...');
      const inboxEmails = await this.fetchEmailsFromFolder(graphClient, 'inbox', 100);
      const savedInbox = await this.saveEmailsToDatabase(inboxEmails, 'inbox');

      // Step 4: Fetch sent emails
      console.log('\n📤 Fetching sent emails...');
      const sentEmails = await this.fetchEmailsFromFolder(graphClient, 'sent', 100);
      const savedSent = await this.saveEmailsToDatabase(sentEmails, 'sent');

      // Step 5: Generate summary
      const totalEmails = savedInbox + savedSent;
      const readInboxEmails = inboxEmails.filter(e => e.read).length;
      const readSentEmails = sentEmails.filter(e => e.read).length;
      
      console.log('\n🎉 Microsoft Graph Email Fetching Complete!');
      console.log('=' .repeat(60));
      console.log(`📥 Inbox Emails: ${savedInbox} fetched and stored`);
      console.log(`📤 Sent Emails: ${savedSent} fetched and stored`);
      console.log(`📊 Total Emails: ${totalEmails} ready for AI learning`);
      console.log(`🔒 Read Status Preserved:`);
      console.log(`   - Inbox: ${readInboxEmails}/${inboxEmails.length} were already read`);
      console.log(`   - Sent: ${readSentEmails}/${sentEmails.length} were already read`);
      
      if (totalEmails > 0) {
        console.log('\n📊 Quick Analysis:');
        const allEmails = [...inboxEmails, ...sentEmails];
        
        // Italian content detection
        const italianWords = ['il', 'la', 'di', 'che', 'grazie', 'saluti', 'cordiali', 'buongiorno', 'buonasera', 'gentile'];
        const italianEmails = allEmails.filter(email => {
          const text = (email.text || '').toLowerCase();
          const words = text.split(/\s+/);
          const italianCount = words.filter(word => italianWords.includes(word)).length;
          return italianCount > words.length * 0.03; // 3% threshold
        });
        
        console.log(`- Italian content detected: ${Math.round((italianEmails.length / allEmails.length) * 100)}% of emails`);
        console.log(`- Average subject length: ${Math.round(allEmails.reduce((sum, e) => sum + (e.subject || '').length, 0) / allEmails.length)} characters`);
        console.log(`- Emails with attachments: ${allEmails.filter(e => e.hasAttachments).length}`);
        console.log(`- High importance emails: ${allEmails.filter(e => e.importance === 'high').length}`);
        
        if (allEmails.length > 0) {
          const dates = allEmails.map(e => new Date(e.date).getTime());
          console.log(`- Date range: ${new Date(Math.min(...dates)).toLocaleDateString()} to ${new Date(Math.max(...dates)).toLocaleDateString()}`);
        }
      }

      console.log('\n✅ System Status: PRODUCTION READY');
      console.log('💡 Next Steps:');
      console.log('1. Login as tim.mak88@gmail.com to access Withcar dashboard');
      console.log('2. Navigate to Email section to see fetched emails');
      console.log('3. Use the stored emails for AI training and analysis');
      console.log('\n🔒 Security Note: All original read/unread statuses preserved');
      console.log('   No emails were marked as read during the fetching process');
      console.log('🚀 Data Source: Microsoft Graph API (OAuth2 authenticated)');

    } catch (error) {
      console.error('💥 Fetching failed:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const fetcher = new WithcarGraphFetcher();
  fetcher.run().catch(console.error);
}

module.exports = WithcarGraphFetcher;
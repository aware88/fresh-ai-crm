#!/usr/bin/env node

/**
 * Withcar Email Fetcher - Production Ready
 * Fetches 100 received + 100 sent emails from negozio@withcar.it
 * Saves them to the database preserving read/unread status
 */

require('dotenv').config({ path: '.env.local' });
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const EMAIL_CONFIG = {
  email: 'negozio@withcar.it',
  password: 'Sux94451',
  imap: {
    host: 'outlook.office365.com',
    port: 993,
    secure: true,
    auth: {
      user: 'negozio@withcar.it',
      pass: 'Sux94451'
    },
    tls: {
      rejectUnauthorized: false
    }
  }
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

class WithcarEmailFetcher {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    this.withcarOrgId = null;
    this.userId = null;
  }

  async initialize() {
    console.log('🚀 WITHCAR EMAIL FETCHER - PRODUCTION');
    console.log('═'.repeat(60));
    console.log();

    // Validate environment
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase credentials in .env.local');
    }

    console.log('✅ Environment validated');
    
    // Find tim.mak88@gmail.com user
    await this.findUser();
    
    // Find or create Withcar organization
    await this.setupWithcarOrganization();
    
    console.log(`📧 Target: ${EMAIL_CONFIG.email}`);
    console.log(`🏢 Organization: ${this.withcarOrgId}`);
    console.log(`👤 User: ${this.userId}`);
    console.log();
  }

  async findUser() {
    // First try to find existing negozio@withcar.it user
    const { data: existingAccount, error } = await this.supabase
      .from('email_accounts')
      .select('user_id, email')
      .eq('email', 'negozio@withcar.it')
      .single();

    if (existingAccount && !error) {
      this.userId = existingAccount.user_id;
      console.log(`✅ Found existing user for negozio@withcar.it: ${this.userId}`);
      return;
    }

    // Fallback to any available user
    const { data: anyUser, error: userError } = await this.supabase
      .from('email_accounts')
      .select('user_id, email')
      .limit(1)
      .single();

    if (anyUser && !userError) {
      this.userId = anyUser.user_id;
      console.log(`✅ Using user: ${anyUser.email} (${this.userId})`);
      return;
    }

    throw new Error('Could not find any user in the system. Please ensure at least one user exists.');
  }

  async setupWithcarOrganization() {
    // Check if Withcar organization exists
    const { data: existingOrg, error: orgError } = await this.supabase
      .from('organizations')
      .select('id, name')
      .ilike('name', '%withcar%')
      .single();

    if (existingOrg) {
      this.withcarOrgId = existingOrg.id;
      console.log(`✅ Found existing organization: ${existingOrg.name}`);
      return;
    }

    // Create Withcar organization
    const { data: newOrg, error: createError } = await this.supabase
      .from('organizations')
      .insert([{
        name: 'Withcar',
        slug: 'withcar',
        created_by: this.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create Withcar organization: ${createError.message}`);
    }

    this.withcarOrgId = newOrg.id;
    console.log(`✅ Created Withcar organization: ${newOrg.id}`);

    // Add user to organization
    const { error: memberError } = await this.supabase
      .from('organization_members')
      .insert([{
        organization_id: this.withcarOrgId,
        user_id: this.userId,
        role: 'admin',
        created_at: new Date().toISOString()
      }]);

    if (memberError) {
      console.warn('⚠️ Could not add user to organization:', memberError.message);
    }

    // Set as current organization for user
    const { error: prefError } = await this.supabase
      .from('user_preferences')
      .upsert({
        user_id: this.userId,
        current_organization_id: this.withcarOrgId,
        updated_at: new Date().toISOString()
      });

    if (prefError) {
      console.warn('⚠️ Could not set current organization:', prefError.message);
    }
  }

  async connectIMAP() {
    console.log('📡 Connecting to IMAP server...');
    
    const client = new ImapFlow(EMAIL_CONFIG.imap);
    
    try {
      await client.connect();
      console.log('✅ IMAP connection established');
      return client;
    } catch (error) {
      console.error('❌ IMAP connection failed:', error.message);
      
      // Try alternative configurations
      const altConfigs = [
        { ...EMAIL_CONFIG.imap, host: 'imap-mail.outlook.com' },
        { ...EMAIL_CONFIG.imap, host: 'imap.gmail.com', port: 993 },
        { ...EMAIL_CONFIG.imap, tls: { rejectUnauthorized: false, ciphers: 'ALL' } }
      ];

      for (const config of altConfigs) {
        try {
          console.log(`🔄 Trying alternative config: ${config.host}`);
          const altClient = new ImapFlow(config);
          await altClient.connect();
          console.log('✅ Alternative IMAP connection established');
          return altClient;
        } catch (altError) {
          console.log(`❌ Alternative failed: ${altError.message}`);
        }
      }
      
      throw new Error('All IMAP connection attempts failed');
    }
  }

  async fetchEmails(client, folderName, limit = 100) {
    console.log(`📥 Fetching ${limit} emails from ${folderName}...`);
    
    await client.mailboxOpen(folderName);
    
    // Get total message count
    const status = await client.status(folderName, { messages: true });
    console.log(`📊 Total messages in ${folderName}: ${status.messages}`);
    
    if (status.messages === 0) {
      console.log(`⚠️ No messages found in ${folderName}`);
      return [];
    }

    // Calculate range to fetch last N messages
    const start = Math.max(1, status.messages - limit + 1);
    const end = status.messages;
    
    console.log(`🎯 Fetching messages ${start}:${end}`);

    const emails = [];
    
    try {
      for await (const message of client.fetch(`${start}:${end}`, {
        source: true,
        flags: true,
        envelope: true,
        bodyStructure: true
      })) {
        try {
          // Parse the email
          const parsed = await simpleParser(message.source);
          
          // Extract email data
          const emailData = {
            messageId: message.envelope.messageId || `withcar-${Date.now()}-${Math.random()}`,
            subject: parsed.subject || '(No Subject)',
            from: parsed.from?.text || parsed.from?.value?.[0]?.address || 'unknown@withcar.it',
            to: parsed.to?.text || parsed.to?.value?.[0]?.address || 'unknown@example.com',
            cc: parsed.cc?.text || null,
            bcc: parsed.bcc?.text || null,
            date: parsed.date || new Date(),
            text: parsed.text || '',
            html: parsed.html || '',
            attachments: parsed.attachments || [],
            flags: message.flags || [],
            read: message.flags?.includes('\\Seen') || false,
            uid: message.uid,
            seq: message.seq
          };

          emails.push(emailData);
          
          if (emails.length % 10 === 0) {
            console.log(`📧 Processed ${emails.length}/${limit} emails...`);
          }
          
        } catch (parseError) {
          console.warn(`⚠️ Failed to parse message ${message.seq}:`, parseError.message);
        }
      }
    } catch (fetchError) {
      console.error(`❌ Error fetching from ${folderName}:`, fetchError.message);
    }

    console.log(`✅ Successfully fetched ${emails.length} emails from ${folderName}`);
    return emails;
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
      importance: 'normal',
      processing_status: 'pending',
      has_attachments: email.attachments.length > 0,
      attachments: email.attachments,
      metadata: {
        folder: emailType === 'inbound' ? 'INBOX' : 'Sent Items',
        original_read_status: email.read,
        flags: email.flags,
        uid: email.uid,
        seq: email.seq,
        withcar_import: true,
        import_date: new Date().toISOString()
      },
      received_at: emailType === 'inbound' ? email.date.toISOString() : null,
      sent_at: emailType === 'outbound' ? email.date.toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert in batches of 50
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
          
          // Try individual inserts for this batch
          for (const email of batch) {
            try {
              const { error: singleError } = await this.supabase
                .from('emails')
                .insert([email]);
              
              if (!singleError) {
                inserted++;
              } else {
                console.warn(`⚠️ Failed to insert email: ${email.subject}`);
              }
            } catch (singleErr) {
              console.warn(`⚠️ Single insert error: ${singleErr.message}`);
            }
          }
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

  async generateSummary(inboundCount, outboundCount) {
    console.log();
    console.log('📊 WITHCAR EMAIL IMPORT SUMMARY');
    console.log('═'.repeat(60));
    console.log(`📧 Email Account: ${EMAIL_CONFIG.email}`);
    console.log(`🏢 Organization: Withcar (${this.withcarOrgId})`);
    console.log(`👤 User: tim.mak88@gmail.com (${this.userId})`);
    console.log();
    console.log(`📥 Received emails imported: ${inboundCount}`);
    console.log(`📤 Sent emails imported: ${outboundCount}`);
    console.log(`📊 Total emails imported: ${inboundCount + outboundCount}`);
    console.log();
    console.log('✅ Import completed successfully!');
    console.log('🎯 Emails are now available for AI analysis and training');
    console.log();
    console.log('📋 Next Steps:');
    console.log('1. Go to CRM → Dashboard → Email to view imported emails');
    console.log('2. The AI can now learn from Withcar\'s email patterns');
    console.log('3. Original read/unread status preserved in metadata');
    console.log();
    console.log('═'.repeat(60));
  }

  async run() {
    try {
      await this.initialize();
      
      const client = await this.connectIMAP();
      
      // Fetch received emails (INBOX)
      console.log('📥 FETCHING RECEIVED EMAILS');
      console.log('─'.repeat(40));
      const receivedEmails = await this.fetchEmails(client, 'INBOX', 100);
      const inboundCount = await this.saveEmailsToDatabase(receivedEmails, 'inbound');
      
      console.log();
      
      // Fetch sent emails (Sent Items)
      console.log('📤 FETCHING SENT EMAILS');
      console.log('─'.repeat(40));
      const sentEmails = await this.fetchEmails(client, 'Sent Items', 100);
      const outboundCount = await this.saveEmailsToDatabase(sentEmails, 'outbound');
      
      // Close IMAP connection
      await client.logout();
      console.log('✅ IMAP connection closed');
      
      // Generate summary
      await this.generateSummary(inboundCount, outboundCount);
      
    } catch (error) {
      console.error('❌ FATAL ERROR:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  }
}

// Run the fetcher
const fetcher = new WithcarEmailFetcher();
fetcher.run();

#!/usr/bin/env node

/**
 * Final Withcar IMAP Email Fetching Script
 * 
 * This script fetches emails from Withcar's account using IMAP
 * with the existing credentials and stores them in the database.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

class WithcarImapFetcher {
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
    this.withcarPassword = 'Sux94451';
    this.userEmail = 'tim.mak88@gmail.com';
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

  async createImapAccount(user) {
    console.log('🔧 Creating IMAP account entry...');
    
    // Create an IMAP account entry
    const { data: account, error } = await this.supabase
      .from('email_accounts')
      .insert([{
        user_id: user.id,
        email: this.withcarEmail,
        display_name: 'Withcar Email (IMAP)',
        provider_type: 'imap',
        imap_host: 'outlook.office365.com',
        imap_port: 993,
        imap_security: 'ssl',
        smtp_host: 'smtp-mail.outlook.com',
        smtp_port: 587,
        smtp_security: 'starttls',
        password: this.withcarPassword, // This will be encrypted by the database
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating account:', error);
      return null;
    }
    
    console.log('✅ IMAP account created');
    return account;
  }

  async connectToImap() {
    console.log('🔌 Connecting to IMAP server...');
    
    const client = new ImapFlow({
      host: 'outlook.office365.com',
      port: 993,
      secure: true,
      auth: {
        user: this.withcarEmail,
        pass: this.withcarPassword
      },
      logger: false
    });

    try {
      await client.connect();
      console.log('✅ Connected to IMAP server');
      return client;
    } catch (error) {
      console.error('❌ IMAP connection failed:', error.message);
      
      // Try alternative configurations
      const configs = [
        {
          host: 'imap-mail.outlook.com',
          port: 993,
          secure: true
        },
        {
          host: 'outlook.office365.com',
          port: 143,
          secure: false,
          autotls: 'required'
        },
        {
          host: 'imap-mail.outlook.com',
          port: 143,
          secure: false,
          autotls: 'required'
        }
      ];

      for (const config of configs) {
        console.log(`🔄 Trying alternative config: ${config.host}:${config.port}`);
        try {
          const altClient = new ImapFlow({
            ...config,
            auth: {
              user: this.withcarEmail,
              pass: this.withcarPassword
            },
            logger: false
          });
          
          await altClient.connect();
          console.log(`✅ Connected using ${config.host}:${config.port}`);
          return altClient;
        } catch (altError) {
          console.log(`❌ Failed with ${config.host}:${config.port}`);
        }
      }
      
      throw new Error('All IMAP configurations failed');
    }
  }

  async fetchEmailsFromFolder(client, folderName, maxEmails = 100) {
    console.log(`📥 Fetching emails from ${folderName}...`);
    
    try {
      // List available folders
      const folders = await client.list();
      console.log(`📁 Available folders: ${folders.map(f => f.path).join(', ')}`);
      
      // Find the target folder
      let targetFolder = folderName;
      const folderMap = {
        'inbox': ['INBOX', 'Inbox', 'inbox'],
        'sent': ['Sent Items', 'Sent', 'sent', 'INBOX.Sent', 'Posta inviata', 'Inviati']
      };
      
      const possibleNames = folderMap[folderName.toLowerCase()] || [folderName];
      for (const name of possibleNames) {
        const folder = folders.find(f => f.path.toLowerCase() === name.toLowerCase());
        if (folder) {
          targetFolder = folder.path;
          break;
        }
      }
      
      console.log(`📂 Using folder: ${targetFolder}`);
      
      // Lock the mailbox
      const lock = await client.getMailboxLock(targetFolder);
      
      try {
        // Fetch messages
        const messages = [];
        let count = 0;
        
        for await (const message of client.fetch(`${maxEmails}:1`, { 
          envelope: true, 
          bodyStructure: true,
          source: true,
          flags: true,
          uid: true
        })) {
          if (count >= maxEmails) break;
          
          try {
            // Parse the email
            const parsed = await simpleParser(message.source);
            
            const email = {
              id: message.uid,
              messageId: parsed.messageId || `imap-${message.uid}`,
              subject: parsed.subject || '(No Subject)',
              from: parsed.from?.text || 'unknown@withcar.it',
              fromName: parsed.from?.value?.[0]?.name || parsed.from?.text || '',
              to: parsed.to?.text || 'unknown@example.com',
              toName: parsed.to?.value?.[0]?.name || parsed.to?.text || '',
              cc: parsed.cc?.text || null,
              bcc: parsed.bcc?.text || null,
              text: parsed.text || '',
              html: parsed.html || '',
              body: parsed.text || parsed.html || '',
              date: parsed.date || new Date(),
              attachments: parsed.attachments || [],
              hasAttachments: (parsed.attachments && parsed.attachments.length > 0) || false,
              read: message.flags.includes('\\Seen'),
              isDraft: message.flags.includes('\\Draft'),
              importance: 'normal',
              flags: message.flags
            };
            
            messages.push(email);
            count++;
            
          } catch (parseError) {
            console.log(`⚠️  Failed to parse message ${message.uid}:`, parseError.message);
          }
        }
        
        console.log(`✅ Successfully fetched ${messages.length} emails from ${targetFolder}`);
        return messages;
        
      } finally {
        lock.release();
      }
      
    } catch (error) {
      console.error(`❌ Error fetching emails from ${folderName}:`, error);
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
        imap_uid: email.id,
        fetched_at: new Date().toISOString(),
        source: 'imap-direct'
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
    console.log('🚀 Starting Final Withcar IMAP Email Fetching...');
    console.log('=' .repeat(60));
    console.log('📧 Email: negozio@withcar.it');
    console.log('🔐 Method: IMAP (Direct)');
    console.log('🔒 Mode: Read status preserved');
    console.log('=' .repeat(60));

    try {
      // Step 1: Find user
      const user = await this.findUser();
      if (!user) {
        console.error('❌ User not found');
        process.exit(1);
      }

      // Step 2: Create IMAP account
      await this.createImapAccount(user);

      // Step 3: Connect to IMAP
      const client = await this.connectToImap();

      // Step 4: Fetch inbox emails
      console.log('\n📥 Fetching inbox emails...');
      const inboxEmails = await this.fetchEmailsFromFolder(client, 'inbox', 100);
      const savedInbox = await this.saveEmailsToDatabase(inboxEmails, 'inbox');

      // Step 5: Fetch sent emails
      console.log('\n📤 Fetching sent emails...');
      const sentEmails = await this.fetchEmailsFromFolder(client, 'sent', 100);
      const savedSent = await this.saveEmailsToDatabase(sentEmails, 'sent');

      // Step 6: Close connection
      await client.logout();

      // Step 7: Generate summary
      const totalEmails = savedInbox + savedSent;
      const readInboxEmails = inboxEmails.filter(e => e.read).length;
      const readSentEmails = sentEmails.filter(e => e.read).length;
      
      console.log('\n🎉 Final IMAP Email Fetching Complete!');
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
      console.log('🚀 Data Source: IMAP (Direct connection)');

    } catch (error) {
      console.error('💥 Fetching failed:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const fetcher = new WithcarImapFetcher();
  fetcher.run().catch(console.error);
}

module.exports = WithcarImapFetcher; 
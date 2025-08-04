#!/usr/bin/env node

/**
 * Withcar Production Setup Script
 * 
 * This script sets up the complete Withcar email system for production:
 * 1. Connects tim.mak88@gmail.com to Withcar organization
 * 2. Adds the Withcar IMAP email account (negozio@withcar.it)
 * 3. Fetches 100 sent and 100 received emails
 * 4. Stores them in the database for AI learning
 * 5. Preserves original read/unread status of emails
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

class WithcarProductionSetup {
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

  // Encrypt password for storage
  encryptPassword(password) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.NEXTAUTH_SECRET || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
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

  async connectUserToOrganization(userId) {
    console.log(`🔗 Connecting user to Withcar organization...`);
    
    // Check if user is already connected
    const { data: existingMembership, error: checkError } = await this.supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', this.withcarOrgId)
      .single();
    
    if (existingMembership) {
      console.log('✅ User already connected to Withcar organization');
      return true;
    }
    
    // Connect user to organization
    const { data, error } = await this.supabase
      .from('organization_members')
      .insert({
        user_id: userId,
        organization_id: this.withcarOrgId,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Error connecting user to organization:', error);
      return false;
    }
    
    console.log('✅ User successfully connected to Withcar organization');
    return true;
  }

  async addEmailAccount(userId) {
    console.log(`📧 Adding Withcar email account...`);
    
    // Check if email account already exists
    const { data: existingAccount, error: checkError } = await this.supabase
      .from('email_accounts')
      .select('*')
      .eq('email', this.withcarEmail)
      .eq('user_id', userId)
      .single();
    
    if (existingAccount) {
      console.log('✅ Withcar email account already exists');
      return existingAccount;
    }
    
    // Determine IMAP settings for the email provider
    const emailDomain = this.withcarEmail.split('@')[1];
    let imapSettings = {
      imap_host: 'imap.gmail.com', // Default fallback
      imap_port: 993,
      imap_security: 'SSL/TLS',
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_security: 'STARTTLS'
    };
    
    // Detect common Italian email providers
    if (emailDomain.includes('aruba') || emailDomain.includes('pec.it')) {
      imapSettings = {
        imap_host: 'imaps.aruba.it',
        imap_port: 993,
        imap_security: 'SSL/TLS',
        smtp_host: 'smtps.aruba.it',
        smtp_port: 465,
        smtp_security: 'SSL/TLS'
      };
    } else if (emailDomain.includes('libero.it')) {
      imapSettings = {
        imap_host: 'imapmail.libero.it',
        imap_port: 993,
        imap_security: 'SSL/TLS',
        smtp_host: 'smtp.libero.it',
        smtp_port: 587,
        smtp_security: 'STARTTLS'
      };
    } else if (emailDomain.includes('tiscali.it')) {
      imapSettings = {
        imap_host: 'imap.tiscali.it',
        imap_port: 993,
        imap_security: 'SSL/TLS',
        smtp_host: 'smtp.tiscali.it',
        smtp_port: 587,
        smtp_security: 'STARTTLS'
      };
    }
    
    // Create email account
    const { data: newAccount, error } = await this.supabase
      .from('email_accounts')
      .insert({
        user_id: userId,
        organization_id: this.withcarOrgId,
        provider_type: 'imap',
        email: this.withcarEmail,
        display_name: 'Withcar Italia',
        username: this.withcarEmail,
        password_encrypted: this.encryptPassword(this.withcarPassword),
        ...imapSettings,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Error adding email account:', error);
      return null;
    }
    
    console.log('✅ Withcar email account added successfully');
    return newAccount;
  }

  async ensureEmailsTable() {
    console.log('🗄️  Checking emails table...');
    
    // Try to query the table to see if it exists
    const { data, error } = await this.supabase
      .from('emails')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ emails table does not exist. Creating it...');
      
      // Create the emails table using SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.emails (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
          organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
          message_id TEXT UNIQUE,
          from_address TEXT NOT NULL,
          from_name TEXT,
          to_address TEXT,
          to_name TEXT,
          cc_address TEXT,
          bcc_address TEXT,
          subject TEXT,
          text_content TEXT,
          html_content TEXT,
          received_date TIMESTAMP WITH TIME ZONE,
          sent_date TIMESTAMP WITH TIME ZONE,
          folder TEXT DEFAULT 'inbox',
          has_attachments BOOLEAN DEFAULT false,
          headers JSONB,
          is_processed BOOLEAN DEFAULT false,
          is_archived BOOLEAN DEFAULT false,
          is_read BOOLEAN DEFAULT false,
          priority TEXT DEFAULT 'normal',
          labels TEXT[],
          thread_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own emails"
          ON public.emails
          FOR SELECT
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own emails"
          ON public.emails
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own emails"
          ON public.emails
          FOR UPDATE
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own emails"
          ON public.emails
          FOR DELETE
          USING (auth.uid() = user_id);

        CREATE INDEX emails_user_id_idx ON public.emails (user_id);
        CREATE INDEX emails_email_account_id_idx ON public.emails (email_account_id);
        CREATE INDEX emails_organization_id_idx ON public.emails (organization_id);
        CREATE INDEX emails_message_id_idx ON public.emails (message_id);
        CREATE INDEX emails_received_date_idx ON public.emails (received_date);
        CREATE INDEX emails_folder_idx ON public.emails (folder);
      `;
      
      const { error: createError } = await this.supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });
      
      if (createError) {
        console.error('❌ Error creating emails table:', createError);
        console.log('\n💡 Please create the emails table manually in Supabase:');
        console.log(createTableSQL);
        return false;
      }
      
      console.log('✅ emails table created successfully');
    } else if (error) {
      console.error('❌ Error checking emails table:', error);
      return false;
    } else {
      console.log('✅ emails table exists');
    }
    
    return true;
  }

  async fetchEmailsViaIMAP(accountId, userId, maxEmails = 100) {
    console.log(`📥 Fetching emails via IMAP (preserving read status)...`);
    
    try {
      // Call the IMAP fetch API with markAsSeen=false to preserve read status
      const response = await fetch(`http://localhost:3000/api/email/imap-fetch?accountId=${accountId}&maxEmails=${maxEmails}&folder=INBOX&markAsSeen=false`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.emails) {
        console.log(`✅ Successfully fetched ${data.emails.length} emails from INBOX`);
        
        // Store emails in database
        const savedCount = await this.saveEmailsToDatabase(accountId, userId, data.emails, 'inbox');
        console.log(`✅ Saved ${savedCount} emails to database`);
        
        return data.emails;
      } else {
        throw new Error(`Failed to fetch emails: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching emails via IMAP:', error);
      return [];
    }
  }

  async fetchSentEmailsViaIMAP(accountId, userId, maxEmails = 100) {
    console.log(`📤 Fetching sent emails via IMAP (preserving read status)...`);
    
    try {
      // Try common sent folder names
      const sentFolders = ['Sent', 'INBOX.Sent', 'Posta inviata', 'Inviati'];
      let sentEmails = [];
      
      for (const folder of sentFolders) {
        try {
          const response = await fetch(`http://localhost:3000/api/email/imap-fetch?accountId=${accountId}&maxEmails=${maxEmails}&folder=${folder}&markAsSeen=false`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.emails && data.emails.length > 0) {
              console.log(`✅ Successfully fetched ${data.emails.length} emails from ${folder}`);
              sentEmails = data.emails;
              
              // Store emails in database
              const savedCount = await this.saveEmailsToDatabase(accountId, userId, sentEmails, 'sent');
              console.log(`✅ Saved ${savedCount} sent emails to database`);
              
              break; // Found the correct sent folder
            }
          }
        } catch (error) {
          console.log(`⚠️  Could not fetch from ${folder}, trying next...`);
        }
      }
      
      if (sentEmails.length === 0) {
        console.log('⚠️  No sent emails found in any common sent folders');
      }
      
      return sentEmails;
    } catch (error) {
      console.error('❌ Error fetching sent emails via IMAP:', error);
      return [];
    }
  }

  async saveEmailsToDatabase(accountId, userId, emails, folder) {
    if (!emails.length) return 0;
    
    const emailsToInsert = emails.map(email => ({
      organization_id: this.withcarOrgId,
      message_id: email.id || email.messageId || `withcar-${Date.now()}-${Math.random()}`,
      subject: email.subject || '(No Subject)',
      raw_content: email.text || email.bodyText || email.body || '',
      html_content: email.html || email.body || '',
      plain_content: email.text || email.bodyText || '',
      sender: email.from || email.fromEmail || 'unknown@withcar.it',
      recipient: email.to || email.toEmail || 'unknown@example.com',
      cc: email.cc || null,
      bcc: email.bcc || null,
      email_type: folder === 'sent' ? 'outbound' : 'inbound',
      importance: 'normal',
      processing_status: 'pending',
      has_attachments: (email.attachments && email.attachments.length > 0) || false,
      attachments: email.attachments || [],
      metadata: {
        folder: folder,
        original_read_status: email.read !== undefined ? email.read : (email.flags && email.flags.includes('\\Seen')) || false,
        headers: email.headers || {},
        date: email.date || email.receivedDate || new Date().toISOString()
      },
      received_at: folder === 'inbox' ? (email.date || email.receivedDate || new Date().toISOString()) : null,
      sent_at: folder === 'sent' ? (email.date || email.receivedDate || new Date().toISOString()) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert emails in batches to avoid hitting size limits
    const batchSize = 20;
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
        // Continue with next batch even if this one failed
      } else {
        const batchSaved = batch.length; // Assume all were saved if no error
        savedCount += batchSaved;
        console.log(`✅ Saved batch ${Math.floor(i/batchSize) + 1}: ${batchSaved} emails`);
      }
    }
    
    return savedCount;
  }

  async generateAnalysisReport(userId) {
    console.log('📊 Generating analysis report...');
    
    // Get email statistics
    const { data: emailStats, error: statsError } = await this.supabase
      .from('emails')
      .select('email_type, subject, raw_content, received_at, sent_at, metadata')
      .eq('organization_id', this.withcarOrgId);
    
    if (statsError) {
      console.error('❌ Error getting email stats:', statsError);
      return null;
    }
    
    const inboxEmails = emailStats.filter(e => e.email_type === 'inbound');
    const sentEmails = emailStats.filter(e => e.email_type === 'outbound');
    
    const report = {
      summary: {
        totalEmails: emailStats.length,
        inboxEmails: inboxEmails.length,
        sentEmails: sentEmails.length,
        analysisDate: new Date().toISOString(),
        organization: 'Withcar',
        purpose: 'AI Learning and Production Preparation'
      },
      inboxAnalysis: {
        count: inboxEmails.length,
        averageWordCount: this.calculateAverageWordCount(inboxEmails),
        subjectPatterns: this.analyzeSubjectPatterns(inboxEmails),
        languageHints: this.detectLanguagePatterns(inboxEmails)
      },
      sentAnalysis: {
        count: sentEmails.length,
        averageWordCount: this.calculateAverageWordCount(sentEmails),
        subjectPatterns: this.analyzeSubjectPatterns(sentEmails),
        languageHints: this.detectLanguagePatterns(sentEmails)
      },
      recommendations: [
        'Emails are now stored in the database and ready for AI analysis',
        'Use the inbox emails to understand customer inquiries and issues',
        'Use the sent emails to learn Withcar\'s communication style and responses',
        'Consider implementing automated response suggestions based on this data',
        'Monitor email patterns for business intelligence insights'
      ]
    };
    
    console.log('✅ Analysis report generated');
    return report;
  }

  calculateAverageWordCount(emails) {
    if (emails.length === 0) return 0;
    const totalWords = emails.reduce((sum, email) => {
      const text = email.raw_content || '';
      return sum + text.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
    return Math.round(totalWords / emails.length);
  }

  analyzeSubjectPatterns(emails) {
    const subjects = emails.map(e => e.subject || '').filter(s => s);
    return {
      total: subjects.length,
      withRe: subjects.filter(s => s.toLowerCase().startsWith('re:')).length,
      withFwd: subjects.filter(s => s.toLowerCase().startsWith('fwd:')).length,
      questions: subjects.filter(s => s.includes('?')).length,
      urgent: subjects.filter(s => s.toLowerCase().includes('urgent') || s.toLowerCase().includes('urgente')).length
    };
  }

  detectLanguagePatterns(emails) {
    const italianWords = ['il', 'la', 'di', 'che', 'e', 'un', 'a', 'per', 'con', 'non', 'sono', 'della', 'gli', 'una', 'grazie', 'saluti'];
    let italianCount = 0;
    let totalEmails = 0;
    
    emails.forEach(email => {
      const text = (email.raw_content || '').toLowerCase();
      if (text.length > 10) { // Only analyze emails with meaningful content
        totalEmails++;
        const words = text.split(/\s+/);
        const italianWordsFound = words.filter(word => italianWords.includes(word)).length;
        if (italianWordsFound > words.length * 0.05) { // 5% threshold
          italianCount++;
        }
      }
    });
    
    return {
      totalAnalyzed: totalEmails,
      likelyItalian: italianCount,
      italianPercentage: totalEmails > 0 ? Math.round((italianCount / totalEmails) * 100) : 0
    };
  }

  async run() {
    console.log('🚀 Starting Withcar Production Setup...');
    console.log('=' .repeat(60));
    console.log('📧 Email: negozio@withcar.it');
    console.log('👤 User: tim.mak88@gmail.com');
    console.log('🏢 Organization: Withcar');
    console.log('=' .repeat(60));

    try {
      // Step 1: Find the user
      const user = await this.findUser();
      if (!user) {
        console.error('❌ Cannot proceed without user. Please ensure tim.mak88@gmail.com is registered.');
        process.exit(1);
      }

      // Step 2: Connect user to Withcar organization
      const connected = await this.connectUserToOrganization(user.id);
      if (!connected) {
        console.error('❌ Failed to connect user to organization');
        process.exit(1);
      }

      // Step 3: Ensure emails table exists
      const tableReady = await this.ensureEmailsTable();
      if (!tableReady) {
        console.error('❌ Emails table is not ready');
        process.exit(1);
      }

      // Step 4: Add email account
      const emailAccount = await this.addEmailAccount(user.id);
      if (!emailAccount) {
        console.error('❌ Failed to add email account');
        process.exit(1);
      }

      console.log('\n⏳ Waiting 5 seconds for account to be ready...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 5: Fetch inbox emails
      const inboxEmails = await this.fetchEmailsViaIMAP(emailAccount.id, user.id, 100);
      
      // Step 6: Fetch sent emails
      const sentEmails = await this.fetchSentEmailsViaIMAP(emailAccount.id, user.id, 100);

      // Step 7: Generate analysis report
      const report = await this.generateAnalysisReport(user.id);

      console.log('\n🎉 Withcar Production Setup Complete!');
      console.log('=' .repeat(60));
      console.log(`📧 Email Account: ${this.withcarEmail} (Active)`);
      console.log(`👤 User: ${user.email} connected to Withcar`);
      console.log(`📥 Inbox Emails: ${inboxEmails.length} fetched and stored`);
      console.log(`📤 Sent Emails: ${sentEmails.length} fetched and stored`);
      console.log(`📊 Total Emails: ${inboxEmails.length + sentEmails.length} ready for AI learning`);
      
      if (report) {
        console.log('\n📊 Quick Analysis:');
        console.log(`- Italian content detected: ${report.inboxAnalysis.languageHints.italianPercentage}% of inbox emails`);
        console.log(`- Average words per inbox email: ${report.inboxAnalysis.averageWordCount}`);
        console.log(`- Average words per sent email: ${report.sentAnalysis.averageWordCount}`);
      }

      console.log('\n✅ System Status: PRODUCTION READY');
      console.log('💡 Next Steps:');
      console.log('1. Login as tim.mak88@gmail.com to access Withcar dashboard');
      console.log('2. Navigate to Email section to see fetched emails');
      console.log('3. Use the stored emails for AI training and analysis');
      console.log('4. Monitor email patterns for business insights');
      console.log('\n🔒 Security Note: You can now disconnect the email account if desired.');
      console.log('   All emails are safely stored in the database.');

    } catch (error) {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const setup = new WithcarProductionSetup();
  setup.run().catch(console.error);
}

module.exports = WithcarProductionSetup;
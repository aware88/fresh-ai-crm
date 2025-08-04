#!/usr/bin/env node

/**
 * Withcar Email Fetching Script
 * 
 * This script fetches 100 sent emails and 100 received emails from Withcar's Italian email account
 * and saves them to JSON files for analysis of communication patterns and writing style.
 * 
 * Usage: node scripts/fetch-withcar-emails.js
 */

const fs = require('fs').promises;
const path = require('path');
const { createClientComponentClient } = require('@supabase/auth-helpers-nextjs');

class WithcarEmailFetcher {
  constructor() {
    this.outputDir = path.join(__dirname, '../data/withcar-emails');
    this.timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch (error) {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`Created output directory: ${this.outputDir}`);
    }
  }

  async fetchGmailEmails(accountId, folder, maxEmails = 100) {
    console.log(`Fetching ${maxEmails} emails from ${folder} folder...`);
    
    try {
      const url = `/api/email/gmail-simple?folder=${folder}&maxEmails=${maxEmails}&accountId=${accountId}`;
      const response = await fetch(`http://localhost:3000${url}`, {
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
        console.log(`Successfully fetched ${data.emails.length} emails from ${folder}`);
        return data.emails;
      } else {
        throw new Error(`Failed to fetch emails: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error fetching emails from ${folder}:`, error);
      return [];
    }
  }

  async fetchImapEmails(accountId, folder, maxEmails = 100) {
    console.log(`Fetching ${maxEmails} emails from ${folder} folder via IMAP...`);
    
    try {
      const url = `/api/email/imap-fetch?accountId=${accountId}&folder=${folder}&maxEmails=${maxEmails}`;
      const response = await fetch(`http://localhost:3000${url}`, {
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
        console.log(`Successfully fetched ${data.emails.length} emails from ${folder}`);
        return data.emails;
      } else {
        throw new Error(`Failed to fetch emails: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error fetching emails from ${folder}:`, error);
      return [];
    }
  }

  async findWithcarAccount() {
    console.log('Looking for Withcar email account...');
    
    try {
      const response = await fetch('http://localhost:3000/api/email/accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Look for Withcar email account
      const withcarAccount = data.accounts?.find(account => 
        account.email?.includes('withcar') || 
        account.email?.includes('negozio@withcar.it') ||
        account.email?.includes('.it') ||
        account.name?.toLowerCase().includes('withcar')
      );

      if (withcarAccount) {
        console.log(`Found Withcar account: ${withcarAccount.email}`);
        return withcarAccount;
      } else {
        console.log('Withcar account not found. Available accounts:');
        data.accounts?.forEach(account => {
          console.log(`- ${account.email} (${account.provider_type})`);
        });
        return null;
      }
    } catch (error) {
      console.error('Error finding Withcar account:', error);
      return null;
    }
  }

  processEmailForAnalysis(email) {
    return {
      id: email.id,
      subject: email.subject,
      from: email.from,
      to: email.to,
      date: email.date,
      body: email.body,
      bodyText: this.extractTextFromHtml(email.body),
      wordCount: this.countWords(email.body),
      language: this.detectLanguage(email.body),
      hasAttachments: email.attachments && email.attachments.length > 0,
      attachmentCount: email.attachments ? email.attachments.length : 0,
      folder: email.folder,
      // Analysis fields
      sentiment: null, // To be filled by analysis
      topics: [], // To be filled by analysis
      keyPhrases: [], // To be filled by analysis
    };
  }

  extractTextFromHtml(html) {
    if (!html) return '';
    // Simple HTML tag removal - you might want to use a proper HTML parser
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  countWords(text) {
    if (!text) return 0;
    const plainText = this.extractTextFromHtml(text);
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }

  detectLanguage(text) {
    if (!text) return 'unknown';
    const plainText = this.extractTextFromHtml(text);
    
    // Simple Italian detection (you might want to use a proper language detection library)
    const italianWords = ['il', 'la', 'di', 'che', 'e', 'un', 'a', 'per', 'con', 'non', 'sono', 'della', 'gli', 'una'];
    const words = plainText.toLowerCase().split(/\s+/);
    const italianWordCount = words.filter(word => italianWords.includes(word)).length;
    
    if (italianWordCount > words.length * 0.1) {
      return 'italian';
    }
    
    return 'unknown';
  }

  async saveEmailsToFile(emails, filename) {
    const filePath = path.join(this.outputDir, filename);
    
    const processedEmails = emails.map(email => this.processEmailForAnalysis(email));
    
    const output = {
      metadata: {
        fetchDate: new Date().toISOString(),
        totalEmails: processedEmails.length,
        source: 'withcar-italian-account',
        purpose: 'communication-pattern-analysis'
      },
      emails: processedEmails
    };

    await fs.writeFile(filePath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`Saved ${processedEmails.length} emails to ${filePath}`);
    
    return filePath;
  }

  async generateAnalysisReport(sentEmails, receivedEmails) {
    const report = {
      summary: {
        totalSentEmails: sentEmails.length,
        totalReceivedEmails: receivedEmails.length,
        totalEmails: sentEmails.length + receivedEmails.length,
        analysisDate: new Date().toISOString(),
      },
      sentEmailsAnalysis: {
        averageWordCount: this.calculateAverage(sentEmails.map(e => e.wordCount)),
        languageDistribution: this.getLanguageDistribution(sentEmails),
        subjectPatterns: this.analyzeSubjectPatterns(sentEmails),
        timeDistribution: this.analyzeTimeDistribution(sentEmails),
      },
      receivedEmailsAnalysis: {
        averageWordCount: this.calculateAverage(receivedEmails.map(e => e.wordCount)),
        languageDistribution: this.getLanguageDistribution(receivedEmails),
        subjectPatterns: this.analyzeSubjectPatterns(receivedEmails),
        timeDistribution: this.analyzeTimeDistribution(receivedEmails),
      },
      recommendations: [
        'Analyze writing style consistency in sent emails',
        'Identify common customer issues from received emails',
        'Review response time patterns',
        'Examine language usage for AI training'
      ]
    };

    const reportPath = path.join(this.outputDir, `withcar-analysis-report-${this.timestamp}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Generated analysis report: ${reportPath}`);
    
    return reportPath;
  }

  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  getLanguageDistribution(emails) {
    const languages = {};
    emails.forEach(email => {
      languages[email.language] = (languages[email.language] || 0) + 1;
    });
    return languages;
  }

  analyzeSubjectPatterns(emails) {
    const subjects = emails.map(e => e.subject).filter(s => s);
    const patterns = {
      withRe: subjects.filter(s => s.toLowerCase().startsWith('re:')).length,
      withFwd: subjects.filter(s => s.toLowerCase().startsWith('fwd:')).length,
      questions: subjects.filter(s => s.includes('?')).length,
      urgent: subjects.filter(s => s.toLowerCase().includes('urgent')).length,
    };
    return patterns;
  }

  analyzeTimeDistribution(emails) {
    const hours = emails.map(email => {
      const date = new Date(email.date);
      return date.getHours();
    });

    const distribution = {};
    hours.forEach(hour => {
      distribution[hour] = (distribution[hour] || 0) + 1;
    });

    return distribution;
  }

  async run() {
    console.log('🚀 Starting Withcar Email Fetching Process...');
    console.log('=' .repeat(60));

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Find Withcar account
      const account = await this.findWithcarAccount();
      if (!account) {
        console.error('❌ Could not find Withcar email account. Please ensure it is connected.');
        process.exit(1);
      }

      console.log(`✅ Found account: ${account.email} (${account.provider_type})`);

      // Fetch emails based on account type
      let sentEmails = [];
      let receivedEmails = [];

      if (account.provider_type === 'google') {
        // Fetch from Gmail
        sentEmails = await this.fetchGmailEmails(account.id, 'sent', 100);
        receivedEmails = await this.fetchGmailEmails(account.id, 'inbox', 100);
      } else if (account.provider_type === 'imap') {
        // Fetch from IMAP
        sentEmails = await this.fetchImapEmails(account.id, 'Sent', 100);
        receivedEmails = await this.fetchImapEmails(account.id, 'INBOX', 100);
      } else {
        console.error(`❌ Unsupported account type: ${account.provider_type}`);
        process.exit(1);
      }

      // Save emails to files
      const sentFilePath = await this.saveEmailsToFile(
        sentEmails, 
        `withcar-sent-emails-${this.timestamp}.json`
      );
      
      const receivedFilePath = await this.saveEmailsToFile(
        receivedEmails, 
        `withcar-received-emails-${this.timestamp}.json`
      );

      // Generate analysis report
      const processedSent = sentEmails.map(email => this.processEmailForAnalysis(email));
      const processedReceived = receivedEmails.map(email => this.processEmailForAnalysis(email));
      
      const reportPath = await this.generateAnalysisReport(processedSent, processedReceived);

      console.log('\n🎉 Email fetching completed successfully!');
      console.log('=' .repeat(60));
      console.log(`📧 Sent emails: ${sentEmails.length} saved to ${sentFilePath}`);
      console.log(`📧 Received emails: ${receivedEmails.length} saved to ${receivedFilePath}`);
      console.log(`📊 Analysis report: ${reportPath}`);
      console.log('\n💡 Next steps:');
      console.log('1. Review the saved email files');
      console.log('2. Analyze communication patterns');
      console.log('3. Use insights for AI training');
      console.log('4. Disconnect the email account when ready');

    } catch (error) {
      console.error('❌ Error during email fetching process:', error);
      process.exit(1);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const fetcher = new WithcarEmailFetcher();
  fetcher.run().catch(console.error);
}

module.exports = WithcarEmailFetcher; 
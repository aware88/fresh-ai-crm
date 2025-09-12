import { ImapFlow } from 'imapflow';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface EmailAccount {
  id: string;
  email: string;
  username: string;
  password_encrypted: string;
  display_name: string;
  provider: string;
  smtp_host: string;
  smtp_port: number;
  smtp_security: string;
  // OAuth tokens for Google/Microsoft
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
}

interface DraftData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: any[];
}

export class EmailDraftService {
  private supabase = createServiceRoleClient();

  private decryptPassword(encryptedPassword: string): string {
    const key = process.env.PASSWORD_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('PASSWORD_ENCRYPTION_KEY not set in environment variables');
    }
    
    const keyBuffer = Buffer.from(key, 'hex').slice(0, 32);
    const parts = encryptedPassword.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted password format');
    }
    
    const crypto = require('crypto');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipherGCM('aes-256-gcm');
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Save draft to appropriate email provider based on account type
   */
  async saveDraft(accountId: string, draftData: DraftData): Promise<{ success: boolean; draftId?: string; error?: string }> {
    try {
      // Get email account details
      const { data: account, error: accountError } = await this.supabase
        .from('email_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (!account || accountError) {
        return { success: false, error: 'Email account not found' };
      }

      const provider = account.provider?.toLowerCase() || 'imap';

      switch (provider) {
        case 'gmail':
        case 'google':
          return await this.saveGmailDraft(account, draftData);
        
        case 'outlook':
        case 'microsoft':
        case 'azure':
          return await this.saveMicrosoftDraft(account, draftData);
        
        case 'imap':
        default:
          return await this.saveImapDraft(account, draftData);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save draft to Gmail using Gmail API
   */
  private async saveGmailDraft(account: EmailAccount, draftData: DraftData): Promise<{ success: boolean; draftId?: string; error?: string }> {
    try {
      if (!account.access_token) {
        return { success: false, error: 'Gmail access token not available' };
      }

      // Create Gmail API client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      
      oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Create email message in RFC2822 format
      const emailLines = [];
      emailLines.push(`To: ${draftData.to.join(', ')}`);
      if (draftData.cc && draftData.cc.length > 0) {
        emailLines.push(`Cc: ${draftData.cc.join(', ')}`);
      }
      if (draftData.bcc && draftData.bcc.length > 0) {
        emailLines.push(`Bcc: ${draftData.bcc.join(', ')}`);
      }
      emailLines.push(`Subject: ${draftData.subject}`);
      emailLines.push('Content-Type: text/html; charset=utf-8');
      emailLines.push('');
      emailLines.push(draftData.body);

      const rawMessage = emailLines.join('\r\n');
      const encodedMessage = Buffer.from(rawMessage).toString('base64url');

      // Create draft
      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage
          }
        }
      });

      return { 
        success: true, 
        draftId: response.data.id || undefined 
      };

    } catch (error) {
      console.error('Error saving Gmail draft:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Gmail API error' 
      };
    }
  }

  /**
   * Save draft to Microsoft Outlook using Graph API
   */
  private async saveMicrosoftDraft(account: EmailAccount, draftData: DraftData): Promise<{ success: boolean; draftId?: string; error?: string }> {
    try {
      if (!account.access_token) {
        return { success: false, error: 'Microsoft access token not available' };
      }

      // Create Microsoft Graph client
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, account.access_token!);
        }
      });

      // Create draft message
      const draftMessage = {
        subject: draftData.subject,
        body: {
          contentType: 'html',
          content: draftData.body
        },
        toRecipients: draftData.to.map(email => ({
          emailAddress: { address: email }
        })),
        ccRecipients: draftData.cc ? draftData.cc.map(email => ({
          emailAddress: { address: email }
        })) : undefined,
        bccRecipients: draftData.bcc ? draftData.bcc.map(email => ({
          emailAddress: { address: email }
        })) : undefined
      };

      // Save draft
      const response = await graphClient
        .api('/me/messages')
        .post(draftMessage);

      return { 
        success: true, 
        draftId: response.id || undefined 
      };

    } catch (error) {
      console.error('Error saving Microsoft draft:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Microsoft Graph API error' 
      };
    }
  }

  /**
   * Save draft to IMAP server
   */
  private async saveImapDraft(account: EmailAccount, draftData: DraftData): Promise<{ success: boolean; draftId?: string; error?: string }> {
    try {
      const password = this.decryptPassword(account.password_encrypted);

      // Create IMAP client
      const client = new ImapFlow({
        host: account.smtp_host,
        port: 143, // Use IMAP port, not SMTP
        secure: false,
        auth: {
          user: account.username,
          pass: password,
        },
        logger: false,
      });

      await client.connect();

      // Create email message in RFC2822 format
      const emailLines = [];
      emailLines.push(`To: ${draftData.to.join(', ')}`);
      if (draftData.cc && draftData.cc.length > 0) {
        emailLines.push(`Cc: ${draftData.cc.join(', ')}`);
      }
      if (draftData.bcc && draftData.bcc.length > 0) {
        emailLines.push(`Bcc: ${draftData.bcc.join(', ')}`);
      }
      emailLines.push(`Subject: ${draftData.subject}`);
      emailLines.push(`Date: ${new Date().toISOString()}`);
      emailLines.push('Content-Type: text/html; charset=utf-8');
      emailLines.push('');
      emailLines.push(draftData.body);

      const rawMessage = emailLines.join('\r\n');

      // Try to append to Drafts folder
      try {
        const result = await client.mailboxOpen('Drafts');
        await client.append('Drafts', rawMessage, ['\\Draft']);
        
        await client.logout();
        
        return { 
          success: true, 
          draftId: `imap-draft-${Date.now()}` 
        };
      } catch (appendError) {
        // Try alternative draft folder names
        const draftFolders = ['INBOX.Drafts', 'Draft', 'Entwürfe', 'Bozze'];
        
        for (const folder of draftFolders) {
          try {
            await client.mailboxOpen(folder);
            await client.append(folder, rawMessage, ['\\Draft']);
            
            await client.logout();
            
            return { 
              success: true, 
              draftId: `imap-draft-${Date.now()}` 
            };
          } catch (folderError) {
            continue;
          }
        }
        
        throw new Error('Could not find drafts folder');
      }

    } catch (error) {
      console.error('Error saving IMAP draft:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'IMAP error' 
      };
    }
  }

  /**
   * Get drafts from email provider
   */
  async getDrafts(accountId: string): Promise<{ success: boolean; drafts?: any[]; error?: string }> {
    try {
      const { data: account, error: accountError } = await this.supabase
        .from('email_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (!account || accountError) {
        return { success: false, error: 'Email account not found' };
      }

      const provider = account.provider?.toLowerCase() || 'imap';

      switch (provider) {
        case 'gmail':
        case 'google':
          return await this.getGmailDrafts(account);
        
        case 'outlook':
        case 'microsoft':
        case 'azure':
          return await this.getMicrosoftDrafts(account);
        
        case 'imap':
        default:
          return await this.getImapDrafts(account);
      }
    } catch (error) {
      console.error('Error getting drafts:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async getGmailDrafts(account: EmailAccount): Promise<{ success: boolean; drafts?: any[]; error?: string }> {
    // Implementation for getting Gmail drafts
    // This would use Gmail API to list drafts
    return { success: true, drafts: [] };
  }

  private async getMicrosoftDrafts(account: EmailAccount): Promise<{ success: boolean; drafts?: any[]; error?: string }> {
    // Implementation for getting Microsoft drafts
    // This would use Graph API to list drafts
    return { success: true, drafts: [] };
  }

  private async getImapDrafts(account: EmailAccount): Promise<{ success: boolean; drafts?: any[]; error?: string }> {
    // Implementation for getting IMAP drafts
    // This would use IMAP to list drafts from drafts folder
    return { success: true, drafts: [] };
  }
}

// Export singleton instance
export const emailDraftService = new EmailDraftService();
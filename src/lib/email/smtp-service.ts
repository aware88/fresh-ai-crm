import nodemailer from 'nodemailer';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import * as crypto from 'crypto';

interface EmailAccount {
  id: string;
  email: string;
  username: string;
  password_encrypted: string;
  display_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_security: string;
}

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  htmlBody: string;
  plainBody: string;
  attachments?: any[];
}

export class SMTPEmailService {
  private supabase = createServiceRoleClient();

  private decryptPassword(encryptedPassword: string): string {
    // Use the same decryption logic as IMAP (AES-256-GCM)
    const key = process.env.PASSWORD_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('PASSWORD_ENCRYPTION_KEY not set in environment variables');
    }
    
    const keyBuffer = Buffer.from(key, 'hex').slice(0, 32);
    const parts = encryptedPassword.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted password format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private createTransporter(emailAccount: EmailAccount) {
    const port = emailAccount.smtp_port;
    
    // Try different configurations based on port
    let secure = false;
    let requireTLS = false;
    
    if (port === 465) {
      secure = true; // SSL/TLS
    } else if (port === 587 || port === 25) {
      secure = false; // STARTTLS
      requireTLS = true;
    }
    
    console.log('🔧 Creating SMTP transporter with:', {
      host: emailAccount.smtp_host,
      port: port,
      secure: secure,
      requireTLS: requireTLS,
      user: emailAccount.username
    });
    
    return nodemailer.createTransport({
      host: emailAccount.smtp_host,
      port: port,
      secure: secure,
      requireTLS: requireTLS,
      auth: {
        user: emailAccount.username,
        pass: this.decryptPassword(emailAccount.password_encrypted),
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      connectionTimeout: 15000, // 15 second connection timeout
      greetingTimeout: 10000, // 10 second greeting timeout
      socketTimeout: 45000, // 45 second socket timeout
      debug: true // Enable debug logs
    });
  }

  private formatRecipients(recipients: EmailRecipient[]): string {
    return recipients.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join(', ');
  }

  async sendEmail(emailAccount: EmailAccount, options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('🔍 SMTP Debug - Starting email send process...');
      console.log('🔍 Email Account Details:', {
        email: emailAccount.email,
        smtp_host: emailAccount.smtp_host,
        smtp_port: emailAccount.smtp_port,
        smtp_security: emailAccount.smtp_security,
        username: emailAccount.username
      });

      const transporter = this.createTransporter(emailAccount);

      // Test connectivity first
      console.log('🔍 Testing SMTP connectivity...');
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('SMTP verification timeout after 10 seconds'));
          }, 10000);

          transporter.verify((error, success) => {
            clearTimeout(timeout);
            if (error) {
              console.log('⚠️ SMTP verification failed:', error.message);
              console.log('⚠️ Error details:', {
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode
              });
              resolve(false); // Don't reject, just log and continue
            } else {
              console.log('✅ SMTP verification successful!');
              resolve(true);
            }
          });
        });
      } catch (verifyError) {
        console.log('⚠️ SMTP verification error (continuing anyway):', verifyError);
      }

      const mailOptions = {
        from: emailAccount.display_name 
          ? `"${emailAccount.display_name}" <${emailAccount.email}>` 
          : emailAccount.email,
        to: this.formatRecipients(options.to),
        cc: options.cc ? this.formatRecipients(options.cc) : undefined,
        bcc: options.bcc ? this.formatRecipients(options.bcc) : undefined,
        subject: options.subject,
        text: options.plainBody,
        html: options.htmlBody,
        attachments: options.attachments || []
      };

      console.log('📧 Sending email via SMTP:', {
        host: emailAccount.smtp_host,
        port: emailAccount.smtp_port,
        security: emailAccount.smtp_security,
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      // Add timeout to prevent hanging
      const sendWithTimeout = Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP send timeout after 45 seconds')), 45000)
        )
      ]);

      const info = await sendWithTimeout;
      
      console.log('✅ Email sent successfully:', {
        messageId: info.messageId,
        response: info.response
      });

      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('❌ Failed to send email via SMTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMTP error'
      };
    }
  }
}

export const smtpEmailService = new SMTPEmailService();

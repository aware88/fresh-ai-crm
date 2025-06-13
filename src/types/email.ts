/**
 * Email type definition
 * Represents an email message
 */
export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: Date;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
    url?: string;
  }>;
  metadata?: Record<string, unknown>;
}

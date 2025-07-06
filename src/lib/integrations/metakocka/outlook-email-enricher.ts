import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';
import { enrichEmailWithMetakockaData, EmailEnrichmentResult } from './email-enricher';
import { Email } from '@/types/email';

/**
 * Converts a Microsoft Graph email to the internal Email format
 * @param graphEmail - The email from Microsoft Graph API
 * @returns Email in the internal format
 */
export function convertGraphEmailToInternalFormat(graphEmail: any): Email {
  return {
    id: graphEmail.id,
    subject: graphEmail.subject,
    body: graphEmail.body.content,
    bodyContentType: graphEmail.body.contentType === 'html' ? 'html' : 'text',
    sender: graphEmail.from.emailAddress.address,
    senderName: graphEmail.from.emailAddress.name || '',
    recipients: graphEmail.toRecipients.map((r: any) => r.emailAddress.address),
    recipientNames: graphEmail.toRecipients.map((r: any) => r.emailAddress.name || r.emailAddress.address),
    cc: graphEmail.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
    ccNames: graphEmail.ccRecipients?.map((r: any) => r.emailAddress.name || r.emailAddress.address) || [],
    date: new Date(graphEmail.receivedDateTime),
    hasAttachments: graphEmail.hasAttachments,
    // Add other fields as needed
    metadata: {
      source: 'microsoft-graph',
      importance: graphEmail.importance,
      isRead: graphEmail.isRead,
      messageId: graphEmail.id,
    },
  };
}

/**
 * Enriches a Microsoft Graph email with Metakocka data
 * @param messageId - The Microsoft Graph message ID
 * @param userId - The user ID
 * @returns The enrichment result
 */
export async function enrichMicrosoftGraphEmailWithMetakockaData(
  messageId: string,
  userId: string
): Promise<EmailEnrichmentResult> {
  try {
    // 1. Fetch the email content from Microsoft Graph API
    const session = await getServerSession();
    if (!session?.accessToken) {
      throw new Error('User not authenticated with Microsoft Graph');
    }
    
    const graphService = new MicrosoftGraphService(session.accessToken);
    const graphEmail = await graphService.getEmail(messageId);
    
    // 2. Convert Microsoft Graph email to our internal Email format
    const internalEmail = convertGraphEmailToInternalFormat(graphEmail);
    
    // 3. Use the existing enrichment logic with our converted email
    return await enrichEmailWithMetakockaData(internalEmail, userId);
  } catch (error: any) {
    console.error('Error enriching Microsoft Graph email:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred during email enrichment',
      metadata: null,
    };
  }
}

/**
 * Batch processes unprocessed Microsoft Graph emails with Metakocka enrichment
 * @param userId - The user ID
 * @param limit - Maximum number of emails to process
 * @returns Processing results
 */
export async function batchProcessUnprocessedMicrosoftGraphEmails(
  userId: string,
  limit: number = 10
) {
  try {
    // 1. Fetch the session for Microsoft Graph access
    const session = await getServerSession();
    if (!session?.accessToken) {
      throw new Error('User not authenticated with Microsoft Graph');
    }
    
    // 2. Get recent emails from Microsoft Graph
    const graphService = new MicrosoftGraphService(session.accessToken);
    const emails = await graphService.getEmails({ top: limit });
    
    // 3. Process each email
    const results = [];
    for (const email of emails) {
      try {
        const enrichmentResult = await enrichMicrosoftGraphEmailWithMetakockaData(
          email.id,
          userId
        );
        
        results.push({
          emailId: email.id,
          subject: email.subject,
          success: enrichmentResult.success,
          metadata: enrichmentResult.metadata,
          error: enrichmentResult.error,
        });
      } catch (error: any) {
        results.push({
          emailId: email.id,
          subject: email.subject,
          success: false,
          metadata: null,
          error: error.message || 'Unknown error during processing',
        });
      }
    }
    
    return {
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error: any) {
    console.error('Error batch processing Microsoft Graph emails:', error);
    return {
      success: false,
      processed: 0,
      successful: 0,
      failed: 0,
      error: error.message || 'Unknown error during batch processing',
      results: [],
    };
  }
}

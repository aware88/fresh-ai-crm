import { Client } from '@microsoft/microsoft-graph-client';
import { AuthProvider } from '@microsoft/microsoft-graph-client/authProviders/authProvider';

/**
 * Custom auth provider implementation for Microsoft Graph client
 */
class MicrosoftGraphAuthProvider implements AuthProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Returns the access token for Microsoft Graph API calls
   */
  getAccessToken(): Promise<string> {
    return Promise.resolve(this.accessToken);
  }
}

/**
 * Service for interacting with Microsoft Graph API
 */
export class MicrosoftGraphService {
  private client: Client;

  /**
   * Creates a new Microsoft Graph service instance
   * @param accessToken - The Microsoft Graph access token
   */
  constructor(accessToken: string) {
    const authProvider = new MicrosoftGraphAuthProvider(accessToken);
    this.client = Client.initWithMiddleware({
      authProvider,
    });
  }

  /**
   * Fetches emails from the user's mailbox
   * @param options - Query options including folder specification
   * @returns List of emails
   */
  async getEmails(options: { top?: number; skip?: number; filter?: string; folder?: 'inbox' | 'sent' | 'both' } = {}) {
    const { top = 10, skip = 0, filter = '', folder = 'inbox' } = options;
    
    try {
      if (folder === 'both') {
        // Fetch from both Inbox and Sent Items
        const inboxPromise = this.getEmailsFromFolder('inbox', { top: Math.ceil(top / 2), skip, filter });
        const sentPromise = this.getEmailsFromFolder('sent', { top: Math.floor(top / 2), skip, filter });
        
        const [inboxEmails, sentEmails] = await Promise.all([inboxPromise, sentPromise]);
        
        // Combine and sort by date
        const allEmails = [...inboxEmails, ...sentEmails];
        return allEmails.sort((a, b) => 
          new Date(b.receivedDateTime || b.sentDateTime).getTime() - 
          new Date(a.receivedDateTime || a.sentDateTime).getTime()
        ).slice(0, top);
      } else {
        return await this.getEmailsFromFolder(folder, { top, skip, filter });
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Fetches emails from a specific folder
   * @param folder - The folder to fetch from ('inbox' or 'sent')
   * @param options - Query options
   * @returns List of emails from the specified folder
   */
  async getEmailsFromFolder(
    folder: 'inbox' | 'sent', 
    options: { top?: number; skip?: number; filter?: string } = {}
  ) {
    const { top = 10, skip = 0, filter = '' } = options;
    
    let apiPath: string;
    if (folder === 'sent') {
      apiPath = '/me/mailFolders/SentItems/messages';
    } else {
      apiPath = '/me/messages'; // Inbox is default
    }
    
    const result = await this.client
      .api(apiPath)
      .top(top)
      .skip(skip)
      .filter(filter)
      .select('id,subject,bodyPreview,receivedDateTime,sentDateTime,from,toRecipients,ccRecipients,hasAttachments,importance,isRead')
      .orderby(folder === 'sent' ? 'sentDateTime DESC' : 'receivedDateTime DESC')
      .get();
      
    return (result as PromiseFulfilledResult<any>).value;
  }

  /**
   * Fetches a single email by ID
   * @param messageId - The email message ID
   * @returns Email message details
   */
  async getEmail(messageId: string) {
    try {
      return await this.client
        .api(`/me/messages/${messageId}`)
        .select('id,subject,body,receivedDateTime,from,toRecipients,ccRecipients,bccRecipients,hasAttachments,attachments,importance,isRead')
        .expand('attachments')
        .get();
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Sends an email
   * @param message - The email message to send
   */
  async sendEmail(message: any) {
    try {
      return await this.client
        .api('/me/sendMail')
        .post({ message });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Marks an email as read
   * @param messageId - The email message ID
   */
  async markAsRead(messageId: string) {
    try {
      return await this.client
        .api(`/me/messages/${messageId}`)
        .update({ isRead: true });
    } catch (error) {
      console.error(`Error marking email ${messageId} as read:`, error);
      throw error;
    }
  }
  
  /**
   * Marks an email as unread
   * @param messageId - The email message ID
   */
  async markAsUnread(messageId: string) {
    try {
      return await this.client
        .api(`/me/messages/${messageId}`)
        .update({ isRead: false });
    } catch (error) {
      console.error(`Error marking email ${messageId} as unread:`, error);
      throw error;
    }
  }
  
  /**
   * Deletes an email by moving it to the deleted items folder
   * @param messageId - The email message ID
   */
  async deleteEmail(messageId: string) {
    try {
      return await this.client
        .api(`/me/messages/${messageId}/move`)
        .post({
          destinationId: 'deleteditems'
        });
    } catch (error) {
      console.error(`Error deleting email ${messageId}:`, error);
      throw error;
    }
  }
  
  /**
   * Moves an email to a specified folder
   * @param messageId - The email message ID
   * @param folderId - The destination folder ID
   */
  async moveEmail(messageId: string, folderId: string) {
    try {
      return await this.client
        .api(`/me/messages/${messageId}/move`)
        .post({
          destinationId: folderId
        });
    } catch (error) {
      console.error(`Error moving email ${messageId} to folder ${folderId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches calendar events
   * @param options - Query options
   * @returns List of calendar events
   */
  async getCalendarEvents(options: { startDateTime?: string; endDateTime?: string; top?: number } = {}) {
    const { startDateTime, endDateTime, top = 10 } = options;
    
    try {
      let request = this.client
        .api('/me/calendar/events')
        .top(top)
        .select('id,subject,bodyPreview,start,end,location,organizer,attendees,isAllDay')
        .orderby('start/dateTime ASC');
        
      if (startDateTime && endDateTime) {
        request = request.filter(`start/dateTime ge '${startDateTime}' and end/dateTime le '${endDateTime}'`);
      }
      
      const result = await request.get();
      return (result as PromiseFulfilledResult<any>).value;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  /**
   * Fetches contacts from the user's address book
   * @param options - Query options
   * @returns List of contacts
   */
  async getContacts(options: { top?: number; skip?: number; filter?: string } = {}) {
    const { top = 10, skip = 0, filter = '' } = options;
    
    try {
      const result = await this.client
        .api('/me/contacts')
        .top(top)
        .skip(skip)
        .filter(filter)
        .select('id,displayName,emailAddresses,businessPhones,mobilePhone,jobTitle,companyName')
        .orderby('displayName ASC')
        .get();
        
      return (result as PromiseFulfilledResult<any>).value;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }
}

/**
 * EMAIL FILTER SERVICE
 * 
 * Filters out emails that shouldn't receive AI processing:
 * - Newsletters and marketing emails
 * - Auto-reply messages (vacation, out-of-office)
 * - Customer support ticket auto-replies
 * - Notification emails from systems
 */

export interface EmailFilterResult {
  shouldProcess: boolean;
  reason?: string;
  category?: 'newsletter' | 'auto-reply' | 'notification' | 'spam' | 'system';
}

export class EmailFilterService {
  private static instance: EmailFilterService;

  public static getInstance(): EmailFilterService {
    if (!EmailFilterService.instance) {
      EmailFilterService.instance = new EmailFilterService();
    }
    return EmailFilterService.instance;
  }

  /**
   * Check if email should be processed by AI
   */
  async shouldProcessEmail(emailData: {
    from: string;
    subject: string;
    body: string;
    headers?: Record<string, any>;
  }): Promise<EmailFilterResult> {
    
    // Check for newsletters
    if (this.isNewsletter(emailData)) {
      return {
        shouldProcess: false,
        reason: 'Newsletter or marketing email detected',
        category: 'newsletter'
      };
    }

    // Check for auto-reply messages
    if (this.isAutoReply(emailData)) {
      return {
        shouldProcess: false,
        reason: 'Auto-reply message detected',
        category: 'auto-reply'
      };
    }

    // Check for system notifications
    if (this.isSystemNotification(emailData)) {
      return {
        shouldProcess: false,
        reason: 'System notification detected',
        category: 'notification'
      };
    }

    // Check for support ticket auto-replies
    if (this.isSupportTicketAutoReply(emailData)) {
      return {
        shouldProcess: false,
        reason: 'Support ticket auto-reply detected',
        category: 'auto-reply'
      };
    }

    return {
      shouldProcess: true
    };
  }

  /**
   * Detect newsletter/marketing emails
   */
  private isNewsletter(emailData: any): boolean {
    const { from, subject, body, headers } = emailData;

    // Check for unsubscribe links (strong indicator of newsletters)
    const unsubscribePatterns = [
      /unsubscribe/i,
      /opt.out/i,
      /remove.*list/i,
      /manage.*preferences/i,
      /update.*subscription/i
    ];

    if (unsubscribePatterns.some(pattern => pattern.test(body))) {
      return true;
    }

    // Check for newsletter-specific headers
    if (headers) {
      const listHeaders = [
        'List-Unsubscribe',
        'List-Subscribe',
        'List-ID',
        'List-Post',
        'Precedence'
      ];

      if (listHeaders.some(header => headers[header])) {
        return true;
      }

      // Check for bulk/marketing precedence
      if (headers['Precedence']?.toLowerCase().includes('bulk')) {
        return true;
      }
    }

    // Check for common newsletter/marketing keywords in subject
    const newsletterSubjectPatterns = [
      /newsletter/i,
      /weekly.*digest/i,
      /monthly.*update/i,
      /special.*offer/i,
      /limited.*time/i,
      /don't.*miss/i,
      /exclusive.*deal/i,
      /flash.*sale/i,
      /save.*\d+%/i
    ];

    if (newsletterSubjectPatterns.some(pattern => pattern.test(subject))) {
      return true;
    }

    // Check for common newsletter sender patterns
    const newsletterFromPatterns = [
      /no.?reply/i,
      /newsletter/i,
      /marketing/i,
      /notifications?/i,
      /updates?/i,
      /promo/i,
      /offers?/i
    ];

    if (newsletterFromPatterns.some(pattern => pattern.test(from))) {
      return true;
    }

    return false;
  }

  /**
   * Detect auto-reply messages (vacation, out-of-office)
   */
  private isAutoReply(emailData: any): boolean {
    const { subject, body, headers } = emailData;

    // Check headers for auto-reply indicators
    if (headers) {
      // Standard auto-reply headers
      if (headers['Auto-Submitted'] && 
          headers['Auto-Submitted'].toLowerCase() !== 'no') {
        return true;
      }

      if (headers['X-Auto-Response-Suppress']) {
        return true;
      }

      // Check for precedence: auto_reply
      if (headers['Precedence']?.toLowerCase() === 'auto_reply') {
        return true;
      }
    }

    // Check subject for auto-reply patterns
    const autoReplySubjectPatterns = [
      /out.?of.?office/i,
      /away.?from.?office/i,
      /vacation/i,
      /auto.?reply/i,
      /automatic.?reply/i,
      /i.?am.?currently/i,
      /will.?be.?back/i,
      /currently.?unavailable/i,
      /away.?until/i,
      /on.?leave/i,
      /not.?in.?office/i
    ];

    if (autoReplySubjectPatterns.some(pattern => pattern.test(subject))) {
      return true;
    }

    // Check body for auto-reply content
    const autoReplyBodyPatterns = [
      /thank you for your (email|message)/i,
      /i am currently (out of|away from)/i,
      /i will be back/i,
      /automatic(ally)? generated/i,
      /this is an auto(matic)? reply/i,
      /currently unavailable/i,
      /away from my desk/i,
      /on vacation/i,
      /will respond when i return/i,
      /limited access to email/i
    ];

    if (autoReplyBodyPatterns.some(pattern => pattern.test(body))) {
      return true;
    }

    return false;
  }

  /**
   * Detect system notifications
   */
  private isSystemNotification(emailData: any): boolean {
    const { from, subject, body } = emailData;

    // Check for common system notification senders
    const systemFromPatterns = [
      /no.?reply/i,
      /system/i,
      /admin/i,
      /notification/i,
      /alert/i,
      /daemon/i,
      /mailer.?daemon/i,
      /postmaster/i,
      /root@/i,
      /system@/i,
      /alerts?@/i,
      /notifications?@/i
    ];

    if (systemFromPatterns.some(pattern => pattern.test(from))) {
      return true;
    }

    // Check for system notification subjects
    const systemSubjectPatterns = [
      /delivery.*failure/i,
      /mail.*delivery.*failed/i,
      /undelivered.*mail/i,
      /returned.*mail/i,
      /mail.*system.*error/i,
      /server.*notification/i,
      /system.*alert/i,
      /backup.*completed/i,
      /disk.*space/i,
      /security.*alert/i
    ];

    if (systemSubjectPatterns.some(pattern => pattern.test(subject))) {
      return true;
    }

    return false;
  }

  /**
   * Detect support ticket auto-replies
   */
  private isSupportTicketAutoReply(emailData: any): boolean {
    const { from, subject, body } = emailData;

    // Check for support ticket senders
    const supportFromPatterns = [
      /support/i,
      /help.?desk/i,
      /customer.*service/i,
      /ticket/i,
      /case/i
    ];

    // Check for support ticket subjects
    const supportSubjectPatterns = [
      /ticket.*#?\d+/i,
      /case.*#?\d+/i,
      /your.*request/i,
      /support.*request/i,
      /we.*received.*your/i,
      /thank.*you.*for.*contacting/i,
      /reference.*#?\d+/i,
      /incident.*#?\d+/i
    ];

    // Check for support ticket body content
    const supportBodyPatterns = [
      /ticket.*has been.*created/i,
      /reference.*number/i,
      /support.*team.*will.*respond/i,
      /thank.*you.*for.*contacting.*support/i,
      /your.*request.*has been.*received/i,
      /case.*number/i,
      /ticket.*id/i,
      /we.*will.*respond.*within/i
    ];

    const isFromSupport = supportFromPatterns.some(pattern => pattern.test(from));
    const hasTicketSubject = supportSubjectPatterns.some(pattern => pattern.test(subject));
    const hasTicketBody = supportBodyPatterns.some(pattern => pattern.test(body));

    // Consider it a support ticket auto-reply if it matches multiple criteria
    return (isFromSupport && hasTicketSubject) || 
           (isFromSupport && hasTicketBody) || 
           (hasTicketSubject && hasTicketBody);
  }

  /**
   * Get filter statistics for analytics
   */
  async getFilterStats(emails: any[]): Promise<{
    total: number;
    processed: number;
    filtered: number;
    categories: Record<string, number>;
  }> {
    const stats = {
      total: emails.length,
      processed: 0,
      filtered: 0,
      categories: {} as Record<string, number>
    };

    for (const email of emails) {
      const result = await this.shouldProcessEmail(email);
      
      if (result.shouldProcess) {
        stats.processed++;
      } else {
        stats.filtered++;
        if (result.category) {
          stats.categories[result.category] = (stats.categories[result.category] || 0) + 1;
        }
      }
    }

    return stats;
  }
}

export const emailFilterService = EmailFilterService.getInstance();





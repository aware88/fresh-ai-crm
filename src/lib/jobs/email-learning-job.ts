import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { NotificationService } from '@/lib/services/notification-service';
import { aiNotificationService } from '@/lib/services/ai-notification-service';
import EmailLearningService from '@/lib/email/email-learning-service';

export interface EmailLearningJobProgress {
  jobId: string;
  userId: string;
  organizationId?: string;
  accountId?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalEmails: number;
  processedEmails: number;
  successfulEmails: number;
  failedEmails: number;
  skippedEmails: number;
  startTime: Date;
  endTime?: Date;
  errorMessage?: string;
  results?: any;
}

export class EmailLearningJobService {
  private notificationService: NotificationService;
  private static activeJobs = new Map<string, EmailLearningJobProgress>();

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Start a background email learning job
   */
  async startEmailLearningJob(
    userId: string,
    options: {
      maxEmails?: number;
      daysBack?: number;
      organizationId?: string;
      accountId?: string;
    } = {}
  ): Promise<{ jobId: string; message: string }> {
    const jobId = `email-learning-${userId}-${Date.now()}`;
    const { maxEmails = 1000, daysBack = 90, organizationId, accountId } = options;

    // Check if user already has a running job
    const existingJob = Array.from(EmailLearningJobService.activeJobs.values())
      .find(job => job.userId === userId && job.status === 'processing');

    if (existingJob) {
      return {
        jobId: existingJob.jobId,
        message: 'Email learning job is already running'
      };
    }

    // Create job progress entry
    const jobProgress: EmailLearningJobProgress = {
      jobId,
      userId,
      organizationId,
      accountId,
      status: 'queued',
      totalEmails: 0,
      processedEmails: 0,
      successfulEmails: 0,
      failedEmails: 0,
      skippedEmails: 0,
      startTime: new Date()
    };

    EmailLearningJobService.activeJobs.set(jobId, jobProgress);

    // Store job in database for persistence
    await this.saveJobProgress(jobProgress);

    // Start the job in background (don't await)
    this.processEmailLearningJob(jobId, { maxEmails, daysBack, organizationId, accountId })
      .catch(error => {
        console.error(`[EmailLearningJob] Error processing job ${jobId}:`, error);
      });

    return {
      jobId,
      message: 'Email learning job started in background'
    };
  }

  /**
   * Get job progress
   */
  async getJobProgress(jobId: string): Promise<EmailLearningJobProgress | null> {
    // First check in-memory
    const inMemoryJob = EmailLearningJobService.activeJobs.get(jobId);
    if (inMemoryJob) {
      return inMemoryJob;
    }

    // Check database
    return await this.loadJobProgress(jobId);
  }

  /**
   * Get active jobs for a user
   */
  async getUserActiveJobs(userId: string): Promise<EmailLearningJobProgress[]> {
    const inMemoryJobs = Array.from(EmailLearningJobService.activeJobs.values())
      .filter(job => job.userId === userId);

    if (inMemoryJobs.length > 0) {
      return inMemoryJobs;
    }

    // Check database for recent jobs
    const supabase = await createLazyServerClient();
    const { data: jobs, error } = await supabase
      .from('email_learning_jobs')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !jobs) {
      return [];
    }

    return jobs.map(job => ({
      jobId: job.id,
      userId: job.user_id,
      organizationId: job.organization_id,
      status: job.status,
      totalEmails: job.total_emails || 0,
      processedEmails: job.processed_emails || 0,
      successfulEmails: job.successful_emails || 0,
      failedEmails: job.failed_emails || 0,
      skippedEmails: job.skipped_emails || 0,
      startTime: new Date(job.created_at),
      endTime: job.completed_at ? new Date(job.completed_at) : undefined,
      errorMessage: job.error_message,
      results: job.results
    }));
  }

  /**
   * Process the email learning job
   */
  private async processEmailLearningJob(
    jobId: string,
    options: {
      maxEmails: number;
      daysBack: number;
      organizationId?: string;
      accountId?: string;
    }
  ): Promise<void> {
    const job = EmailLearningJobService.activeJobs.get(jobId);
    if (!job) {
      console.error(`[EmailLearningJob] Job ${jobId} not found`);
      return;
    }

    try {
      // Update status to processing
      job.status = 'processing';
      await this.saveJobProgress(job);

      const supabase = await createLazyServerClient();
      const { maxEmails, daysBack, organizationId, accountId } = options;

      console.log(`[EmailLearningJob] Starting job ${jobId} for user ${job.userId}`);

      // Get user's organization if not provided
      let finalOrganizationId = organizationId;
      if (!finalOrganizationId) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('current_organization_id')
          .eq('user_id', job.userId)
          .single();
        finalOrganizationId = preferences?.current_organization_id;
      }

      // Fetch emails to process from email_index (the new optimized structure)
      // First get user's email accounts
      let emailAccountsQuery = supabase
        .from('email_accounts')
        .select('id')
        .eq('user_id', job.userId)
        .eq('is_active', true);

      // Filter by specific account if provided
      if (accountId) {
        emailAccountsQuery = emailAccountsQuery.eq('id', accountId);
      }

      const { data: emailAccounts, error: accountsError } = await emailAccountsQuery;

      if (accountsError || !emailAccounts || emailAccounts.length === 0) {
        console.log(`[Job ${job.jobId}] No active email accounts found for user ${job.userId}`);
        job.status = 'completed';
        job.endTime = new Date();
        job.totalEmails = 0;
        job.successfulEmails = 0;
        job.failedEmails = 0;
        await this.saveJobProgress(job);
        await this.sendCompletionNotification(job, 'success', 'No active email accounts found');
        return;
      }

      const accountIds = emailAccounts.map(acc => acc.id);

      // Fetch emails from email_index table
      let emailQuery = supabase
        .from('email_index')
        .select('id, message_id, subject, received_at, sender_email')
        .in('email_account_id', accountIds);

      // Apply date filter
      if (daysBack > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        emailQuery = emailQuery.gte('received_at', cutoffDate.toISOString());
      }

      // Apply limit and order
      emailQuery = emailQuery
        .order('received_at', { ascending: false })
        .limit(maxEmails);

      const { data: emails, error: emailsError } = await emailQuery;

      if (emailsError) {
        throw new Error(`Failed to fetch emails: ${emailsError.message}`);
      }

      if (!emails || emails.length === 0) {
        job.status = 'completed';
        job.endTime = new Date();
        job.totalEmails = 0;
        await this.saveJobProgress(job);
        await this.sendCompletionNotification(job, 'success', 'No emails found to process');
        return;
      }

      job.totalEmails = emails.length;
      await this.saveJobProgress(job);

      console.log(`[EmailLearningJob] Found ${emails.length} emails to process`);

      // Check for already processed emails using message_id
      const messageIds = emails.map(email => email.message_id);
      let alreadyProcessedEmails: string[] = [];

      try {
        const { data: cachedEmails } = await supabase
          .from('email_ai_cache')
          .select('message_id')
          .in('message_id', messageIds);
        
        if (cachedEmails) {
          alreadyProcessedEmails = cachedEmails.map(item => item.message_id);
        }
      } catch (error) {
        console.log('[EmailLearningJob] Cache table not available, will process all emails');
      }

      const emailsToProcess = messageIds.filter(messageId => !alreadyProcessedEmails.includes(messageId));
      job.skippedEmails = alreadyProcessedEmails.length;
      await this.saveJobProgress(job);

      if (emailsToProcess.length === 0) {
        job.status = 'completed';
        job.endTime = new Date();
        job.processedEmails = 0;
        job.successfulEmails = 0;
        job.failedEmails = 0;
        await this.saveJobProgress(job);
        await this.sendCompletionNotification(job, 'success', 'All emails are already processed');
        return;
      }

      // Process emails in batches with progress updates
      const learningService = new EmailLearningService();
      const batchSize = 10;
      let totalSuccessful = 0;
      let totalFailed = 0;

      for (let i = 0; i < emailsToProcess.length; i += batchSize) {
        const batch = emailsToProcess.slice(i, i + batchSize);
        
        try {
          const result = await learningService.processEmailsBatch(batch, job.userId, finalOrganizationId, accountId);
          totalSuccessful += result.successful;
          totalFailed += result.failed;

          // Update progress
          job.processedEmails = Math.min(i + batchSize, emailsToProcess.length);
          job.successfulEmails = totalSuccessful;
          job.failedEmails = totalFailed;
          await this.saveJobProgress(job);

          console.log(`[EmailLearningJob] Processed batch ${i + 1}-${Math.min(i + batchSize, emailsToProcess.length)} of ${emailsToProcess.length}`);

          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`[EmailLearningJob] Error processing batch:`, error);
          totalFailed += batch.length;
          job.processedEmails = Math.min(i + batchSize, emailsToProcess.length);
          job.failedEmails = totalFailed;
          await this.saveJobProgress(job);
        }
      }

      // Job completed
      job.status = 'completed';
      job.endTime = new Date();
      job.processedEmails = emailsToProcess.length;
      job.successfulEmails = totalSuccessful;
      job.failedEmails = totalFailed;
      job.results = {
        totalEmails: emails.length,
        alreadyProcessed: alreadyProcessedEmails.length,
        needProcessing: emailsToProcess.length,
        successful: totalSuccessful,
        failed: totalFailed,
        processingTime: job.endTime.getTime() - job.startTime.getTime()
      };

      await this.saveJobProgress(job);

      // Send enhanced completion notification
      const success = totalFailed === 0 || (totalSuccessful > 0 && totalFailed < totalSuccessful);
      
      // Get learning stats for enhanced notification
      const supabaseClient = await createLazyServerClient();
      const { data: patterns } = await supabaseClient
        .from('email_patterns')
        .select('pattern_type, confidence')
        .eq('user_id', job.userId);
      
      const patternsLearned = patterns?.length || 0;
      const avgConfidence = patterns && patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
        : 0;
      
      // Send enhanced notification with emotional hooks
      if (success && job.processedEmails > 0) {
        await aiNotificationService.sendInitialLearningComplete(
          job.userId,
          job.organizationId || '',
          {
            patternsLearned,
            confidenceScore: avgConfidence,
            emailsProcessed: job.processedEmails,
            responseTemplates: patternsLearned,
            languagesDetected: ['en'], // TODO: Detect actual languages
            processingTimeMs: job.endTime ? job.endTime.getTime() - job.startTime.getTime() : 0
          }
        );
      } else {
        // Fallback to basic notification for errors
        await this.sendCompletionNotification(
          job, 
          success ? 'success' : 'warning',
          `Processed ${totalSuccessful} emails successfully${totalFailed > 0 ? `, ${totalFailed} failed` : ''}`
        );
      }

      console.log(`[EmailLearningJob] Job ${jobId} completed: ${totalSuccessful} successful, ${totalFailed} failed`);

    } catch (error) {
      console.error(`[EmailLearningJob] Job ${jobId} failed:`, error);
      
      job.status = 'failed';
      job.endTime = new Date();
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.saveJobProgress(job);

      await this.sendCompletionNotification(job, 'error', `Email learning failed: ${job.errorMessage}`);
    } finally {
      // Clean up from memory after 5 minutes
      setTimeout(() => {
        EmailLearningJobService.activeJobs.delete(jobId);
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Save job progress to database
   */
  private async saveJobProgress(job: EmailLearningJobProgress): Promise<void> {
    try {
      const supabase = await createLazyServerClient();
      
      const jobData = {
        id: job.jobId,
        user_id: job.userId,
        organization_id: job.organizationId,
        status: job.status,
        total_emails: job.totalEmails,
        processed_emails: job.processedEmails,
        successful_emails: job.successfulEmails,
        failed_emails: job.failedEmails,
        skipped_emails: job.skippedEmails,
        error_message: job.errorMessage,
        results: job.results,
        completed_at: job.endTime?.toISOString(),
        created_at: job.startTime.toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('email_learning_jobs')
        .upsert(jobData);
    } catch (error) {
      console.error('[EmailLearningJob] Error saving job progress:', error);
    }
  }

  /**
   * Load job progress from database
   */
  private async loadJobProgress(jobId: string): Promise<EmailLearningJobProgress | null> {
    try {
      const supabase = await createLazyServerClient();
      
      const { data: job, error } = await supabase
        .from('email_learning_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !job) {
        return null;
      }

      return {
        jobId: job.id,
        userId: job.user_id,
        organizationId: job.organization_id,
        status: job.status,
        totalEmails: job.total_emails || 0,
        processedEmails: job.processed_emails || 0,
        successfulEmails: job.successful_emails || 0,
        failedEmails: job.failed_emails || 0,
        skippedEmails: job.skipped_emails || 0,
        startTime: new Date(job.created_at),
        endTime: job.completed_at ? new Date(job.completed_at) : undefined,
        errorMessage: job.error_message,
        results: job.results
      };
    } catch (error) {
      console.error('[EmailLearningJob] Error loading job progress:', error);
      return null;
    }
  }

  /**
   * Send completion notification to user
   */
  private async sendCompletionNotification(
    job: EmailLearningJobProgress,
    type: 'success' | 'error' | 'warning',
    message: string
  ): Promise<void> {
    try {
      await this.notificationService.createNotification({
        user_id: job.userId,
        organization_id: job.organizationId || '',
        title: 'Email Learning Complete',
        message,
        type: type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning',
        action_url: '/settings/learning',
        metadata: {
          jobId: job.jobId,
          totalEmails: job.totalEmails,
          processedEmails: job.processedEmails,
          successfulEmails: job.successfulEmails,
          failedEmails: job.failedEmails,
          processingTime: job.endTime ? job.endTime.getTime() - job.startTime.getTime() : 0
        }
      });
    } catch (error) {
      console.error('[EmailLearningJob] Error sending notification:', error);
    }
  }
}

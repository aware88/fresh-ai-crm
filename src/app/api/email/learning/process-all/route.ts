import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import EmailLearningService from '@/lib/email/email-learning-service';

/**
 * POST /api/email/learning/process-all
 * 
 * Process all user emails to generate background drafts (your requested workflow)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get request parameters
    const body = await request.json();
    const { 
      maxEmails = 1000,
      daysBack = 90,
      organizationId 
    } = body;

    console.log(`[API] Starting process-all for user ${userId}: ${maxEmails} emails, ${daysBack} days back`);

    // Get user's organization if not provided
    let finalOrganizationId = organizationId;
    if (!finalOrganizationId) {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('current_organization_id')
        .eq('user_id', userId)
        .single();
      finalOrganizationId = preferences?.current_organization_id;
    }

    // Fetch emails to process from email_index (the new optimized structure)
    // First get user's email accounts
    const { data: emailAccounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (accountsError || !emailAccounts || emailAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active email accounts found',
        results: {
          totalEmails: 0,
          successful: 0,
          failed: 0,
          processingTime: 0
        }
      });
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
      return NextResponse.json({
        success: true,
        message: 'No emails found to process',
        results: {
          totalEmails: 0,
          successful: 0,
          failed: 0,
          processingTime: 0
        }
      });
    }

    console.log(`[API] Found ${emails.length} emails to process`);

    // SMART FILTERING: Check which emails already have AI analysis/drafts
    console.log(`[API] Checking which emails are already processed...`);
    
    // Get list of message IDs (using message_id from email_index)
    const messageIds = emails.map(email => email.message_id);
    
    // Check database cache first using message_id
    let alreadyProcessedEmails: string[] = [];
    try {
      const { data: cachedEmails, error: cacheError } = await supabase
        .from('email_ai_cache')
        .select('message_id')
        .in('message_id', messageIds);
      
      if (!cacheError && cachedEmails) {
        alreadyProcessedEmails = cachedEmails.map(item => item.message_id);
        console.log(`[API] Found ${alreadyProcessedEmails.length} emails already processed in database cache`);
      }
    } catch (error) {
      console.log('[API] Database cache table not available, will check individual email status');
    }

    // Also check if emails have existing drafts in the learning service
    // This catches emails that were processed before the cache table was created
    if (alreadyProcessedEmails.length === 0) {
      console.log('[API] No database cache found, checking individual email status...');
      
      // Check a sample of emails to see if they have existing drafts
      const sampleEmails = messageIds.slice(0, 10); // Check first 10 message IDs
      const learningService = new EmailLearningService();
      
      for (const messageId of sampleEmails) {
        try {
          const existingDraft = await learningService.getExistingDraft(messageId, userId);
          if (existingDraft && existingDraft.status === 'ready') {
            alreadyProcessedEmails.push(messageId);
          }
        } catch (error) {
          // Continue checking other emails
        }
      }
      
      if (alreadyProcessedEmails.length > 0) {
        console.log(`[API] Found ${alreadyProcessedEmails.length} emails with existing drafts (sample check)`);
        // Extrapolate: if 10% of sample has drafts, assume similar ratio for all
        const estimatedProcessed = Math.floor((alreadyProcessedEmails.length / sampleEmails.length) * messageIds.length);
        console.log(`[API] Estimating ${estimatedProcessed} total emails already processed`);
      }
    }

    // Filter out already processed emails using message_id
    const emailsToProcess = messageIds.filter(messageId => !alreadyProcessedEmails.includes(messageId));
    
    console.log(`[API] Smart filtering results:`);
    console.log(`  - Total emails found: ${emails.length}`);
    console.log(`  - Already processed: ${alreadyProcessedEmails.length}`);
    console.log(`  - Need processing: ${emailsToProcess.length}`);
    console.log(`  - Skipping already processed emails to save time and API calls`);

    if (emailsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All emails are already processed!',
        results: {
          totalEmails: emails.length,
          alreadyProcessed: alreadyProcessedEmails.length,
          needProcessing: 0,
          successful: 0,
          failed: 0,
          processingTime: 0,
          skipped: alreadyProcessedEmails.length
        }
      });
    }

    // Initialize learning service
    const learningService = new EmailLearningService();
    const startTime = Date.now();

    // Process only the emails that need processing
    const result = await learningService.processEmailsBatch(emailsToProcess, userId, finalOrganizationId);

    const processingTime = Date.now() - startTime;

    console.log(`[API] Process-all completed: ${result.successful} successful, ${result.failed} failed in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'Email processing completed',
      results: {
        totalEmails: emails.length,
        alreadyProcessed: alreadyProcessedEmails.length,
        needProcessing: emailsToProcess.length,
        successful: result.successful,
        failed: result.failed,
        processingTime,
        skipped: alreadyProcessedEmails.length,
        details: result.results
      }
    });

  } catch (error) {
    console.error('[API] Error in process-all:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/learning/process-all/status
 * 
 * Get processing status (for future implementation of progress tracking)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For now, just return that no processing is running
    // In the future, you could track processing status in memory or database
    return NextResponse.json({
      success: true,
      status: {
        isProcessing: false,
        message: 'No background processing currently running'
      }
    });

  } catch (error) {
    console.error('[API] Error getting process-all status:', error);
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    );
  }
}



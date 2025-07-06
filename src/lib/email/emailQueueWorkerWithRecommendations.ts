/**
 * Email Queue Worker With Product Recommendations
 * 
 * This module extends the email queue worker to include product recommendations
 * in the email processing workflow.
 */

import { createServerClient } from '@/lib/supabase/server';
import { getNextEmailToProcess, EmailQueueStatus } from './emailQueueService';
import { processQueuedEmailWithRecommendations } from './emailQueueServiceWithRecommendations';

/**
 * Process the next batch of emails in the queue with product recommendations
 * @param batchSize Number of emails to process in this batch
 * @param userId ID of the user running the worker
 * @param organizationId Optional organization ID for multi-tenant support
 * @returns Processing results
 */
export async function processEmailQueueWithRecommendations(
  batchSize: number = 10,
  userId: string,
  organizationId?: string
) {
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    requiresReview: 0,
    withRecommendations: 0,
    details: [] as any[]
  };
  
  // Process up to batchSize emails
  for (let i = 0; i < batchSize; i++) {
    try {
      // Get the next email to process
      const queueItem = await getNextEmailToProcess(userId, organizationId);
      
      // If no more emails to process, break
      if (!queueItem) {
        break;
      }
      
      // Process the email with recommendations
      const result = await processQueuedEmailWithRecommendations(queueItem.id, userId);
      results.processed++;
      
      // Track the result
      if (result.status === EmailQueueStatus.COMPLETED) {
        results.succeeded++;
        // Check if recommendations were added
        if (result.metadata?.product_recommendations) {
          results.withRecommendations++;
        }
      } else if (result.status === EmailQueueStatus.REQUIRES_REVIEW) {
        results.requiresReview++;
      } else if (result.status === EmailQueueStatus.FAILED) {
        results.failed++;
      }
      
      results.details.push({
        id: queueItem.id,
        emailId: queueItem.email_id,
        status: result.status,
        success: result.status !== EmailQueueStatus.FAILED,
        hasRecommendations: !!result.metadata?.product_recommendations
      });
    } catch (error) {
      console.error('Error processing email queue item:', error);
      results.failed++;
      results.details.push({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }
  
  return results;
}

// Re-export other functions from the original worker
export { getQueueStatistics, resetFailedQueueItems, cleanupOldQueueItems } from './emailQueueWorker';

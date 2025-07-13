/**
 * Email Queue Worker
 * 
 * This module provides a background worker for processing emails in the queue.
 * It can be run as a scheduled task or triggered manually.
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { getNextEmailToProcess, processQueuedEmail, EmailQueueStatus } from './emailQueueService';

/**
 * Process the next batch of emails in the queue
 * @param batchSize Number of emails to process in this batch
 * @param userId ID of the user running the worker
 * @param organizationId Optional organization ID for multi-tenant support
 * @returns Processing results
 */
export async function processEmailQueue(
  batchSize: number = 10,
  userId: string,
  organizationId?: string
) {
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    requiresReview: 0,
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
      
      // Process the email
      const result = await processQueuedEmail(queueItem.id, userId);
      results.processed++;
      
      // Track the result
      if (result.status === EmailQueueStatus.COMPLETED) {
        results.succeeded++;
      } else if (result.status === EmailQueueStatus.REQUIRES_REVIEW) {
        results.requiresReview++;
      } else if (result.status === EmailQueueStatus.FAILED) {
        results.failed++;
      }
      
      results.details.push({
        id: queueItem.id,
        emailId: queueItem.email_id,
        status: result.status,
        success: result.status !== EmailQueueStatus.FAILED
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

/**
 * Get queue statistics
 * @param userId ID of the user requesting statistics
 * @param organizationId Optional organization ID for multi-tenant support
 * @returns Queue statistics
 */
export async function getQueueStatistics(userId: string, organizationId?: string) {
  const supabase = await createLazyServerClient();
  
  // Build the base query
  let baseQuery = supabase.from('email_queue');
  
  // Add organization filter if provided
  if (organizationId) {
    baseQuery = baseQuery.eq('organization_id', organizationId);
  }
  
  // Get counts for each status
  const [pendingResult, processingResult, completedResult, failedResult, reviewResult] = await Promise.all([
    baseQuery.select('id', { count: 'exact', head: true }).eq('status', EmailQueueStatus.PENDING),
    baseQuery.select('id', { count: 'exact', head: true }).eq('status', EmailQueueStatus.PROCESSING),
    baseQuery.select('id', { count: 'exact', head: true }).eq('status', EmailQueueStatus.COMPLETED),
    baseQuery.select('id', { count: 'exact', head: true }).eq('status', EmailQueueStatus.FAILED),
    baseQuery.select('id', { count: 'exact', head: true }).eq('status', EmailQueueStatus.REQUIRES_REVIEW)
  ]);
  
  // Get priority distribution
  const { data: priorityData } = await supabase
    .from('email_queue')
    .select('priority')
    .eq('status', EmailQueueStatus.PENDING);
  
  const priorityDistribution = (priorityData || []).reduce((acc: Record<string, number>, item: any) => {
    acc[item.priority] = (acc[item.priority] || 0) + 1;
    return acc;
  }, {});
  
  return {
    pending: pendingResult.count || 0,
    processing: processingResult.count || 0,
    completed: completedResult.count || 0,
    failed: failedResult.count || 0,
    requiresReview: reviewResult.count || 0,
    total: (pendingResult.count || 0) + 
           (processingResult.count || 0) + 
           (completedResult.count || 0) + 
           (failedResult.count || 0) + 
           (reviewResult.count || 0),
    priorityDistribution
  };
}

/**
 * Reset failed queue items to pending status
 * @param userId ID of the user resetting the queue
 * @param organizationId Optional organization ID for multi-tenant support
 * @param maxAttempts Only reset items with fewer than this many attempts
 * @returns Number of items reset
 */
export async function resetFailedQueueItems(
  userId: string,
  organizationId?: string,
  maxAttempts: number = 3
) {
  const supabase = await createLazyServerClient();
  
  // Build the query
  let query = supabase
    .from('email_queue')
    .update({
      status: EmailQueueStatus.PENDING,
      updated_at: new Date().toISOString()
    })
    .eq('status', EmailQueueStatus.FAILED)
    .lt('processing_attempts', maxAttempts);
  
  // Add organization filter if provided
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  // Reset the items
  const { data, error } = await query;
  
  if (error) {
    console.error('Error resetting failed queue items:', error);
    throw error;
  }
  
  return data?.length || 0;
}

/**
 * Clean up old completed queue items
 * @param userId ID of the user cleaning the queue
 * @param organizationId Optional organization ID for multi-tenant support
 * @param olderThanDays Remove items older than this many days
 * @returns Number of items removed
 */
export async function cleanupOldQueueItems(
  userId: string,
  organizationId?: string,
  olderThanDays: number = 30
) {
  const supabase = await createLazyServerClient();
  
  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  // Build the query
  let query = supabase
    .from('email_queue')
    .delete()
    .in('status', [EmailQueueStatus.COMPLETED, EmailQueueStatus.APPROVED])
    .lt('updated_at', cutoffDate.toISOString());
  
  // Add organization filter if provided
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  // Delete the items
  const { data, error } = await query;
  
  if (error) {
    console.error('Error cleaning up old queue items:', error);
    throw error;
  }
  
  return data?.length || 0;
}

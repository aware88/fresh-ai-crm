/**
 * Email Queue Service With Product Recommendations
 * 
 * This module extends the email queue service to include product recommendations
 * in the email processing workflow.
 */

import { createServerClient } from '@/lib/supabase/server';
import { 
  processQueuedEmail as baseProcessQueuedEmail,
  EmailQueueStatus 
} from './emailQueueService';
import { ProductRecommendationService } from '@/services/product-recommendation';

/**
 * Process an email in the queue with product recommendations
 * @param queueItemId ID of the queue item to process
 * @param userId ID of the user processing the email
 * @returns The processed queue item with product recommendations
 */
export async function processQueuedEmailWithRecommendations(queueItemId: string, userId: string) {
  const supabase = await createServerClient();
  
  try {
    // Get the queue item with email data
    const { data: queueItem, error } = await supabase
      .from('email_queue')
      .select('*, emails(*)')
      .eq('id', queueItemId)
      .single();
    
    if (error || !queueItem) {
      console.error('Error getting queue item:', error);
      throw error || new Error('Queue item not found');
    }
    
    // Process the email using the base function
    const processedItem = await baseProcessQueuedEmail(queueItemId, userId);
    
    // If processing failed or requires review, return the result as is
    if (processedItem.status === EmailQueueStatus.FAILED ||
        processedItem.status === EmailQueueStatus.REQUIRES_REVIEW) {
      return processedItem;
    }
    
    // Get product recommendations based on email content
    const recommendationService = new ProductRecommendationService();
    const emailContent = queueItem.emails?.content || '';
    const contactId = queueItem.contact_id;
    
    try {
      const recommendations = await recommendationService.recommendProductsFromEmail(
        emailContent,
        contactId,
        3 // Limit to 3 recommendations
      );
      
      // Update the queue item with product recommendations
      const { data: updatedItem, error: updateError } = await supabase
        .from('email_queue')
        .update({
          metadata: supabase.rpc('jsonb_set_nested', { 
            json_data: processedItem.metadata || {},
            path: 'product_recommendations',
            new_value: JSON.stringify(recommendations)
          })
        })
        .eq('id', queueItemId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating queue item with recommendations:', updateError);
        // Continue with the process even if updating recommendations fails
      }
      
      return updatedItem || processedItem;
    } catch (recError) {
      console.error('Error getting product recommendations:', recError);
      // Continue with the process even if getting recommendations fails
      return processedItem;
    }
  } catch (error) {
    console.error('Error processing queue item with recommendations:', error);
    
    // Update the queue item status to failed
    const { error: updateError } = await supabase
      .from('email_queue')
      .update({
        status: EmailQueueStatus.FAILED,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', queueItemId);
    
    if (updateError) {
      console.error('Error updating queue item status:', updateError);
    }
    
    throw error;
  }
}

/**
 * Get personalized product recommendations for a contact
 * @param contactId ID of the contact
 * @param limit Maximum number of recommendations to get
 * @returns Product recommendations
 */
export async function getPersonalizedRecommendations(contactId: string, limit: number = 3) {
  const recommendationService = new ProductRecommendationService();
  return recommendationService.getPersonalizedRecommendations(contactId, limit);
}

/**
 * Get frequently bought together products
 * @param productId ID of the product
 * @param limit Maximum number of recommendations to get
 * @returns Product recommendations
 */
export async function getFrequentlyBoughtTogether(productId: string, limit: number = 3) {
  const recommendationService = new ProductRecommendationService();
  return recommendationService.getFrequentlyBoughtTogether(productId, limit);
}

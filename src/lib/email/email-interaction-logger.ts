/**
 * Email Interaction Logger
 * 
 * Service for logging email interactions for AI training and personality profiling
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { AIProcessingResult } from '@/lib/ai/ai-hub-service';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface EmailInteractionLog {
  id?: string;
  organization_id: string;
  email_id: string;
  contact_id?: string;
  interaction_type: 'received' | 'sent' | 'classified' | 'processed' | 'reviewed';
  
  // Email content data
  email_subject: string;
  email_content: string;
  sender_email: string;
  recipient_email: string;
  
  // AI processing data
  ai_classification?: {
    type: string;
    confidence: number;
    reasoning: string;
    urgency: string;
    sentiment: string;
    extracted_entities: any;
  };
  
  ai_response?: {
    response_content: string;
    confidence: number;
    reasoning: string;
    response_id?: string;
    processing_time_ms: number;
  };
  
  // Product matching data
  product_matches?: {
    matches: any[];
    car_specification?: any;
    upsell_opportunities?: any[];
    matching_confidence: number;
  };
  
  // Conversation context
  conversation_context?: {
    previous_emails: number;
    conversation_length: number;
    avg_response_time: number;
    communication_pattern: string;
  };
  
  // User behavior data
  user_behavior?: {
    human_override?: boolean;
    human_feedback?: string;
    response_rating?: number;
    final_action_taken?: string;
    customer_reply_received?: boolean;
    customer_satisfaction?: number;
  };
  
  // Metadata
  metadata?: {
    processing_delay_minutes?: number;
    requires_human_review?: boolean;
    priority_level?: string;
    tags?: string[];
    customer_journey_stage?: string;
    [key: string]: any;
  };
  
  created_at?: string;
  updated_at?: string;
  created_by: string;
}

export class EmailInteractionLogger {
  private supabase: ReturnType<typeof createLazyServerClient>;

  constructor() {
    this.supabase = createLazyServerClient();
  }

  // Helper method to get the awaited Supabase client
  private async getSupabase(): Promise<SupabaseClient> {
    return await this.supabase;
  }

  /**
   * Log an email interaction
   */
  async logInteraction(log: EmailInteractionLog): Promise<string> {
    console.log(`[Email Logger] Logging ${log.interaction_type} interaction for email ${log.email_id}`);

    const supabase = await this.supabase;

    try {
      const { data, error } = await supabase
        .from('email_interaction_logs')
        .insert({
          organization_id: log.organization_id,
          email_id: log.email_id,
          contact_id: log.contact_id,
          interaction_type: log.interaction_type,
          email_subject: log.email_subject,
          email_content: log.email_content,
          sender_email: log.sender_email,
          recipient_email: log.recipient_email,
          ai_classification: log.ai_classification,
          ai_response: log.ai_response,
          product_matches: log.product_matches,
          conversation_context: log.conversation_context,
          user_behavior: log.user_behavior,
          metadata: log.metadata,
          created_by: log.created_by,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      console.log(`[Email Logger] Successfully logged interaction with ID: ${data.id}`);
      return data.id;

    } catch (error) {
      console.error('[Email Logger] Error logging interaction:', error);
      throw error;
    }
  }

  /**
   * Log email classification
   */
  async logEmailClassification(
    emailId: string,
    organizationId: string,
    userId: string,
    emailData: {
      subject: string;
      content: string;
      sender: string;
      recipient: string;
    },
    classification: {
      type: string;
      confidence: number;
      reasoning: string;
      urgency: string;
      sentiment: string;
      extracted_entities: any;
    },
    contactId?: string
  ): Promise<string> {
    return this.logInteraction({
      organization_id: organizationId,
      email_id: emailId,
      contact_id: contactId,
      interaction_type: 'classified',
      email_subject: emailData.subject,
      email_content: emailData.content,
      sender_email: emailData.sender,
      recipient_email: emailData.recipient,
      ai_classification: classification,
      created_by: userId,
      metadata: {
        classification_timestamp: new Date().toISOString(),
        classification_model: 'gpt-4o'
      }
    });
  }

  /**
   * Log AI response generation
   */
  async logAIResponse(
    emailId: string,
    organizationId: string,
    userId: string,
    emailData: {
      subject: string;
      content: string;
      sender: string;
      recipient: string;
    },
    aiResult: AIProcessingResult,
    processingTimeMs: number,
    contactId?: string
  ): Promise<string> {
    return this.logInteraction({
      organization_id: organizationId,
      email_id: emailId,
      contact_id: contactId,
      interaction_type: 'processed',
      email_subject: emailData.subject,
      email_content: emailData.content,
      sender_email: emailData.sender,
      recipient_email: emailData.recipient,
      ai_response: {
        response_content: aiResult.response,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        response_id: aiResult.responseId,
        processing_time_ms: processingTimeMs
      },
      product_matches: aiResult.productRecommendations ? {
        matches: aiResult.productRecommendations,
        upsell_opportunities: aiResult.upsellingSuggestions,
        matching_confidence: aiResult.confidence
      } : undefined,
      created_by: userId,
      metadata: {
        requires_human_review: aiResult.requiresHumanReview,
        estimated_sentiment: aiResult.estimatedSentiment,
        suggested_actions: aiResult.suggestedActions,
        ai_model: 'gpt-4o'
      }
    });
  }

  /**
   * Log human review and feedback
   */
  async logHumanReview(
    emailId: string,
    organizationId: string,
    userId: string,
    feedback: {
      human_override: boolean;
      human_feedback: string;
      response_rating: number;
      final_action_taken: string;
    }
  ): Promise<void> {
    const supabase = await this.supabase;

    try {
      // Update the existing log with human feedback
      const { error } = await supabase
        .from('email_interaction_logs')
        .update({
          user_behavior: feedback,
          updated_at: new Date().toISOString()
        })
        .eq('email_id', emailId)
        .eq('organization_id', organizationId)
        .eq('interaction_type', 'processed');

      if (error) {
        throw error;
      }

      console.log(`[Email Logger] Updated log with human feedback for email ${emailId}`);

    } catch (error) {
      console.error('[Email Logger] Error logging human review:', error);
      throw error;
    }
  }

  /**
   * Log customer reply and satisfaction
   */
  async logCustomerReply(
    originalEmailId: string,
    organizationId: string,
    customerSatisfaction?: number
  ): Promise<void> {
    const supabase = await this.supabase;

    try {
      // Update the original log with customer reply information
      const { error } = await supabase
        .from('email_interaction_logs')
        .update({
          user_behavior: {
            customer_reply_received: true,
            customer_satisfaction: customerSatisfaction
          },
          updated_at: new Date().toISOString()
        })
        .eq('email_id', originalEmailId)
        .eq('organization_id', organizationId);

      if (error) {
        throw error;
      }

      console.log(`[Email Logger] Updated log with customer reply for email ${originalEmailId}`);

    } catch (error) {
      console.error('[Email Logger] Error logging customer reply:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a contact
   */
  async getConversationHistory(
    contactId: string,
    organizationId: string,
    limit: number = 10
  ): Promise<EmailInteractionLog[]> {
    const supabase = await this.supabase;

    try {
      const { data, error } = await supabase
        .from('email_interaction_logs')
        .select('*')
        .eq('contact_id', contactId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('[Email Logger] Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Get analytics data for AI training
   */
  async getAnalyticsData(
    organizationId: string,
    dateRange: {
      start: string;
      end: string;
    },
    limit: number = 1000
  ): Promise<{
    interactions: EmailInteractionLog[];
    stats: {
      total_interactions: number;
      avg_ai_confidence: number;
      human_override_rate: number;
      avg_customer_satisfaction: number;
      common_classifications: any[];
      common_product_matches: any[];
    };
  }> {
    const supabase = await this.supabase;

    try {
      // Get interactions
      const { data: interactions, error } = await supabase
        .from('email_interaction_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Calculate statistics
      const stats = this.calculateAnalyticsStats(interactions || []);

      return {
        interactions: interactions || [],
        stats
      };

    } catch (error) {
      console.error('[Email Logger] Error getting analytics data:', error);
      return {
        interactions: [],
        stats: {
          total_interactions: 0,
          avg_ai_confidence: 0,
          human_override_rate: 0,
          avg_customer_satisfaction: 0,
          common_classifications: [],
          common_product_matches: []
        }
      };
    }
  }

  /**
   * Calculate analytics statistics
   */
  private calculateAnalyticsStats(interactions: EmailInteractionLog[]): any {
    const total = interactions.length;
    
    if (total === 0) {
      return {
        total_interactions: 0,
        avg_ai_confidence: 0,
        human_override_rate: 0,
        avg_customer_satisfaction: 0,
        common_classifications: [],
        common_product_matches: []
      };
    }

    // Calculate average AI confidence
    const aiResponses = interactions.filter(i => i.ai_response);
    const avgAiConfidence = aiResponses.length > 0 
      ? aiResponses.reduce((sum, i) => sum + i.ai_response!.confidence, 0) / aiResponses.length
      : 0;

    // Calculate human override rate
    const humanOverrides = interactions.filter(i => i.user_behavior?.human_override);
    const humanOverrideRate = humanOverrides.length / total;

    // Calculate average customer satisfaction
    const satisfactionRatings = interactions.filter(i => i.user_behavior?.customer_satisfaction);
    const avgCustomerSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, i) => sum + i.user_behavior!.customer_satisfaction!, 0) / satisfactionRatings.length
      : 0;

    // Get common classifications
    const classifications = interactions
      .filter(i => i.ai_classification)
      .map(i => i.ai_classification!.type);
    
    const classificationCounts = classifications.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as any);

    const commonClassifications = Object.entries(classificationCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Get common product matches
    const productMatches = interactions
      .filter(i => i.product_matches?.matches)
      .flatMap(i => i.product_matches!.matches)
      .map((match: any) => match.productName)
      .filter(Boolean);

    const productCounts = productMatches.reduce((acc, product) => {
      acc[product] = (acc[product] || 0) + 1;
      return acc;
    }, {} as any);

    const commonProductMatches = Object.entries(productCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([product, count]) => ({ product, count }));

    return {
      total_interactions: total,
      avg_ai_confidence: avgAiConfidence,
      human_override_rate: humanOverrideRate,
      avg_customer_satisfaction: avgCustomerSatisfaction,
      common_classifications: commonClassifications,
      common_product_matches: commonProductMatches
    };
  }

  /**
   * Export data for AI training
   */
  async exportTrainingData(
    organizationId: string,
    options: {
      includeHumanFeedback?: boolean;
      includeProductMatches?: boolean;
      minConfidence?: number;
      dateRange?: {
        start: string;
        end: string;
      };
    } = {}
  ): Promise<any[]> {
    const supabase = await this.supabase;

    try {
      let query = supabase
        .from('email_interaction_logs')
        .select('*')
        .eq('organization_id', organizationId);

      // Apply filters
      if (options.dateRange) {
        query = query
          .gte('created_at', options.dateRange.start)
          .lte('created_at', options.dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      let trainingData = data || [];

      // Filter by confidence if specified
      if (options.minConfidence !== undefined) {
        trainingData = trainingData.filter(log => 
          log.ai_response && log.ai_response.confidence >= options.minConfidence!
        );
      }

      // Format training data
      return trainingData.map(log => ({
        input: {
          email_subject: log.email_subject,
          email_content: log.email_content,
          sender_context: log.conversation_context,
          organization_settings: log.metadata
        },
        output: {
          classification: log.ai_classification,
          response: log.ai_response,
          product_matches: options.includeProductMatches ? log.product_matches : undefined
        },
        feedback: options.includeHumanFeedback ? log.user_behavior : undefined,
        metadata: {
          interaction_id: log.id,
          email_id: log.email_id,
          contact_id: log.contact_id,
          created_at: log.created_at
        }
      }));

    } catch (error) {
      console.error('[Email Logger] Error exporting training data:', error);
      return [];
    }
  }
} 
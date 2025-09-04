/**
 * Follow-up Machine Learning Service
 * 
 * Provides ML-powered optimization for follow-up timing, content, and success prediction
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { Database } from '@/types/supabase';
import { EmailFollowup } from './follow-up-service';

type SupabaseClient = ReturnType<typeof createLazyServerClient>;

export interface MLPrediction {
  prediction_type: 'response_likelihood' | 'optimal_timing' | 'content_optimization' | 'success_probability';
  confidence: number;
  prediction_value: any;
  reasoning: string;
  factors: Array<{
    factor: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  created_at: string;
}

export interface ResponseLikelihoodPrediction extends MLPrediction {
  prediction_type: 'response_likelihood';
  prediction_value: {
    likelihood_score: number; // 0-1
    response_probability: number; // 0-100%
    expected_response_time: number; // hours
    best_approach: 'gentle' | 'direct' | 'value-add' | 'alternative';
    recommended_tone: 'professional' | 'friendly' | 'urgent' | 'casual';
  };
}

export interface OptimalTimingPrediction extends MLPrediction {
  prediction_type: 'optimal_timing';
  prediction_value: {
    optimal_send_time: string; // ISO timestamp
    day_of_week: number; // 0-6
    hour_of_day: number; // 0-23
    timezone_adjustment: number; // hours offset
    send_score: number; // 0-1
    avoid_times: Array<{
      start_time: string;
      end_time: string;
      reason: string;
    }>;
  };
}

export interface ContentOptimizationPrediction extends MLPrediction {
  prediction_type: 'content_optimization';
  prediction_value: {
    recommended_subject_patterns: string[];
    optimal_length: 'short' | 'medium' | 'long';
    key_phrases: string[];
    avoid_phrases: string[];
    personalization_suggestions: Array<{
      field: string;
      value: string;
      impact_score: number;
    }>;
    cta_recommendations: string[];
  };
}

export interface ContactBehaviorProfile {
  contact_id?: string;
  email_pattern: string; // email domain or pattern
  response_patterns: {
    avg_response_time: number; // hours
    preferred_days: number[]; // 0-6
    preferred_hours: number[]; // 0-23
    response_rate: number; // 0-1
    engagement_score: number; // 0-1
  };
  communication_preferences: {
    preferred_tone: string;
    preferred_length: string;
    responds_to_urgency: boolean;
    likes_personalization: boolean;
    prefers_direct_approach: boolean;
  };
  historical_data: {
    total_emails_received: number;
    total_responses: number;
    avg_time_to_respond: number;
    last_response_date?: string;
    response_quality_score: number;
  };
  industry_context?: {
    industry: string;
    company_size: string;
    business_type: string;
  };
  updated_at: string;
}

export interface MLTrainingData {
  followup_id: string;
  features: {
    // Timing features
    days_since_original: number;
    hour_sent: number;
    day_of_week: number;
    is_business_hours: boolean;
    is_weekend: boolean;
    
    // Content features
    subject_length: number;
    body_length: number;
    tone_score: number; // -1 to 1 (negative to positive)
    urgency_score: number; // 0 to 1
    personalization_score: number; // 0 to 1
    has_cta: boolean;
    question_count: number;
    
    // Context features
    original_priority: string;
    followup_reason: string;
    conversation_length: number;
    sender_relationship: string;
    
    // Recipient features
    domain_category: string; // business, personal, etc.
    previous_response_rate: number;
    avg_response_time: number;
    last_interaction_days: number;
  };
  outcome: {
    received_response: boolean;
    response_time_hours?: number;
    response_quality: 'high' | 'medium' | 'low' | null;
    follow_up_needed: boolean;
  };
  created_at: string;
}

export class FollowUpMLService {
  private supabasePromise: Promise<SupabaseClient>;
  private modelCache: Map<string, any> = new Map();
  private profileCache: Map<string, ContactBehaviorProfile> = new Map();

  constructor() {
    this.supabasePromise = createLazyServerClient();
  }

  /**
   * Get initialized Supabase client
   */
  private async getSupabase(): Promise<SupabaseClient> {
    return await this.supabasePromise;
  }

  /**
   * Predict response likelihood for a follow-up
   */
  async predictResponseLikelihood(
    followup: EmailFollowup,
    contactContext?: any
  ): Promise<ResponseLikelihoodPrediction> {
    try {
      // Get contact behavior profile
      const profile = await this.getContactBehaviorProfile(followup.original_recipients[0]);
      
      // Extract features
      const features = this.extractFeatures(followup, profile, contactContext);
      
      // Calculate response likelihood using heuristic model
      // In production, this would use a trained ML model
      const likelihood = this.calculateResponseLikelihood(features, profile);
      
      // Determine best approach and tone
      const approach = this.recommendApproach(features, profile);
      const tone = this.recommendTone(features, profile);
      
      const prediction: ResponseLikelihoodPrediction = {
        prediction_type: 'response_likelihood',
        confidence: likelihood.confidence,
        prediction_value: {
          likelihood_score: likelihood.score,
          response_probability: likelihood.score * 100,
          expected_response_time: profile?.response_patterns.avg_response_time || 24,
          best_approach: approach,
          recommended_tone: tone
        },
        reasoning: likelihood.reasoning,
        factors: likelihood.factors,
        created_at: new Date().toISOString()
      };

      // Store prediction for learning
      await this.storePrediction(followup.id!, prediction);
      
      return prediction;
    } catch (error) {
      console.error('Error predicting response likelihood:', error);
      
      // Return default prediction
      return {
        prediction_type: 'response_likelihood',
        confidence: 0.5,
        prediction_value: {
          likelihood_score: 0.6,
          response_probability: 60,
          expected_response_time: 24,
          best_approach: 'gentle',
          recommended_tone: 'professional'
        },
        reasoning: 'Default prediction due to error',
        factors: [],
        created_at: new Date().toISOString()
      };
    }
  }

  /**
   * Predict optimal timing for sending follow-up
   */
  async predictOptimalTiming(
    followup: EmailFollowup,
    contactContext?: any
  ): Promise<OptimalTimingPrediction> {
    try {
      const profile = await this.getContactBehaviorProfile(followup.original_recipients[0]);
      
      // Calculate optimal timing
      const timing = this.calculateOptimalTiming(followup, profile);
      
      const prediction: OptimalTimingPrediction = {
        prediction_type: 'optimal_timing',
        confidence: timing.confidence,
        prediction_value: timing.timing,
        reasoning: timing.reasoning,
        factors: timing.factors,
        created_at: new Date().toISOString()
      };

      await this.storePrediction(followup.id!, prediction);
      
      return prediction;
    } catch (error) {
      console.error('Error predicting optimal timing:', error);
      
      // Return default timing (next business day at 9 AM)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      return {
        prediction_type: 'optimal_timing',
        confidence: 0.5,
        prediction_value: {
          optimal_send_time: tomorrow.toISOString(),
          day_of_week: tomorrow.getDay(),
          hour_of_day: 9,
          timezone_adjustment: 0,
          send_score: 0.7,
          avoid_times: []
        },
        reasoning: 'Default timing: next business day morning',
        factors: [],
        created_at: new Date().toISOString()
      };
    }
  }

  /**
   * Get content optimization recommendations
   */
  async getContentOptimization(
    followup: EmailFollowup,
    draftContent?: { subject: string; body: string }
  ): Promise<ContentOptimizationPrediction> {
    try {
      const profile = await this.getContactBehaviorProfile(followup.original_recipients[0]);
      
      // Analyze content and provide recommendations
      const optimization = this.analyzeContentOptimization(followup, profile, draftContent);
      
      const prediction: ContentOptimizationPrediction = {
        prediction_type: 'content_optimization',
        confidence: optimization.confidence,
        prediction_value: optimization.recommendations,
        reasoning: optimization.reasoning,
        factors: optimization.factors,
        created_at: new Date().toISOString()
      };

      await this.storePrediction(followup.id!, prediction);
      
      return prediction;
    } catch (error) {
      console.error('Error getting content optimization:', error);
      
      return {
        prediction_type: 'content_optimization',
        confidence: 0.5,
        prediction_value: {
          recommended_subject_patterns: ['Following up on: {original_subject}'],
          optimal_length: 'medium',
          key_phrases: ['following up', 'wanted to check', 'any updates'],
          avoid_phrases: ['urgent', 'asap', 'immediately'],
          personalization_suggestions: [],
          cta_recommendations: ['Please let me know your thoughts']
        },
        reasoning: 'Default content recommendations',
        factors: [],
        created_at: new Date().toISOString()
      };
    }
  }

  /**
   * Get or create contact behavior profile
   */
  private async getContactBehaviorProfile(email: string): Promise<ContactBehaviorProfile | null> {
    try {
      // Check cache first
      if (this.profileCache.has(email)) {
        return this.profileCache.get(email)!;
      }

      // Try to get existing profile
      const supabase = await this.getSupabase();
      const { data: existingProfile } = await supabase
        .from('contact_behavior_profiles')
        .select('*')
        .eq('email_pattern', email)
        .single();

      if (existingProfile) {
        this.profileCache.set(email, existingProfile as ContactBehaviorProfile);
        return existingProfile as ContactBehaviorProfile;
      }

      // Create new profile based on historical data
      const profile = await this.createBehaviorProfile(email);
      if (profile) {
        this.profileCache.set(email, profile);
      }

      return profile;
    } catch (error) {
      console.error('Error getting contact behavior profile:', error);
      return null;
    }
  }

  /**
   * Create behavior profile from historical data
   */
  private async createBehaviorProfile(email: string): Promise<ContactBehaviorProfile | null> {
    try {
      // Get historical follow-up data for this contact
      const supabase = await this.getSupabase();
      const { data: historicalData } = await supabase
        .from('email_followups')
        .select(`
          *,
          email_response_tracking (
            response_detected_at,
            response_time_hours
          )
        `)
        .contains('original_recipients', [email]);

      if (!historicalData || historicalData.length === 0) {
        return null;
      }

      // Analyze patterns
      const responses = historicalData.filter(f => f.email_response_tracking?.length > 0);
      const responseRate = responses.length / historicalData.length;
      
      const responseTimes = responses
        .map(f => f.email_response_tracking[0]?.response_time_hours)
        .filter(Boolean);
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 24;

      // Extract timing patterns
      const responseDates = responses.map(f => new Date(f.email_response_tracking[0]?.response_detected_at));
      const preferredDays = this.extractPreferredDays(responseDates);
      const preferredHours = this.extractPreferredHours(responseDates);

      const profile: ContactBehaviorProfile = {
        email_pattern: email,
        response_patterns: {
          avg_response_time: avgResponseTime,
          preferred_days: preferredDays,
          preferred_hours: preferredHours,
          response_rate: responseRate,
          engagement_score: Math.min(responseRate * 1.2, 1) // Boost for quick responders
        },
        communication_preferences: {
          preferred_tone: this.inferPreferredTone(historicalData),
          preferred_length: this.inferPreferredLength(historicalData),
          responds_to_urgency: this.inferUrgencyResponse(historicalData),
          likes_personalization: true, // Default assumption
          prefers_direct_approach: responseRate > 0.7 // High responders might prefer directness
        },
        historical_data: {
          total_emails_received: historicalData.length,
          total_responses: responses.length,
          avg_time_to_respond: avgResponseTime,
          last_response_date: responses.length > 0 
            ? responses[responses.length - 1].email_response_tracking[0]?.response_detected_at 
            : undefined,
          response_quality_score: 0.8 // Default, would be calculated from content analysis
        },
        updated_at: new Date().toISOString()
      };

      // Store the profile
      await supabase
        .from('contact_behavior_profiles')
        .insert(profile);

      return profile;
    } catch (error) {
      console.error('Error creating behavior profile:', error);
      return null;
    }
  }

  /**
   * Extract features for ML prediction
   */
  private extractFeatures(
    followup: EmailFollowup,
    profile: ContactBehaviorProfile | null,
    context?: any
  ): any {
    const now = new Date();
    const originalDate = new Date(followup.original_sent_at);
    const daysSince = Math.floor((now.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      days_since_original: daysSince,
      hour_sent: now.getHours(),
      day_of_week: now.getDay(),
      is_business_hours: now.getHours() >= 9 && now.getHours() <= 17,
      is_weekend: now.getDay() === 0 || now.getDay() === 6,
      original_priority: followup.priority,
      followup_reason: followup.follow_up_reason || 'no_response',
      recipient_response_rate: profile?.response_patterns.response_rate || 0.5,
      recipient_avg_response_time: profile?.response_patterns.avg_response_time || 24,
      conversation_length: context?.conversation_length || 1
    };
  }

  /**
   * Calculate response likelihood using heuristic model
   */
  private calculateResponseLikelihood(features: any, profile: ContactBehaviorProfile | null): any {
    let score = 0.5; // Base score
    let confidence = 0.7;
    const factors = [];

    // Historical response rate (strongest factor)
    if (profile?.response_patterns.response_rate) {
      const responseRateWeight = 0.4;
      score += (profile.response_patterns.response_rate - 0.5) * responseRateWeight;
      factors.push({
        factor: 'Historical Response Rate',
        weight: responseRateWeight,
        impact: profile.response_patterns.response_rate > 0.5 ? 'positive' : 'negative'
      });
    }

    // Days since original email
    const daysFactor = Math.max(0, 1 - (features.days_since_original / 14)); // Decreases over 2 weeks
    score += (daysFactor - 0.5) * 0.2;
    factors.push({
      factor: 'Time Since Original',
      weight: 0.2,
      impact: features.days_since_original < 7 ? 'positive' : 'negative'
    });

    // Business hours
    if (features.is_business_hours && !features.is_weekend) {
      score += 0.1;
      factors.push({
        factor: 'Business Hours',
        weight: 0.1,
        impact: 'positive'
      });
    }

    // Priority level
    const priorityBoost = {
      'urgent': 0.15,
      'high': 0.1,
      'medium': 0.05,
      'low': 0
    }[features.original_priority] || 0.05;
    
    score += priorityBoost;
    factors.push({
      factor: 'Priority Level',
      weight: priorityBoost,
      impact: priorityBoost > 0 ? 'positive' : 'neutral'
    });

    // Engagement score
    if (profile?.response_patterns.engagement_score) {
      score += (profile.response_patterns.engagement_score - 0.5) * 0.15;
      factors.push({
        factor: 'Engagement Score',
        weight: 0.15,
        impact: profile.response_patterns.engagement_score > 0.5 ? 'positive' : 'negative'
      });
    }

    // Clamp score between 0 and 1
    score = Math.max(0, Math.min(1, score));

    // Adjust confidence based on data availability
    if (profile && profile.historical_data.total_emails_received > 5) {
      confidence = Math.min(0.95, confidence + 0.2);
    }

    return {
      score,
      confidence,
      reasoning: this.generateResponseLikelihoodReasoning(score, factors),
      factors
    };
  }

  /**
   * Calculate optimal timing for follow-up
   */
  private calculateOptimalTiming(followup: EmailFollowup, profile: ContactBehaviorProfile | null): any {
    const now = new Date();
    const optimalTime = new Date(now);
    
    // Default to next business day at 9 AM
    optimalTime.setDate(optimalTime.getDate() + 1);
    optimalTime.setHours(9, 0, 0, 0);
    
    // Skip weekends
    while (optimalTime.getDay() === 0 || optimalTime.getDay() === 6) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }

    let sendScore = 0.7; // Base score
    const factors = [];

    // Use profile preferred times if available
    if (profile?.response_patterns.preferred_hours.length > 0) {
      const preferredHour = profile.response_patterns.preferred_hours[0];
      optimalTime.setHours(preferredHour, 0, 0, 0);
      sendScore += 0.2;
      factors.push({
        factor: 'Contact Preferred Hours',
        weight: 0.2,
        impact: 'positive'
      });
    }

    if (profile?.response_patterns.preferred_days.length > 0) {
      // Adjust to preferred day if within next week
      const preferredDay = profile.response_patterns.preferred_days[0];
      const daysUntilPreferred = (preferredDay - optimalTime.getDay() + 7) % 7;
      
      if (daysUntilPreferred <= 3) { // Only adjust if within 3 days
        optimalTime.setDate(optimalTime.getDate() + daysUntilPreferred);
        sendScore += 0.15;
        factors.push({
          factor: 'Contact Preferred Days',
          weight: 0.15,
          impact: 'positive'
        });
      }
    }

    // Avoid late Friday sends
    if (optimalTime.getDay() === 5 && optimalTime.getHours() > 15) {
      optimalTime.setDate(optimalTime.getDate() + 3); // Move to Monday
      optimalTime.setHours(9, 0, 0, 0);
      factors.push({
        factor: 'Avoid Late Friday',
        weight: 0.1,
        impact: 'positive'
      });
    }

    return {
      confidence: 0.8,
      timing: {
        optimal_send_time: optimalTime.toISOString(),
        day_of_week: optimalTime.getDay(),
        hour_of_day: optimalTime.getHours(),
        timezone_adjustment: 0,
        send_score: sendScore,
        avoid_times: [
          {
            start_time: '18:00',
            end_time: '08:00',
            reason: 'Outside business hours'
          },
          {
            start_time: 'Friday 17:00',
            end_time: 'Monday 08:00',
            reason: 'Weekend period'
          }
        ]
      },
      reasoning: `Optimal send time calculated based on business hours, contact preferences, and response patterns`,
      factors
    };
  }

  /**
   * Analyze content optimization
   */
  private analyzeContentOptimization(
    followup: EmailFollowup,
    profile: ContactBehaviorProfile | null,
    draftContent?: { subject: string; body: string }
  ): any {
    const recommendations = {
      recommended_subject_patterns: [
        `Following up on: ${followup.original_subject}`,
        `Quick follow-up: ${followup.original_subject}`,
        `Re: ${followup.original_subject}`
      ],
      optimal_length: profile?.communication_preferences.preferred_length || 'medium',
      key_phrases: ['following up', 'wanted to check', 'any updates', 'please let me know'],
      avoid_phrases: ['urgent', 'asap', 'immediately', 'need response now'],
      personalization_suggestions: [
        {
          field: 'recipient_name',
          value: 'Contact name if available',
          impact_score: 0.8
        }
      ],
      cta_recommendations: [
        'Please let me know your thoughts',
        'I\'d appreciate any updates you can share',
        'Would you like to schedule a quick call to discuss?'
      ]
    };

    // Adjust based on profile preferences
    if (profile?.communication_preferences.prefers_direct_approach) {
      recommendations.key_phrases.push('need to know', 'direct response');
      recommendations.cta_recommendations.unshift('Please respond by [date]');
    }

    if (profile?.communication_preferences.responds_to_urgency) {
      recommendations.key_phrases.push('time-sensitive', 'important update');
    } else {
      recommendations.avoid_phrases.push('time-sensitive', 'deadline');
    }

    const factors = [
      {
        factor: 'Contact Communication Preferences',
        weight: 0.3,
        impact: 'positive'
      },
      {
        factor: 'Historical Response Patterns',
        weight: 0.25,
        impact: 'positive'
      },
      {
        factor: 'Content Length Optimization',
        weight: 0.2,
        impact: 'positive'
      }
    ];

    return {
      confidence: 0.75,
      recommendations,
      reasoning: 'Content optimized based on contact preferences and response history',
      factors
    };
  }

  /**
   * Helper methods for profile creation
   */
  private extractPreferredDays(dates: Date[]): number[] {
    if (dates.length === 0) return [1, 2, 3, 4, 5]; // Default to weekdays

    const dayCounts = new Array(7).fill(0);
    dates.forEach(date => dayCounts[date.getDay()]++);
    
    return dayCounts
      .map((count, day) => ({ day, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.day);
  }

  private extractPreferredHours(dates: Date[]): number[] {
    if (dates.length === 0) return [9, 10, 11, 14, 15]; // Default business hours

    const hourCounts = new Array(24).fill(0);
    dates.forEach(date => hourCounts[date.getHours()]++);
    
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
  }

  private inferPreferredTone(historicalData: any[]): string {
    // Simple heuristic - could be enhanced with NLP
    return 'professional'; // Default
  }

  private inferPreferredLength(historicalData: any[]): string {
    // Simple heuristic - could be enhanced with content analysis
    return 'medium'; // Default
  }

  private inferUrgencyResponse(historicalData: any[]): boolean {
    // Check if urgent follow-ups get better response rates
    return false; // Default conservative approach
  }

  private generateResponseLikelihoodReasoning(score: number, factors: any[]): string {
    if (score > 0.8) {
      return 'High likelihood of response based on strong historical engagement and optimal timing factors';
    } else if (score > 0.6) {
      return 'Good likelihood of response with favorable conditions and moderate engagement history';
    } else if (score > 0.4) {
      return 'Moderate likelihood of response; consider optimizing timing or approach';
    } else {
      return 'Lower likelihood of response; may benefit from different approach or timing';
    }
  }

  /**
   * Store prediction for learning and analytics
   */
  private async storePrediction(followupId: string, prediction: MLPrediction): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      await supabase
        .from('email_followup_ml_predictions')
        .insert({
          followup_id: followupId,
          prediction_type: prediction.prediction_type,
          confidence: prediction.confidence,
          prediction_value: prediction.prediction_value,
          reasoning: prediction.reasoning,
          factors: prediction.factors,
          created_at: prediction.created_at
        });
    } catch (error) {
      console.error('Error storing ML prediction:', error);
      // Don't throw - this is not critical for main functionality
    }
  }

  /**
   * Update prediction accuracy after outcome is known
   */
  async updatePredictionAccuracy(
    followupId: string,
    actualOutcome: {
      received_response: boolean;
      response_time_hours?: number;
      response_quality?: 'high' | 'medium' | 'low';
    }
  ): Promise<void> {
    try {
      // Get predictions for this follow-up
      const supabase = await this.getSupabase();
      const { data: predictions } = await supabase
        .from('email_followup_ml_predictions')
        .select('*')
        .eq('followup_id', followupId);

      if (!predictions || predictions.length === 0) return;

      // Calculate accuracy for each prediction
      for (const prediction of predictions) {
        let accuracy = 0;

        switch (prediction.prediction_type) {
          case 'response_likelihood':
            const predictedLikelihood = prediction.prediction_value.likelihood_score;
            const actualResponse = actualOutcome.received_response ? 1 : 0;
            accuracy = 1 - Math.abs(predictedLikelihood - actualResponse);
            break;

          case 'optimal_timing':
            // If response received, timing was good
            accuracy = actualOutcome.received_response ? 0.8 : 0.4;
            break;

          default:
            accuracy = 0.5; // Default
        }

        // Update prediction with accuracy
        const supabase2 = await this.getSupabase();
        await supabase2
          .from('email_followup_ml_predictions')
          .update({
            actual_outcome: actualOutcome,
            accuracy_score: accuracy,
            updated_at: new Date().toISOString()
          })
          .eq('id', prediction.id);
      }
    } catch (error) {
      console.error('Error updating prediction accuracy:', error);
    }
  }
}




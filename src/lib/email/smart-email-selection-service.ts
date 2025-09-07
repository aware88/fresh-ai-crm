/**
 * Smart Email Selection Service
 * 
 * Intelligently selects the most valuable emails for AI learning based on:
 * - Subscription tier (Starter: 500, Pro: 2000, Premium: 5000)
 * - Email importance (sent replies, high engagement, unique patterns)
 * - Cost optimization (balance quality vs quantity)
 * - Time efficiency (faster learning with better results)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface EmailSelectionCriteria {
  userId: string;
  organizationId?: string;
  subscriptionTier: 'starter' | 'pro' | 'premium_basic' | 'premium_advanced' | 'premium_enterprise';
  maxEmails?: number; // Override if provided
  focusOnSent?: boolean; // Prioritize sent emails for draft learning
}

export interface SelectedEmailBatch {
  total_selected: number;
  sent_emails: number;
  received_emails: number;
  email_ids: string[];
  selection_strategy: string;
  estimated_cost_usd: number;
  estimated_time_minutes: number;
  quality_score: number; // Expected learning quality 0-1
}

export interface TierLimits {
  max_emails: number;
  sent_ratio: number; // Percentage of sent emails vs received (0.5 = 50/50)
  include_conversation_threads: boolean;
  include_high_engagement: boolean;
  use_smart_sampling: boolean;
}

export class SmartEmailSelectionService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Get tier-based limits for email learning
   */
  private getTierLimits(tier: string): TierLimits {
    switch (tier) {
      case 'starter':
        return {
          max_emails: 500, // Free tier: focus on quality over quantity
          sent_ratio: 0.7, // 70% sent emails (350 sent, 150 received) - better for draft learning
          include_conversation_threads: false,
          include_high_engagement: false,
          use_smart_sampling: true // Essential for limited emails
        };

      case 'pro':
        return {
          max_emails: 2000, // Balanced approach (as you suggested: 1000 sent + 1000 received)
          sent_ratio: 0.5, // 50/50 split (1000 sent, 1000 received)
          include_conversation_threads: true,
          include_high_engagement: true,
          use_smart_sampling: true
        };

      case 'premium_basic':
      case 'premium_advanced':
        return {
          max_emails: 4000, // More comprehensive learning
          sent_ratio: 0.5, // 50/50 split (2000 sent, 2000 received)
          include_conversation_threads: true,
          include_high_engagement: true,
          use_smart_sampling: true
        };

      case 'premium_enterprise':
        return {
          max_emails: 5000, // Full comprehensive learning (manual approval)
          sent_ratio: 0.5, // 50/50 split (2500 sent, 2500 received)
          include_conversation_threads: true,
          include_high_engagement: true,
          use_smart_sampling: false // Use all selected emails
        };

      default:
        return this.getTierLimits('starter'); // Fallback to starter
    }
  }

  /**
   * Select emails intelligently based on tier and criteria
   */
  async selectEmailsForLearning(criteria: EmailSelectionCriteria): Promise<SelectedEmailBatch> {
    const tierLimits = this.getTierLimits(criteria.subscriptionTier);
    const maxEmails = criteria.maxEmails || tierLimits.max_emails;
    
    console.log(`📊 [Smart Selection] Selecting ${maxEmails} emails for ${criteria.subscriptionTier} tier`);
    console.log(`📊 [Smart Selection] Target ratio: ${Math.round(tierLimits.sent_ratio * 100)}% sent, ${Math.round((1 - tierLimits.sent_ratio) * 100)}% received`);

    // Calculate split
    const targetSentEmails = Math.round(maxEmails * tierLimits.sent_ratio);
    const targetReceivedEmails = maxEmails - targetSentEmails;

    // Step 1: Select high-quality SENT emails (for draft learning)
    const sentEmails = await this.selectBestSentEmails(
      criteria.userId, 
      criteria.organizationId,
      targetSentEmails,
      tierLimits
    );

    // Step 2: Select high-quality RECEIVED emails (for pattern learning)
    const receivedEmails = await this.selectBestReceivedEmails(
      criteria.userId,
      criteria.organizationId, 
      targetReceivedEmails,
      tierLimits
    );

    const allSelectedIds = [...sentEmails.map(e => e.id), ...receivedEmails.map(e => e.id)];
    const totalSelected = allSelectedIds.length;

    // Calculate estimates
    const estimatedCostUsd = this.estimateCost(totalSelected);
    const estimatedTimeMinutes = this.estimateTime(totalSelected);
    const qualityScore = this.calculateQualityScore(sentEmails.length, receivedEmails.length, tierLimits);

    console.log(`✅ [Smart Selection] Selected ${totalSelected} emails (${sentEmails.length} sent, ${receivedEmails.length} received)`);
    console.log(`💰 [Smart Selection] Estimated cost: $${estimatedCostUsd.toFixed(2)}, time: ${estimatedTimeMinutes} min, quality: ${Math.round(qualityScore * 100)}%`);

    return {
      total_selected: totalSelected,
      sent_emails: sentEmails.length,
      received_emails: receivedEmails.length,
      email_ids: allSelectedIds,
      selection_strategy: this.getStrategyDescription(criteria.subscriptionTier, tierLimits),
      estimated_cost_usd: estimatedCostUsd,
      estimated_time_minutes: estimatedTimeMinutes,
      quality_score: qualityScore
    };
  }

  /**
   * Select best SENT emails for draft learning
   */
  private async selectBestSentEmails(
    userId: string, 
    organizationId: string | undefined,
    targetCount: number,
    limits: TierLimits
  ) {
    console.log(`📤 [Smart Selection] Selecting ${targetCount} best sent emails`);

    // Build query with intelligent prioritization
    let query = this.supabase
      .from('email_index')
      .select('id, subject, preview, received_at, sender_email, folder_name, replied, word_count')
      .eq('user_id', userId)
      .in('folder_name', ['SENT', 'Sent', 'sent', 'Sent Items', 'sentitems']) // Various sent folder names
      .order('received_at', { ascending: false }); // Recent emails first

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Get more than we need for smart filtering
    const fetchCount = Math.min(targetCount * 3, 2000); // Get 3x what we need for filtering
    const { data: candidates, error } = await query.limit(fetchCount);

    if (error || !candidates) {
      console.error('Error fetching sent emails:', error);
      return [];
    }

    console.log(`📤 [Smart Selection] Found ${candidates.length} sent email candidates`);

    // Smart scoring and selection
    const scoredEmails = candidates
      .map(email => ({
        ...email,
        score: this.scoreSentEmailImportance(email, limits)
      }))
      .sort((a, b) => b.score - a.score) // Highest score first
      .slice(0, targetCount); // Take top N

    return scoredEmails;
  }

  /**
   * Select best RECEIVED emails for pattern learning
   */
  private async selectBestReceivedEmails(
    userId: string,
    organizationId: string | undefined,
    targetCount: number,
    limits: TierLimits
  ) {
    console.log(`📥 [Smart Selection] Selecting ${targetCount} best received emails`);

    // Build query for received emails
    let query = this.supabase
      .from('email_index')
      .select('id, subject, preview, received_at, sender_email, folder_name, is_read, replied, word_count')
      .eq('user_id', userId)
      .in('folder_name', ['INBOX', 'Inbox', 'inbox']) // Focus on inbox
      .order('received_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Get more than we need for smart filtering
    const fetchCount = Math.min(targetCount * 3, 2000);
    const { data: candidates, error } = await query.limit(fetchCount);

    if (error || !candidates) {
      console.error('Error fetching received emails:', error);
      return [];
    }

    console.log(`📥 [Smart Selection] Found ${candidates.length} received email candidates`);

    // Smart scoring and selection
    const scoredEmails = candidates
      .map(email => ({
        ...email,
        score: this.scoreReceivedEmailImportance(email, limits)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount);

    return scoredEmails;
  }

  /**
   * Score sent emails for learning importance
   */
  private scoreSentEmailImportance(email: any, limits: TierLimits): number {
    let score = 1;

    // Recent emails are more relevant
    const daysSinceReceived = (Date.now() - new Date(email.received_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReceived < 30) score += 2; // Last 30 days
    else if (daysSinceReceived < 90) score += 1; // Last 90 days

    // Longer emails usually have better patterns
    const wordCount = email.word_count || 0;
    if (wordCount > 100) score += 2; // Substantial emails
    else if (wordCount > 50) score += 1; // Medium emails

    // Replied emails show successful communication patterns
    if (email.replied) score += 3; // High value for learning

    // Subject quality (avoid automated emails)
    const subject = email.subject?.toLowerCase() || '';
    if (subject.includes('re:') || subject.includes('fwd:')) score += 1; // Part of conversation
    if (subject.includes('automatic') || subject.includes('no-reply')) score -= 2; // Automated

    // Avoid very short or empty emails
    const preview = email.preview || '';
    if (preview.length < 20) score -= 1;

    return Math.max(0, score); // Never negative
  }

  /**
   * Score received emails for learning importance
   */
  private scoreReceivedEmailImportance(email: any, limits: TierLimits): number {
    let score = 1;

    // Recent emails are more relevant
    const daysSinceReceived = (Date.now() - new Date(email.received_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReceived < 30) score += 2;
    else if (daysSinceReceived < 90) score += 1;

    // Read and replied emails show engagement
    if (email.is_read) score += 1;
    if (email.replied) score += 3; // Very valuable - shows it needed a response

    // Longer emails usually have better patterns
    const wordCount = email.word_count || 0;
    if (wordCount > 100) score += 2;
    else if (wordCount > 50) score += 1;

    // Subject patterns
    const subject = email.subject?.toLowerCase() || '';
    if (subject.includes('re:')) score += 2; // Part of conversation thread
    if (subject.includes('urgent') || subject.includes('important')) score += 1; // Priority emails
    if (subject.includes('newsletter') || subject.includes('unsubscribe')) score -= 2; // Marketing

    // Sender patterns (avoid spam/marketing)
    const senderEmail = email.sender_email?.toLowerCase() || '';
    if (senderEmail.includes('no-reply') || senderEmail.includes('noreply')) score -= 2;
    if (senderEmail.includes('marketing') || senderEmail.includes('newsletter')) score -= 1;

    return Math.max(0, score);
  }

  /**
   * Estimate cost based on email count
   */
  private estimateCost(emailCount: number): number {
    // Rough estimate: ~200 tokens per email * $0.00015 per 1k tokens
    const tokensPerEmail = 200;
    const totalTokens = emailCount * tokensPerEmail;
    const costPer1kTokens = 0.00015; // GPT-4o-mini
    return (totalTokens / 1000) * costPer1kTokens;
  }

  /**
   * Estimate processing time
   */
  private estimateTime(emailCount: number): number {
    // Roughly 1 minute per 100 emails (parallel processing)
    return Math.ceil(emailCount / 100);
  }

  /**
   * Calculate expected learning quality
   */
  private calculateQualityScore(sentCount: number, receivedCount: number, limits: TierLimits): number {
    let qualityScore = 0.5; // Base score

    // Balance bonus
    const total = sentCount + receivedCount;
    if (total > 0) {
      const sentRatio = sentCount / total;
      const idealRatio = limits.sent_ratio;
      const balanceScore = 1 - Math.abs(sentRatio - idealRatio); // Closer to ideal = better
      qualityScore += balanceScore * 0.2;
    }

    // Volume bonus (more emails = better patterns)
    if (total >= 2000) qualityScore += 0.2; // Excellent volume
    else if (total >= 1000) qualityScore += 0.15; // Good volume
    else if (total >= 500) qualityScore += 0.1; // Decent volume

    // Feature bonus
    if (limits.include_conversation_threads) qualityScore += 0.05;
    if (limits.include_high_engagement) qualityScore += 0.05;
    if (limits.use_smart_sampling) qualityScore += 0.1;

    return Math.min(1, Math.max(0, qualityScore));
  }

  /**
   * Generate strategy description
   */
  private getStrategyDescription(tier: string, limits: TierLimits): string {
    const strategies = [];

    strategies.push(`${limits.max_emails} total emails selected`);
    strategies.push(`${Math.round(limits.sent_ratio * 100)}% sent/${Math.round((1 - limits.sent_ratio) * 100)}% received ratio`);
    
    if (limits.use_smart_sampling) strategies.push('Smart quality sampling');
    if (limits.include_conversation_threads) strategies.push('Conversation threads included');
    if (limits.include_high_engagement) strategies.push('High-engagement emails prioritized');

    strategies.push(`Optimized for ${tier} tier`);

    return strategies.join(', ');
  }

  /**
   * Get tier-specific recommendations
   */
  getTierRecommendations(tier: string): string[] {
    switch (tier) {
      case 'starter':
        return [
          'Learning optimized for draft generation with 70% sent emails',
          'Smart sampling ensures high-quality patterns despite lower volume',
          'Estimated learning time: 5-8 minutes for cost efficiency'
        ];

      case 'pro':
        return [
          'Balanced 50/50 approach: 1000 sent + 1000 received emails',
          'Includes conversation threads for better context understanding',
          'Estimated learning time: 20-25 minutes for optimal results'
        ];

      case 'premium_basic':
      case 'premium_advanced':
        return [
          'Comprehensive learning with 4000 emails for advanced patterns',
          'High-engagement email prioritization for quality insights',
          'Estimated learning time: 35-45 minutes for premium results'
        ];

      case 'premium_enterprise':
        return [
          'Full 5000 email analysis for maximum AI draft quality',
          'All conversation threads and engagement patterns included',
          'Manual approval required for this tier - contact support',
          'Estimated learning time: 45-60 minutes for enterprise-grade results'
        ];

      default:
        return ['Basic learning approach suitable for getting started'];
    }
  }
}
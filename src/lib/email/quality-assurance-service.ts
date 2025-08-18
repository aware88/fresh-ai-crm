/**
 * Quality Assurance Service - Comprehensive Quality Monitoring and Improvement
 * 
 * This service monitors the quality of email learning patterns and drafts,
 * provides recommendations for improvement, and automatically adjusts
 * system parameters based on performance feedback.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export interface QualityMetrics {
  pattern_quality_score: number;
  draft_quality_score: number;
  user_satisfaction_score: number;
  system_performance_score: number;
  overall_quality_score: number;
}

export interface QualityAlert {
  id: string;
  type: 'pattern_degradation' | 'low_satisfaction' | 'cost_spike' | 'performance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  created_at: string;
  resolved: boolean;
}

export interface QualityInsight {
  category: 'patterns' | 'costs' | 'performance' | 'satisfaction';
  insight: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  action_items: string[];
}

export interface PatternHealthReport {
  pattern_id: string;
  pattern_type: string;
  health_score: number;
  issues: string[];
  recommendations: string[];
  last_analysis: string;
}

export class QualityAssuranceService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Calculate comprehensive quality metrics for a user
   */
  async calculateQualityMetrics(
    userId: string,
    timeRange: string = '30d'
  ): Promise<QualityMetrics> {
    try {
      // Get date threshold
      const dateThreshold = this.getDateThreshold(timeRange);

      // Fetch all relevant data
      const [patterns, drafts, feedback] = await Promise.all([
        this.getPatterns(userId, dateThreshold),
        this.getDrafts(userId, dateThreshold),
        this.getFeedbackData(userId, dateThreshold)
      ]);

      // Calculate individual scores
      const patternQuality = this.calculatePatternQuality(patterns);
      const draftQuality = this.calculateDraftQuality(drafts);
      const userSatisfaction = this.calculateUserSatisfaction(feedback);
      const systemPerformance = this.calculateSystemPerformance(drafts);

      // Calculate overall quality score (weighted average)
      const overallQuality = 
        (patternQuality * 0.3) +
        (draftQuality * 0.25) +
        (userSatisfaction * 0.3) +
        (systemPerformance * 0.15);

      return {
        pattern_quality_score: patternQuality,
        draft_quality_score: draftQuality,
        user_satisfaction_score: userSatisfaction,
        system_performance_score: systemPerformance,
        overall_quality_score: overallQuality
      };

    } catch (error) {
      console.error('[QualityAssurance] Error calculating quality metrics:', error);
      return {
        pattern_quality_score: 0,
        draft_quality_score: 0,
        user_satisfaction_score: 0,
        system_performance_score: 0,
        overall_quality_score: 0
      };
    }
  }

  /**
   * Generate quality alerts based on system performance
   */
  async generateQualityAlerts(
    userId: string,
    metrics: QualityMetrics
  ): Promise<QualityAlert[]> {
    const alerts: QualityAlert[] = [];

    try {
      // Pattern quality alerts
      if (metrics.pattern_quality_score < 0.6) {
        alerts.push({
          id: `pattern_quality_${Date.now()}`,
          type: 'pattern_degradation',
          severity: metrics.pattern_quality_score < 0.4 ? 'high' : 'medium',
          title: 'Pattern Quality Below Threshold',
          description: `Your pattern quality score is ${Math.round(metrics.pattern_quality_score * 100)}%, which is below the recommended 60% threshold.`,
          recommendation: 'Review and refine patterns with low success rates. Consider removing or updating patterns that are frequently edited or rejected.',
          created_at: new Date().toISOString(),
          resolved: false
        });
      }

      // User satisfaction alerts
      if (metrics.user_satisfaction_score < 0.7) {
        alerts.push({
          id: `satisfaction_${Date.now()}`,
          type: 'low_satisfaction',
          severity: metrics.user_satisfaction_score < 0.5 ? 'high' : 'medium',
          title: 'Low User Satisfaction Detected',
          description: `User satisfaction is at ${Math.round(metrics.user_satisfaction_score * 100)}%. Users are frequently editing or rejecting generated drafts.`,
          recommendation: 'Analyze frequently edited drafts to identify common issues. Consider running additional learning sessions with more recent emails.',
          created_at: new Date().toISOString(),
          resolved: false
        });
      }

      // System performance alerts
      if (metrics.system_performance_score < 0.6) {
        alerts.push({
          id: `performance_${Date.now()}`,
          type: 'performance_issue',
          severity: 'medium',
          title: 'System Performance Below Optimal',
          description: 'Cache hit rates or response times are below optimal levels.',
          recommendation: 'Check background draft generation settings and ensure the email queue is processing efficiently.',
          created_at: new Date().toISOString(),
          resolved: false
        });
      }

      // Cost spike detection
      const recentCosts = await this.getRecentCosts(userId);
      if (recentCosts.spike_detected) {
        alerts.push({
          id: `cost_spike_${Date.now()}`,
          type: 'cost_spike',
          severity: 'medium',
          title: 'Unusual Cost Increase Detected',
          description: `AI costs have increased by ${Math.round(recentCosts.increase_percentage)}% compared to the previous period.`,
          recommendation: 'Review model selection settings and check if more expensive models are being used unnecessarily.',
          created_at: new Date().toISOString(),
          resolved: false
        });
      }

      // Save alerts to database
      if (alerts.length > 0) {
        await this.saveQualityAlerts(userId, alerts);
      }

      return alerts;

    } catch (error) {
      console.error('[QualityAssurance] Error generating quality alerts:', error);
      return [];
    }
  }

  /**
   * Generate actionable insights based on system data
   */
  async generateQualityInsights(
    userId: string,
    metrics: QualityMetrics
  ): Promise<QualityInsight[]> {
    const insights: QualityInsight[] = [];

    try {
      const [patterns, drafts] = await Promise.all([
        this.getPatterns(userId),
        this.getDrafts(userId)
      ]);

      // Pattern insights
      const topPerformingPatterns = patterns
        .filter(p => p.success_rate > 0.8 && p.usage_count > 5)
        .sort((a, b) => b.success_rate - a.success_rate);

      if (topPerformingPatterns.length > 0) {
        insights.push({
          category: 'patterns',
          insight: `Your ${topPerformingPatterns[0].pattern_type.replace('_', ' ')} patterns are performing exceptionally well with ${Math.round(topPerformingPatterns[0].success_rate * 100)}% success rate.`,
          impact: 'positive',
          confidence: 0.9,
          action_items: [
            'Consider creating more patterns of this type',
            'Use this pattern as a template for similar contexts'
          ]
        });
      }

      // Cost efficiency insights
      const avgCostPerDraft = drafts.length > 0 
        ? drafts.reduce((sum, d) => sum + (d.generation_cost_usd || 0), 0) / drafts.length 
        : 0;

      if (avgCostPerDraft < 0.001) {
        insights.push({
          category: 'costs',
          insight: `You're achieving excellent cost efficiency at ${(avgCostPerDraft * 1000).toFixed(2)}¢ per draft, well below industry averages.`,
          impact: 'positive',
          confidence: 0.8,
          action_items: [
            'Continue using pattern-based generation',
            'Share successful patterns with team members'
          ]
        });
      }

      // Performance insights
      const cacheHitRate = this.calculateCacheHitRate(drafts);
      if (cacheHitRate > 0.8) {
        insights.push({
          category: 'performance',
          insight: `Your ${Math.round(cacheHitRate * 100)}% cache hit rate indicates excellent background draft generation.`,
          impact: 'positive',
          confidence: 0.9,
          action_items: [
            'Users are experiencing near-instant draft retrieval',
            'Background processing is working optimally'
          ]
        });
      } else if (cacheHitRate < 0.5) {
        insights.push({
          category: 'performance',
          insight: `Low cache hit rate (${Math.round(cacheHitRate * 100)}%) suggests opportunities for improvement.`,
          impact: 'negative',
          confidence: 0.7,
          action_items: [
            'Review background draft generation settings',
            'Consider increasing draft retention period',
            'Check if email patterns are too diverse'
          ]
        });
      }

      // Satisfaction insights
      if (metrics.user_satisfaction_score > 0.85) {
        insights.push({
          category: 'satisfaction',
          insight: `Exceptional user satisfaction at ${Math.round(metrics.user_satisfaction_score * 100)}% indicates the system is meeting user needs effectively.`,
          impact: 'positive',
          confidence: 0.9,
          action_items: [
            'Current learning patterns are highly effective',
            'Consider expanding to additional email types'
          ]
        });
      }

      return insights;

    } catch (error) {
      console.error('[QualityAssurance] Error generating insights:', error);
      return [];
    }
  }

  /**
   * Analyze individual pattern health
   */
  async analyzePatternHealth(
    userId: string,
    patternId?: string
  ): Promise<PatternHealthReport[]> {
    try {
      const patterns = patternId 
        ? await this.getPatternById(patternId, userId)
        : await this.getPatterns(userId);

      const reports: PatternHealthReport[] = [];

      for (const pattern of patterns) {
        const healthScore = this.calculatePatternHealthScore(pattern);
        const issues = this.identifyPatternIssues(pattern);
        const recommendations = this.generatePatternRecommendations(pattern, issues);

        reports.push({
          pattern_id: pattern.id,
          pattern_type: pattern.pattern_type,
          health_score: healthScore,
          issues,
          recommendations,
          last_analysis: new Date().toISOString()
        });
      }

      return reports;

    } catch (error) {
      console.error('[QualityAssurance] Error analyzing pattern health:', error);
      return [];
    }
  }

  /**
   * Automatically improve patterns based on feedback
   */
  async autoImprovePatterns(userId: string): Promise<{
    improved_patterns: number;
    disabled_patterns: number;
    recommendations: string[];
  }> {
    try {
      const patterns = await this.getPatterns(userId);
      let improvedCount = 0;
      let disabledCount = 0;
      const recommendations: string[] = [];

      for (const pattern of patterns) {
        const healthScore = this.calculatePatternHealthScore(pattern);
        
        // Disable very poor performing patterns
        if (healthScore < 0.3 && pattern.usage_count > 10) {
          await this.disablePattern(pattern.id);
          disabledCount++;
          recommendations.push(`Disabled low-performing pattern: ${pattern.pattern_type}`);
        }
        // Improve moderately poor patterns
        else if (healthScore < 0.6 && pattern.usage_count > 5) {
          const improved = await this.improvePattern(pattern);
          if (improved) {
            improvedCount++;
            recommendations.push(`Improved pattern: ${pattern.pattern_type}`);
          }
        }
      }

      return {
        improved_patterns: improvedCount,
        disabled_patterns: disabledCount,
        recommendations
      };

    } catch (error) {
      console.error('[QualityAssurance] Error in auto-improvement:', error);
      return {
        improved_patterns: 0,
        disabled_patterns: 0,
        recommendations: ['Auto-improvement failed due to system error']
      };
    }
  }

  // Helper methods

  private getDateThreshold(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(0);
    }
  }

  private async getPatterns(userId: string, dateThreshold?: Date): Promise<any[]> {
    const query = this.supabase
      .from('email_patterns')
      .select('*')
      .eq('user_id', userId);

    if (dateThreshold) {
      query.gte('created_at', dateThreshold.toISOString());
    }

    const { data, error } = await query;
    return error ? [] : data;
  }

  private async getDrafts(userId: string, dateThreshold?: Date): Promise<any[]> {
    const query = this.supabase
      .from('email_drafts_cache')
      .select('*')
      .eq('user_id', userId);

    if (dateThreshold) {
      query.gte('generated_at', dateThreshold.toISOString());
    }

    const { data, error } = await query;
    return error ? [] : data;
  }

  private async getFeedbackData(userId: string, dateThreshold?: Date): Promise<any[]> {
    const query = this.supabase
      .from('email_drafts_cache')
      .select('user_feedback, confidence_score, fallback_generation')
      .eq('user_id', userId)
      .not('user_feedback', 'is', null);

    if (dateThreshold) {
      query.gte('generated_at', dateThreshold.toISOString());
    }

    const { data, error } = await query;
    return error ? [] : data;
  }

  private calculatePatternQuality(patterns: any[]): number {
    if (patterns.length === 0) return 0;

    const qualityScores = patterns.map(pattern => {
      const confidence = pattern.confidence_score || 0;
      const successRate = pattern.success_rate || 0;
      const usageWeight = Math.min(pattern.usage_count / 10, 1);
      
      return (confidence * 0.4) + (successRate * 0.4) + (usageWeight * 0.2);
    });

    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  private calculateDraftQuality(drafts: any[]): number {
    if (drafts.length === 0) return 0;

    const avgConfidence = drafts.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / drafts.length;
    const nonFallbackRate = drafts.filter(d => !d.fallback_generation).length / drafts.length;
    
    return (avgConfidence * 0.6) + (nonFallbackRate * 0.4);
  }

  private calculateUserSatisfaction(feedback: any[]): number {
    if (feedback.length === 0) return 0.5; // Neutral if no feedback

    const satisfactionScores = feedback.map(f => {
      switch (f.user_feedback) {
        case 'approved': return 1.0;
        case 'edited': return 0.7;
        case 'rejected': return 0.0;
        default: return 0.5;
      }
    });

    return satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
  }

  private calculateSystemPerformance(drafts: any[]): number {
    if (drafts.length === 0) return 0;

    const cacheHitRate = this.calculateCacheHitRate(drafts);
    const avgCost = drafts.reduce((sum, d) => sum + (d.generation_cost_usd || 0), 0) / drafts.length;
    const costEfficiency = Math.max(0, 1 - (avgCost / 0.01)); // Normalize against $0.01 baseline
    
    return (cacheHitRate * 0.6) + (costEfficiency * 0.4);
  }

  private calculateCacheHitRate(drafts: any[]): number {
    if (drafts.length === 0) return 0;
    return drafts.filter(d => !d.fallback_generation).length / drafts.length;
  }

  private calculatePatternHealthScore(pattern: any): number {
    const confidence = pattern.confidence_score || 0;
    const successRate = pattern.success_rate || 0;
    const usageCount = pattern.usage_count || 0;
    const hasContent = pattern.response_template && pattern.response_template.length > 20 ? 1 : 0;
    const hasKeywords = pattern.trigger_keywords && pattern.trigger_keywords.length > 0 ? 1 : 0;
    
    const usageWeight = Math.min(usageCount / 10, 1);
    
    return (confidence * 0.3) + (successRate * 0.3) + (usageWeight * 0.2) + (hasContent * 0.1) + (hasKeywords * 0.1);
  }

  private identifyPatternIssues(pattern: any): string[] {
    const issues: string[] = [];
    
    if (pattern.confidence_score < 0.6) {
      issues.push('Low confidence score');
    }
    if (pattern.success_rate < 0.7 && pattern.usage_count > 5) {
      issues.push('Poor user acceptance rate');
    }
    if (!pattern.trigger_keywords || pattern.trigger_keywords.length === 0) {
      issues.push('Missing trigger keywords');
    }
    if (!pattern.response_template || pattern.response_template.length < 20) {
      issues.push('Insufficient response template');
    }
    if (pattern.usage_count === 0 && this.daysSince(pattern.created_at) > 30) {
      issues.push('Pattern never used');
    }
    
    return issues;
  }

  private generatePatternRecommendations(pattern: any, issues: string[]): string[] {
    const recommendations: string[] = [];
    
    issues.forEach(issue => {
      switch (issue) {
        case 'Low confidence score':
          recommendations.push('Review and refine the response template for clarity and accuracy');
          break;
        case 'Poor user acceptance rate':
          recommendations.push('Analyze user edits to understand common modifications needed');
          break;
        case 'Missing trigger keywords':
          recommendations.push('Add relevant keywords that should trigger this pattern');
          break;
        case 'Insufficient response template':
          recommendations.push('Expand the response template with more detailed content');
          break;
        case 'Pattern never used':
          recommendations.push('Consider removing this pattern or adjusting trigger keywords');
          break;
      }
    });
    
    return recommendations;
  }

  private daysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async getRecentCosts(userId: string): Promise<{
    spike_detected: boolean;
    increase_percentage: number;
  }> {
    // Implementation for cost spike detection
    // This would compare recent costs to historical averages
    return { spike_detected: false, increase_percentage: 0 };
  }

  private async saveQualityAlerts(userId: string, alerts: QualityAlert[]): Promise<void> {
    // Save alerts to database for later retrieval
    // This would typically go to a quality_alerts table
  }

  private async getPatternById(patternId: string, userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('email_patterns')
      .select('*')
      .eq('id', patternId)
      .eq('user_id', userId);

    return error ? [] : data;
  }

  private async disablePattern(patternId: string): Promise<void> {
    await this.supabase
      .from('email_patterns')
      .update({ confidence_score: 0.1 }) // Effectively disable by lowering confidence
      .eq('id', patternId);
  }

  private async improvePattern(pattern: any): Promise<boolean> {
    // Logic to improve pattern based on feedback analysis
    // This could involve adjusting confidence, keywords, or templates
    return true; // Placeholder
  }
}

export default QualityAssuranceService;



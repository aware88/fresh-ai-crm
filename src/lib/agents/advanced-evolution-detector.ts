import { createClient } from '@/lib/supabase/client';
import { calculateStatisticalSignificance, analyzeTextSentiment, extractCommunicationPatterns } from '@/lib/utils/analysis-helpers';

export interface EvolutionDetectionResult {
  evolutionDetected: boolean;
  evolutionEvents: EvolutionEvent[];
  behavioralMilestones: BehavioralMilestone[];
  communicationChanges: CommunicationPatternChange[];
  confidenceScore: number;
}

export interface EvolutionEvent {
  type: 'sentiment_evolution' | 'communication_pattern' | 'behavioral_milestone';
  significance: number;
  confidence: number;
  insight: string;
  businessImpact: string;
  recommendedActions: string[];
}

export interface BehavioralMilestone {
  type: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  relationshipImpact: 'positive' | 'negative' | 'neutral' | 'mixed';
  businessOpportunityScore: number;
}

export interface CommunicationPatternChange {
  pattern: string;
  previousValue: any;
  currentValue: any;
  trend: 'improving' | 'declining' | 'volatile' | 'stable';
  significance: number;
}

export class AdvancedEvolutionDetector {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Main evolution detection method
   */
  async detectEvolution(
    contactId: string,
    currentEmail: any,
    userId: string
  ): Promise<EvolutionDetectionResult> {
    try {
      // Get historical analysis data
      const historicalData = await this.getHistoricalAnalysis(contactId);
      
      // Analyze current email
      const currentAnalysis = await this.analyzeCurrentEmail(currentEmail);
      
      // Detect different types of evolution
      const sentimentEvolution = await this.detectSentimentEvolution(
        contactId, currentAnalysis, historicalData, currentEmail.id, userId
      );
      
      const communicationPatterns = await this.detectCommunicationPatternChanges(
        contactId, currentAnalysis, historicalData
      );
      
      const behavioralMilestones = await this.detectBehavioralMilestones(
        contactId, currentAnalysis, historicalData, currentEmail.id, userId
      );

      // Update communication metrics
      await this.updateCommunicationMetrics(contactId, currentAnalysis, historicalData);

      // Combine results
      const evolutionEvents: EvolutionEvent[] = [
        ...sentimentEvolution.events,
        ...communicationPatterns.events,
        ...behavioralMilestones.events
      ];

      const evolutionDetected = evolutionEvents.length > 0;
      const confidenceScore = evolutionDetected ? 
        evolutionEvents.reduce((sum, event) => sum + event.confidence, 0) / evolutionEvents.length : 0;

      return {
        evolutionDetected,
        evolutionEvents,
        behavioralMilestones: behavioralMilestones.milestones,
        communicationChanges: communicationPatterns.changes,
        confidenceScore
      };

    } catch (error) {
      console.error('Evolution detection failed:', error);
      return {
        evolutionDetected: false,
        evolutionEvents: [],
        behavioralMilestones: [],
        communicationChanges: [],
        confidenceScore: 0
      };
    }
  }

  /**
   * Detect sentiment evolution over time
   */
  private async detectSentimentEvolution(
    contactId: string,
    currentAnalysis: any,
    historicalData: any[],
    emailId: string,
    userId: string
  ) {
    const events: EvolutionEvent[] = [];

    if (historicalData.length < 2) {
      return { events };
    }

    const currentSentiment = currentAnalysis.sentimentScore;
    const recentSentiments = historicalData
      .slice(-5)  // Last 5 interactions
      .map(h => h.sentiment_score)
      .filter(s => s !== null);

    if (recentSentiments.length < 2) {
      return { events };
    }

    const previousSentiment = recentSentiments[recentSentiments.length - 1];
    const sentimentChange = currentSentiment - previousSentiment;
    const sentimentTrend = this.calculateSentimentTrend(recentSentiments);
    
    // Calculate statistical significance
    const significance = this.calculateChangeSignificance(
      recentSentiments, currentSentiment
    );

    // Only track significant sentiment changes
    if (significance > 0.6 && Math.abs(sentimentChange) > 0.2) {
      // Save to database
      await this.saveSentimentEvolution({
        contactId,
        emailId,
        currentSentiment,
        previousSentiment,
        sentimentChange,
        sentimentTrend,
        significance,
        userId
      });

      // Create evolution event
      const insight = this.generateSentimentInsight(
        sentimentChange, sentimentTrend, significance
      );
      const businessImpact = this.assessSentimentBusinessImpact(
        sentimentChange, sentimentTrend
      );
      const recommendedActions = this.generateSentimentActions(
        sentimentChange, sentimentTrend
      );

      events.push({
        type: 'sentiment_evolution',
        significance,
        confidence: significance * 0.9, // Slightly lower than significance
        insight,
        businessImpact,
        recommendedActions
      });
    }

    return { events };
  }

  /**
   * Detect communication pattern changes
   */
  private async detectCommunicationPatternChanges(
    contactId: string,
    currentAnalysis: any,
    historicalData: any[]
  ) {
    const events: EvolutionEvent[] = [];
    const changes: CommunicationPatternChange[] = [];

    if (historicalData.length < 3) {
      return { events, changes };
    }

    // Analyze different communication patterns
    const patterns = [
      'responseTime',
      'emailLength', 
      'formalityLevel',
      'questionFrequency',
      'urgencyLevel',
      'technicalDepth'
    ];

    for (const pattern of patterns) {
      const change = await this.analyzePatternChange(
        pattern, currentAnalysis, historicalData
      );

      if (change && change.significance > 0.7) {
        changes.push(change);

        // Create evolution event for significant changes
        events.push({
          type: 'communication_pattern',
          significance: change.significance,
          confidence: change.significance * 0.85,
          insight: `${pattern} pattern changed: ${change.trend}`,
          businessImpact: this.assessPatternBusinessImpact(pattern, change),
          recommendedActions: this.generatePatternActions(pattern, change)
        });
      }
    }

    return { events, changes };
  }

  /**
   * Detect behavioral milestones
   */
  private async detectBehavioralMilestones(
    contactId: string,
    currentAnalysis: any,
    historicalData: any[],
    emailId: string,
    userId: string
  ) {
    const events: EvolutionEvent[] = [];
    const milestones: BehavioralMilestone[] = [];

    // Define milestone patterns
    const milestoneChecks = [
      this.checkFirstUrgentEmail(currentAnalysis, historicalData),
      this.checkFormalityBreakdown(currentAnalysis, historicalData),
      this.checkTechnicalDepthIncrease(currentAnalysis, historicalData),
      this.checkDecisionMakerLanguage(currentAnalysis, historicalData),
      this.checkBuyingSignalEscalation(currentAnalysis, historicalData),
      this.checkResponseTimeImprovement(currentAnalysis, historicalData),
      this.checkTopicFocusShift(currentAnalysis, historicalData)
    ];

    for (const milestoneCheck of milestoneChecks) {
      if (milestoneCheck.detected) {
        const milestone: BehavioralMilestone = {
          type: milestoneCheck.type,
          description: milestoneCheck.description,
          importance: milestoneCheck.importance,
          relationshipImpact: milestoneCheck.relationshipImpact,
          businessOpportunityScore: milestoneCheck.businessOpportunityScore
        };

        milestones.push(milestone);

        // Save to database
        await this.saveBehavioralMilestone({
          contactId,
          emailId,
          milestone,
          confidence: milestoneCheck.confidence,
          userId
        });

        // Create evolution event
        events.push({
          type: 'behavioral_milestone',
          significance: milestoneCheck.confidence,
          confidence: milestoneCheck.confidence,
          insight: milestoneCheck.description,
          businessImpact: milestoneCheck.businessImpact,
          recommendedActions: milestoneCheck.recommendedActions
        });
      }
    }

    return { events, milestones };
  }

  /**
   * Analyze current email for various metrics
   */
  private async analyzeCurrentEmail(email: any) {
    const content = email.content || email.body || '';
    
    return {
      sentimentScore: await analyzeTextSentiment(content),
      emailLength: content.length,
      formalityLevel: this.analyzeFormalityLevel(content),
      urgencyLevel: this.analyzeUrgencyLevel(content),
      questionFrequency: this.countQuestions(content),
      technicalDepth: this.analyzeTechnicalDepth(content),
      decisionLanguage: this.analyzeDecisionLanguage(content),
      buyingSignals: this.analyzeBuyingSignals(content),
      topicFocus: this.analyzeTopicFocus(content),
      responsePattern: this.analyzeResponsePattern(email)
    };
  }

  /**
   * Get historical analysis data
   */
  private async getHistoricalAnalysis(contactId: string) {
    const { data, error } = await this.supabase
      .from('contact_analysis_history')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching historical analysis:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calculate sentiment trend from historical data
   */
  private calculateSentimentTrend(sentiments: number[]): string {
    if (sentiments.length < 2) return 'stable';

    const recentTrend = sentiments.slice(-3);
    const isImproving = recentTrend.every((val, i) => 
      i === 0 || val >= recentTrend[i - 1]
    );
    const isDeclining = recentTrend.every((val, i) => 
      i === 0 || val <= recentTrend[i - 1]
    );

    if (isImproving && recentTrend[recentTrend.length - 1] - recentTrend[0] > 0.1) {
      return 'improving';
    } else if (isDeclining && recentTrend[0] - recentTrend[recentTrend.length - 1] > 0.1) {
      return 'declining';
    }

    const variance = this.calculateVariance(sentiments);
    return variance > 0.1 ? 'volatile' : 'stable';
  }

  /**
   * Calculate statistical significance of change
   */
  private calculateChangeSignificance(historical: number[], current: number): number {
    if (historical.length < 2) return 0;

    const mean = historical.reduce((sum, val) => sum + val, 0) / historical.length;
    const variance = this.calculateVariance(historical);
    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation === 0) return 0;

    const zScore = Math.abs(current - mean) / standardDeviation;
    
    // Convert z-score to confidence (rough approximation)
    // z-score > 2 = ~95% confidence, > 1.5 = ~87% confidence
    return Math.min(zScore / 2, 1);
  }

  /**
   * Helper method to calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Milestone detection methods
   */
  private checkFirstUrgentEmail(current: any, historical: any[]) {
    const wasNeverUrgent = historical.every(h => 
      !h.analysis_result?.urgencyLevel || h.analysis_result.urgencyLevel < 0.7
    );
    const isNowUrgent = current.urgencyLevel > 0.7;

    return {
      detected: wasNeverUrgent && isNowUrgent,
      type: 'first_urgent_email',
      description: 'Contact sent their first urgent email - relationship escalation detected',
      importance: 'high' as const,
      relationshipImpact: 'mixed' as const,
      businessOpportunityScore: 0.8,
      confidence: 0.9,
      businessImpact: 'May indicate increased engagement or emerging issues',
      recommendedActions: ['Prioritize response', 'Investigate urgency cause', 'Provide immediate support']
    };
  }

  private checkFormalityBreakdown(current: any, historical: any[]) {
    const wasFormal = historical.slice(-3).every(h => 
      h.analysis_result?.formalityLevel > 0.7
    );
    const isNowCasual = current.formalityLevel < 0.4;

    return {
      detected: wasFormal && isNowCasual && historical.length >= 3,
      type: 'formality_breakdown',
      description: 'Communication became significantly more casual - relationship warming detected',
      importance: 'medium' as const,
      relationshipImpact: 'positive' as const,
      businessOpportunityScore: 0.7,
      confidence: 0.85,
      businessImpact: 'Relationship becoming more personal and trusting',
      recommendedActions: ['Match casual tone', 'Build on personal connection', 'Explore deeper collaboration']
    };
  }

  private checkTechnicalDepthIncrease(current: any, historical: any[]) {
    const avgHistoricalDepth = historical
      .slice(-5)
      .reduce((sum, h) => sum + (h.analysis_result?.technicalDepth || 0), 0) / 
      Math.max(historical.slice(-5).length, 1);
    
    const significantIncrease = current.technicalDepth > avgHistoricalDepth + 0.3;

    return {
      detected: significantIncrease && avgHistoricalDepth > 0,
      type: 'technical_depth_increase',
      description: 'Contact asking more detailed technical questions - serious evaluation detected',
      importance: 'high' as const,
      relationshipImpact: 'positive' as const,
      businessOpportunityScore: 0.85,
      confidence: 0.8,
      businessImpact: 'High likelihood of serious purchase consideration',
      recommendedActions: ['Provide detailed technical resources', 'Arrange technical demo', 'Connect with technical team']
    };
  }

  private checkDecisionMakerLanguage(current: any, historical: any[]) {
    const hasDecisionLanguage = current.decisionLanguage > 0.6;
    const previousDecisionLanguage = historical
      .slice(-3)
      .reduce((sum, h) => sum + (h.analysis_result?.decisionLanguage || 0), 0) / 
      Math.max(historical.slice(-3).length, 1);

    return {
      detected: hasDecisionLanguage && previousDecisionLanguage < 0.3,
      type: 'decision_maker_language',
      description: 'Contact using decision-maker language - authority level increased',
      importance: 'critical' as const,
      relationshipImpact: 'positive' as const,
      businessOpportunityScore: 0.9,
      confidence: 0.88,
      businessImpact: 'Contact likely has decision-making authority',
      recommendedActions: ['Present executive-level proposal', 'Discuss strategic benefits', 'Request formal evaluation']
    };
  }

  private checkBuyingSignalEscalation(current: any, historical: any[]) {
    const currentBuyingSignals = current.buyingSignals;
    const avgHistoricalSignals = historical
      .slice(-3)
      .reduce((sum, h) => sum + (h.analysis_result?.buyingSignals || 0), 0) / 
      Math.max(historical.slice(-3).length, 1);

    return {
      detected: currentBuyingSignals > 0.7 && avgHistoricalSignals < 0.4,
      type: 'buying_signal_escalation',
      description: 'Strong buying signals detected - purchase intent escalation',
      importance: 'critical' as const,
      relationshipImpact: 'positive' as const,
      businessOpportunityScore: 0.95,
      confidence: 0.92,
      businessImpact: 'High probability of immediate sales opportunity',
      recommendedActions: ['Prepare proposal', 'Schedule decision-maker meeting', 'Present pricing options']
    };
  }

  private checkResponseTimeImprovement(current: any, historical: any[]) {
    // This would need email metadata to calculate response times
    return {
      detected: false,
      type: 'response_time_improvement',
      description: '',
      importance: 'medium' as const,
      relationshipImpact: 'neutral' as const,
      businessOpportunityScore: 0,
      confidence: 0,
      businessImpact: '',
      recommendedActions: []
    };
  }

  private checkTopicFocusShift(current: any, historical: any[]) {
    const currentTopics = current.topicFocus;
    const historicalTopics = historical.slice(-3).map(h => h.analysis_result?.topicFocus);
    
    // Simple topic shift detection (would be more sophisticated in real implementation)
    const topicShift = this.calculateTopicSimilarity(currentTopics, historicalTopics) < 0.3;

    return {
      detected: topicShift && historical.length >= 3,
      type: 'topic_focus_shift',
      description: 'Contact changed conversation focus - new interests or priorities detected',
      importance: 'medium' as const,
      relationshipImpact: 'neutral' as const,
      businessOpportunityScore: 0.6,
      confidence: 0.7,
      businessImpact: 'May indicate new opportunities or changing requirements',
      recommendedActions: ['Explore new topic area', 'Understand priority shift', 'Adapt conversation focus']
    };
  }

  /**
   * Analysis helper methods
   */
  private analyzeFormalityLevel(content: string): number {
    const formalWords = ['please', 'thank you', 'regards', 'sincerely', 'respectfully'];
    const casualWords = ['hey', 'thanks', 'cool', 'awesome', 'yeah'];
    
    const formalCount = formalWords.reduce((count, word) => 
      count + (content.toLowerCase().includes(word) ? 1 : 0), 0);
    const casualCount = casualWords.reduce((count, word) => 
      count + (content.toLowerCase().includes(word) ? 1 : 0), 0);
    
    const totalWords = content.split(' ').length;
    const formalScore = formalCount / Math.max(totalWords / 100, 1);
    const casualScore = casualCount / Math.max(totalWords / 100, 1);
    
    return Math.max(0, Math.min(1, (formalScore - casualScore + 1) / 2));
  }

  private analyzeUrgencyLevel(content: string): number {
    const urgentWords = ['urgent', 'asap', 'immediate', 'critical', 'emergency', 'deadline'];
    const urgentCount = urgentWords.reduce((count, word) => 
      count + (content.toLowerCase().includes(word) ? 1 : 0), 0);
    
    const hasMultipleExclamations = (content.match(/!/g) || []).length > 2;
    const hasAllCaps = /[A-Z]{3,}/.test(content);
    
    let urgencyScore = urgentCount * 0.3;
    if (hasMultipleExclamations) urgencyScore += 0.2;
    if (hasAllCaps) urgencyScore += 0.15;
    
    return Math.min(1, urgencyScore);
  }

  private countQuestions(content: string): number {
    const questions = (content.match(/\?/g) || []).length;
    const totalSentences = content.split(/[.!?]+/).length;
    return questions / Math.max(totalSentences, 1);
  }

  private analyzeTechnicalDepth(content: string): number {
    const technicalTerms = [
      'api', 'integration', 'scalability', 'architecture', 'framework', 
      'database', 'security', 'performance', 'specification', 'technical'
    ];
    
    const technicalCount = technicalTerms.reduce((count, term) => 
      count + (content.toLowerCase().includes(term) ? 1 : 0), 0);
    
    const totalWords = content.split(' ').length;
    return Math.min(1, technicalCount / Math.max(totalWords / 50, 1));
  }

  private analyzeDecisionLanguage(content: string): number {
    const decisionPhrases = [
      'i will', 'we will', 'i need', 'we need', 'decision', 'approve', 
      'budget', 'authorize', 'implement', 'proceed', 'move forward'
    ];
    
    const decisionCount = decisionPhrases.reduce((count, phrase) => 
      count + (content.toLowerCase().includes(phrase) ? 1 : 0), 0);
    
    return Math.min(1, decisionCount * 0.2);
  }

  private analyzeBuyingSignals(content: string): number {
    const buyingSignals = [
      'price', 'cost', 'budget', 'timeline', 'contract', 'proposal', 
      'purchase', 'buy', 'implementation', 'rollout', 'next steps'
    ];
    
    const signalCount = buyingSignals.reduce((count, signal) => 
      count + (content.toLowerCase().includes(signal) ? 1 : 0), 0);
    
    return Math.min(1, signalCount * 0.15);
  }

  private analyzeTopicFocus(content: string): string[] {
    // Simple topic extraction (would use more sophisticated NLP in real implementation)
    const topics = content.toLowerCase().split(' ')
      .filter(word => word.length > 4)
      .slice(0, 10);
    
    return topics;
  }

  private analyzeResponsePattern(email: any): any {
    // Would analyze actual response timing from email metadata
    return {
      quickResponse: false,
      normalResponse: true,
      delayedResponse: false
    };
  }

  private calculateTopicSimilarity(current: string[], historical: string[][]): number {
    // Simple Jaccard similarity
    if (!current || !historical.length) return 0;
    
    const historicalFlat = historical.flat();
    const intersection = current.filter(topic => historicalFlat.includes(topic));
    const union = [...new Set([...current, ...historicalFlat])];
    
    return intersection.length / union.length;
  }

  /**
   * Business impact assessment methods
   */
  private generateSentimentInsight(change: number, trend: string, significance: number): string {
    if (change > 0.3 && trend === 'improving') {
      return `Customer sentiment improved significantly (${(change * 100).toFixed(0)}% increase) - relationship strengthening detected`;
    } else if (change < -0.3 && trend === 'declining') {
      return `Customer sentiment declined significantly (${Math.abs(change * 100).toFixed(0)}% decrease) - potential relationship risk`;
    } else if (trend === 'volatile') {
      return 'Customer sentiment showing volatility - may indicate uncertainty or mixed feelings';
    }
    return `Customer sentiment ${trend} with ${(significance * 100).toFixed(0)}% confidence`;
  }

  private assessSentimentBusinessImpact(change: number, trend: string): string {
    if (change > 0.2) {
      return 'Positive sentiment shift may indicate increased likelihood of business success';
    } else if (change < -0.2) {
      return 'Negative sentiment shift may indicate risk of lost opportunity or customer dissatisfaction';
    }
    return 'Sentiment change may affect business relationship dynamics';
  }

  private generateSentimentActions(change: number, trend: string): string[] {
    if (change > 0.2) {
      return ['Capitalize on positive momentum', 'Explore upsell opportunities', 'Request referrals'];
    } else if (change < -0.2) {
      return ['Address potential concerns immediately', 'Reach out proactively', 'Provide additional support'];
    }
    return ['Monitor sentiment closely', 'Maintain consistent communication'];
  }

  private assessPatternBusinessImpact(pattern: string, change: CommunicationPatternChange): string {
    switch (pattern) {
      case 'responseTime':
        return change.trend === 'improving' ? 
          'Faster responses may indicate increased engagement' :
          'Slower responses may indicate decreased priority';
      case 'technicalDepth':
        return change.trend === 'improving' ? 
          'Increased technical interest suggests serious evaluation' :
          'Decreased technical interest may indicate moving away from solution';
      default:
        return `${pattern} pattern change may affect relationship dynamics`;
    }
  }

  private generatePatternActions(pattern: string, change: CommunicationPatternChange): string[] {
    switch (pattern) {
      case 'urgencyLevel':
        return change.trend === 'improving' ? 
          ['Prioritize this contact', 'Respond immediately', 'Investigate urgency cause'] :
          ['Maintain normal response cadence'];
      case 'technicalDepth':
        return change.trend === 'improving' ? 
          ['Provide technical resources', 'Arrange technical demo', 'Connect with technical team'] :
          ['Focus on business benefits', 'Simplify messaging'];
      default:
        return ['Monitor pattern closely', 'Adjust communication style accordingly'];
    }
  }

  /**
   * Database operations
   */
  private async saveSentimentEvolution(data: {
    contactId: string;
    emailId: string;
    currentSentiment: number;
    previousSentiment: number;
    sentimentChange: number;
    sentimentTrend: string;
    significance: number;
    userId: string;
  }) {
    const { error } = await this.supabase
      .from('sentiment_evolution_events')
      .insert({
        contact_id: data.contactId,
        email_id: data.emailId,
        current_sentiment_score: data.currentSentiment,
        previous_sentiment_score: data.previousSentiment,
        sentiment_change: data.sentimentChange,
        sentiment_trend: data.sentimentTrend,
        change_significance: data.significance,
        confidence_level: data.significance * 0.9,
        trigger_event: 'email_analysis',
        business_impact_assessment: this.assessSentimentBusinessImpact(data.sentimentChange, data.sentimentTrend),
        recommended_actions: this.generateSentimentActions(data.sentimentChange, data.sentimentTrend),
        user_id: data.userId
      });

    if (error) {
      console.error('Error saving sentiment evolution:', error);
    }
  }

  private async saveBehavioralMilestone(data: {
    contactId: string;
    emailId: string;
    milestone: BehavioralMilestone;
    confidence: number;
    userId: string;
  }) {
    const { error } = await this.supabase
      .from('behavioral_milestone_events')
      .insert({
        contact_id: data.contactId,
        email_id: data.emailId,
        milestone_type: data.milestone.type,
        milestone_description: data.milestone.description,
        milestone_importance: data.milestone.importance,
        confidence_score: data.confidence,
        relationship_impact: data.milestone.relationshipImpact,
        business_opportunity_score: data.milestone.businessOpportunityScore,
        user_id: data.userId
      });

    if (error) {
      console.error('Error saving behavioral milestone:', error);
    }
  }

  private async updateCommunicationMetrics(
    contactId: string,
    currentAnalysis: any,
    historicalData: any[]
  ) {
    // Calculate metrics from historical data
    const metrics = this.calculateCommunicationMetrics(currentAnalysis, historicalData);
    
    const { error } = await this.supabase
      .from('contact_communication_metrics')
      .upsert({
        contact_id: contactId,
        metric_date: new Date().toISOString().split('T')[0],
        avg_email_length: metrics.avgEmailLength,
        formality_score: metrics.formalityScore,
        urgency_frequency: metrics.urgencyFrequency,
        technical_depth_score: metrics.technicalDepthScore,
        question_frequency: metrics.questionFrequency,
        decision_language_frequency: metrics.decisionLanguageFrequency,
        buying_signal_frequency: metrics.buyingSignalFrequency,
        relationship_warmth_score: metrics.relationshipWarmthScore,
        total_emails_analyzed: historicalData.length + 1
      });

    if (error) {
      console.error('Error updating communication metrics:', error);
    }
  }

  private calculateCommunicationMetrics(currentAnalysis: any, historicalData: any[]) {
    const allData = [...historicalData, { analysis_result: currentAnalysis }];
    
    return {
      avgEmailLength: allData.reduce((sum, d) => sum + (d.analysis_result?.emailLength || 0), 0) / allData.length,
      formalityScore: allData.reduce((sum, d) => sum + (d.analysis_result?.formalityLevel || 0), 0) / allData.length,
      urgencyFrequency: allData.reduce((sum, d) => sum + (d.analysis_result?.urgencyLevel || 0), 0) / allData.length,
      technicalDepthScore: allData.reduce((sum, d) => sum + (d.analysis_result?.technicalDepth || 0), 0) / allData.length,
      questionFrequency: allData.reduce((sum, d) => sum + (d.analysis_result?.questionFrequency || 0), 0) / allData.length,
      decisionLanguageFrequency: allData.reduce((sum, d) => sum + (d.analysis_result?.decisionLanguage || 0), 0) / allData.length,
      buyingSignalFrequency: allData.reduce((sum, d) => sum + (d.analysis_result?.buyingSignals || 0), 0) / allData.length,
      relationshipWarmthScore: 1 - (allData.reduce((sum, d) => sum + (d.analysis_result?.formalityLevel || 0), 0) / allData.length)
    };
  }

  private async analyzePatternChange(
    pattern: string,
    currentAnalysis: any,
    historicalData: any[]
  ): Promise<CommunicationPatternChange | null> {
    if (historicalData.length < 3) return null;

    const currentValue = currentAnalysis[pattern];
    const historicalValues = historicalData.map(h => h.analysis_result?.[pattern] || 0);
    
    if (historicalValues.every(v => v === 0) && currentValue === 0) return null;

    const avgHistorical = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
    const change = currentValue - avgHistorical;
    const significance = this.calculateChangeSignificance(historicalValues, currentValue);

    if (significance < 0.5) return null;

    const trend = change > 0.1 ? 'improving' : 
                 change < -0.1 ? 'declining' : 
                 this.calculateVariance(historicalValues) > 0.1 ? 'volatile' : 'stable';

    return {
      pattern,
      previousValue: avgHistorical,
      currentValue,
      trend,
      significance
    };
  }
} 
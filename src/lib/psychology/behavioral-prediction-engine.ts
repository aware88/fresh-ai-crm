/**
 * Behavioral Prediction Engine (Phase 2)
 * 
 * Predicts customer behaviors from communication patterns:
 *  - Communication evolution (latency, tone, complexity)
 *  - Decision-making timeline (time-to-next action)
 *  - Next-best action recommendations
 */

import { createServerClient } from '@/lib/supabase/server';

export type CommunicationSignal = {
  timestamp: string;
  source: 'email' | 'meeting' | 'call' | 'note';
  responseLatencySec?: number; // Latency from our last message
  messageLength?: number; // Characters
  sentiment?: 'positive' | 'neutral' | 'negative' | 'frustrated';
  tone?: 'formal' | 'casual' | 'direct' | 'empathetic' | 'technical';
  complexity?: number; // 0-1 normalized measure
  urgencyKeywords?: string[];
};

export type CommunicationEvolution = {
  trend: 'increasing_engagement' | 'decreasing_engagement' | 'stable' | 'volatile';
  averageResponseLatencySec: number;
  averageMessageLength: number;
  sentimentBalance: { positive: number; neutral: number; negative: number; frustrated: number };
  toneDistribution: Record<string, number>;
  confidence: number; // 0-1
  factors: string[];
};

export type ActionPrediction = {
  nextBestAction: 'send_followup' | 'schedule_call' | 'share_case_study' | 'proposal' | 'wait' | 'escalate';
  recommendedTimingHours: number; // When to act
  expectedImpact: 'low' | 'medium' | 'high';
  probability: number; // 0-1
  reasoning: string;
};

export class BehavioralPredictionEngine {
  private supabase: any;

  constructor() {
    this.supabase = createServerClient();
  }

  /**
   * Analyze communication signals to detect evolution patterns
   */
  async analyzeCommunicationEvolution(
    contactId: string,
    organizationId: string,
    signals: CommunicationSignal[]
  ): Promise<CommunicationEvolution> {
    // Aggregate simple stats; replace with advanced analytics over time
    const latencies = signals.map(s => s.responseLatencySec || 0).filter(v => v > 0);
    const lengths = signals.map(s => s.messageLength || 0).filter(v => v > 0);

    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const avgLength = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;

    const sentimentCount = { positive: 0, neutral: 0, negative: 0, frustrated: 0 };
    const toneDist: Record<string, number> = {};

    for (const s of signals) {
      if (s.sentiment && sentimentCount[s.sentiment] !== undefined) {
        sentimentCount[s.sentiment] += 1;
      }
      if (s.tone) {
        toneDist[s.tone] = (toneDist[s.tone] || 0) + 1;
      }
    }

    const trend = this.estimateTrend(signals);

    return {
      trend,
      averageResponseLatencySec: avgLatency,
      averageMessageLength: avgLength,
      sentimentBalance: sentimentCount,
      toneDistribution: toneDist,
      confidence: 0.7,
      factors: ['basic_signal_statistics', 'latency_and_length_trends']
    };
  }

  /**
   * Predict the next best action and timing based on evolution and context
   */
  async predictNextAction(
    evolution: CommunicationEvolution,
    context: {
      lastInteractionAt?: string;
      relationshipStage?: 'new' | 'evaluating' | 'negotiating' | 'customer' | 'lost';
      opportunityScore?: number; // 0-100
    }
  ): Promise<ActionPrediction> {
    // Simple rules with clear reasoning; to be replaced by model-driven scoring
    let action: ActionPrediction['nextBestAction'] = 'send_followup';
    let hours = 24;
    let impact: ActionPrediction['expectedImpact'] = 'medium';
    const reasons: string[] = [];

    if (evolution.trend === 'increasing_engagement') {
      action = 'schedule_call';
      hours = 12;
      impact = 'high';
      reasons.push('engagement_increasing');
    }

    if (evolution.sentimentBalance.negative + evolution.sentimentBalance.frustrated > evolution.sentimentBalance.positive) {
      action = 'escalate';
      hours = 6;
      impact = 'high';
      reasons.push('negative_sentiment_dominant');
    }

    if ((context.opportunityScore || 0) >= 75 && evolution.trend !== 'decreasing_engagement') {
      action = 'proposal';
      hours = 8;
      impact = 'high';
      reasons.push('high_opportunity_score');
    }

    if (evolution.trend === 'decreasing_engagement') {
      action = 'share_case_study';
      hours = 24;
      impact = 'medium';
      reasons.push('engagement_declining');
    }

    const probability = Math.min(0.9, 0.5 + (context.opportunityScore || 0) / 200 + (impact === 'high' ? 0.2 : 0));

    return {
      nextBestAction: action,
      recommendedTimingHours: hours,
      expectedImpact: impact,
      probability,
      reasoning: reasons.join(', ') || 'baseline_rule'
    };
  }

  private estimateTrend(signals: CommunicationSignal[]): CommunicationEvolution['trend'] {
    if (!signals.length) return 'stable';

    const last = signals.slice(-5);
    const latencies = last.map(s => s.responseLatencySec || 0);
    const messages = last.map(s => s.messageLength || 0);

    const latencyChange = this.delta(latencies);
    const lengthChange = this.delta(messages);

    if (lengthChange > 0.15 && latencyChange < -0.15) return 'increasing_engagement';
    if (lengthChange < -0.15 && latencyChange > 0.15) return 'decreasing_engagement';
    if (Math.abs(lengthChange) + Math.abs(latencyChange) > 0.6) return 'volatile';
    return 'stable';
  }

  private delta(values: number[]): number {
    if (values.length < 2) return 0;
    const first = values[0] || 1; // avoid division by zero
    const last = values[values.length - 1];
    if (!first) return 0;
    return (last - first) / Math.max(1, Math.abs(first));
  }
}

export const behavioralPredictionEngine = new BehavioralPredictionEngine();

/**
 * Signal Extractor
 *
 * Builds normalized communication signals from recent emails/interactions
 * for use by the Behavioral Prediction Engine.
 */

import { createServerClient } from '@/lib/supabase/server';
import type { CommunicationSignal } from './behavioral-prediction-engine';

export class SignalExtractor {
  private supabase: any;

  constructor() {
    this.supabase = createServerClient();
  }

  /**
   * Extract last N email interactions and convert to signals
   */
  async extractEmailSignals(
    contactId: string,
    organizationId: string,
    limit: number = 25
  ): Promise<CommunicationSignal[]> {
    const supabase = await this.supabase;

    // Pull recent emails for this contact
    const { data: emails } = await supabase
      .from('emails')
      .select('id, created_at, subject, raw_content, analysis, metadata')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!emails || emails.length === 0) return [];

    const signals: CommunicationSignal[] = [];

    for (let i = 0; i < emails.length; i++) {
      const e = emails[i] as any;
      const prev = emails[i + 1] as any | undefined;

      const responseLatencySec = prev
        ? Math.max(0, (new Date(e.created_at).getTime() - new Date(prev.created_at).getTime()) / 1000)
        : undefined;

      const content: string = e.raw_content || '';
      const length = content.length;

      const sentiment = e.analysis?.sentiment as CommunicationSignal['sentiment'];
      const tone = e.analysis?.tone as CommunicationSignal['tone'];
      const complexity = this.estimateComplexity(content);
      const urgencyKeywords = this.extractUrgencyKeywords(content);

      signals.push({
        timestamp: e.created_at,
        source: 'email',
        responseLatencySec,
        messageLength: length,
        sentiment: sentiment || 'neutral',
        tone: tone || 'formal',
        complexity,
        urgencyKeywords,
      });
    }

    return signals.reverse(); // chronological order
  }

  private estimateComplexity(text: string): number {
    if (!text) return 0.2;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
    const tokens = text.trim().split(/\s+/).filter(Boolean).length || 1;
    const avgLen = tokens / sentences;
    // normalize: simple heuristic
    return Math.max(0, Math.min(1, (avgLen - 8) / 20 + 0.3));
  }

  private extractUrgencyKeywords(text: string): string[] {
    if (!text) return [];
    const kws = ['urgent', 'asap', 'deadline', 'today', 'immediately', 'priority', 'emergency'];
    const lower = text.toLowerCase();
    return kws.filter(k => lower.includes(k));
  }
}

export const signalExtractor = new SignalExtractor();

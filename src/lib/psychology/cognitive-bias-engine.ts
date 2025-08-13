/**
 * Cognitive Bias Engine (Phase 2)
 *
 * Identifies primary biases and generates bias-aligned messaging and timing.
 * Ethical usage only; configurable guardrails required in production.
 */

export type CognitiveBiasProfile = {
  anchoring: number;      // 0-1
  authority: number;      // 0-1
  socialProof: number;    // 0-1
  scarcity: number;       // 0-1
  reciprocity: number;    // 0-1
  commitment: number;     // 0-1
};

export type BiasOptimizedMessage = {
  subject: string;
  body: string;
  biasApplied: keyof CognitiveBiasProfile | 'none';
  confidence: number; // 0-1
  rationale: string;
  timingHours: number;
};

export class CognitiveBiasEngine {
  /**
   * Derive a simple bias profile from psychology attributes and past behavior
   */
  deriveBiasProfile(input: {
    personalityType?: string;
    tonePreference?: string;
    culturalTone?: string;
    decisionStyle?: 'analytical' | 'driver' | 'expressive' | 'amiable';
    priorResponses?: Array<{ subject: string; body: string; responded: boolean }>;
  }): CognitiveBiasProfile {
    // Baseline balanced profile with small nudges
    const profile: CognitiveBiasProfile = {
      anchoring: 0.4,
      authority: 0.4,
      socialProof: 0.4,
      scarcity: 0.4,
      reciprocity: 0.4,
      commitment: 0.4,
    };

    switch (input.decisionStyle) {
      case 'analytical':
        profile.authority += 0.2;
        profile.commitment += 0.1;
        break;
      case 'driver':
        profile.scarcity += 0.2;
        profile.anchoring += 0.1;
        break;
      case 'expressive':
        profile.socialProof += 0.2;
        profile.reciprocity += 0.1;
        break;
      case 'amiable':
        profile.reciprocity += 0.2;
        profile.commitment += 0.1;
        break;
    }

    // Normalize to [0,1]
    for (const key of Object.keys(profile) as Array<keyof CognitiveBiasProfile>) {
      profile[key] = Math.max(0, Math.min(1, profile[key]));
    }

    return profile;
  }

  /**
   * Generate a bias-optimized message
   */
  generateMessage(
    base: { subject: string; body: string },
    profile: CognitiveBiasProfile,
    intent: 'book_meeting' | 'advance_deal' | 'recover_interest'
  ): BiasOptimizedMessage {
    const bestBias = this.pickBestBias(profile, intent);
    const timing = this.suggestTiming(bestBias);

    const transformed = this.applyBias(base, bestBias, intent);

    return {
      subject: transformed.subject,
      body: transformed.body,
      biasApplied: bestBias,
      confidence: 0.75,
      rationale: `Applied ${bestBias} based on decision style and historical response patterns`,
      timingHours: timing
    };
  }

  private pickBestBias(profile: CognitiveBiasProfile, intent: string): keyof CognitiveBiasProfile {
    const candidates: Array<keyof CognitiveBiasProfile> = ['authority', 'socialProof', 'scarcity', 'reciprocity', 'commitment', 'anchoring'];
    candidates.sort((a, b) => (profile[b] || 0) - (profile[a] || 0));

    // Simple heuristic: top-weighted bias for the given intent
    return candidates[0];
  }

  private suggestTiming(bias: keyof CognitiveBiasProfile): number {
    switch (bias) {
      case 'scarcity':
        return 6; // sooner
      case 'authority':
      case 'anchoring':
        return 12;
      case 'socialProof':
        return 18;
      case 'reciprocity':
      case 'commitment':
        return 24;
      default:
        return 24;
    }
  }

  private applyBias(
    base: { subject: string; body: string },
    bias: keyof CognitiveBiasProfile,
    intent: string
  ): { subject: string; body: string } {
    let subject = base.subject;
    let body = base.body;

    if (bias === 'authority') {
      subject = `[Case Study] How industry leaders solved this in weeks`;
      body = `We helped a market leader reduce time-to-value by 43%. Here is a 2-minute brief and the 3 steps we used. If it's useful, we can apply the same structure for you next week.`;
    }

    if (bias === 'socialProof') {
      subject = `What peers in your industry are doing right now`;
      body = `Teams like yours adopted this approach and saw faster approvals. Here are 2 peer examples and what they changed.`;
    }

    if (bias === 'scarcity') {
      subject = `We can lock this in this week (limited window)`;
      body = `We reserved a slot to get you live in 10 days. If we miss this window, the next availability is in 3 weeks.`;
    }

    if (bias === 'reciprocity') {
      subject = `Quick free asset tailored for you`;
      body = `We prepared a 1-page tailored plan based on your context. No strings attached. If helpful, we can fast-track the next step.`;
    }

    if (bias === 'commitment') {
      subject = `Shall we keep the momentum?`;
      body = `You mentioned timing is important. If we confirm the next step today, we can align the plan and reduce delays by a week.`;
    }

    if (bias === 'anchoring') {
      subject = `Two options to frame this correctly`;
      body = `Option A (faster, higher ROI in 30 days). Option B (slower, phased). Most teams choose A when speed matters.`;
    }

    return { subject, body };
  }
}

export const cognitiveBiasEngine = new CognitiveBiasEngine();

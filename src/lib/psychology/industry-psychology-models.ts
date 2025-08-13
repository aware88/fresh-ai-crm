/**
 * Industry Psychology Models (Phase 2)
 *
 * Provides industry-aware communication and persuasion strategies.
 */

export type Industry = 'healthcare' | 'manufacturing' | 'tech' | 'finance' | 'automotive' | 'retail';

export interface IndustryPsychologyModel {
  industry: Industry;
  decisionMakingStyle: 'risk_averse' | 'compliance_first' | 'data_driven' | 'speed_oriented' | 'consensus';
  commonConcerns: string[];
  persuasionTactics: string[];
  communicationPreferences: Array<'email' | 'call' | 'meeting' | 'deck' | 'case_study' | 'security_doc'>;
  buyingCycles: Array<'short' | 'medium' | 'long'>;
}

const MODELS: Record<Industry, IndustryPsychologyModel> = {
  healthcare: {
    industry: 'healthcare',
    decisionMakingStyle: 'compliance_first',
    commonConcerns: ['compliance', 'security', 'patient safety', 'vendor reliability'],
    persuasionTactics: ['authority', 'case_study', 'risk_mitigation'],
    communicationPreferences: ['email', 'security_doc', 'case_study', 'meeting'],
    buyingCycles: ['medium', 'long']
  },
  manufacturing: {
    industry: 'manufacturing',
    decisionMakingStyle: 'data_driven',
    commonConcerns: ['downtime risk', 'integration', 'timeline', 'specs'],
    persuasionTactics: ['anchoring', 'ROI', 'timeline_assurance'],
    communicationPreferences: ['email', 'deck', 'meeting', 'case_study'],
    buyingCycles: ['medium']
  },
  tech: {
    industry: 'tech',
    decisionMakingStyle: 'speed_oriented',
    commonConcerns: ['velocity', 'integration', 'APIs', 'scalability'],
    persuasionTactics: ['social_proof', 'authority', 'product_fit'],
    communicationPreferences: ['email', 'deck', 'call'],
    buyingCycles: ['short']
  },
  finance: {
    industry: 'finance',
    decisionMakingStyle: 'compliance_first',
    commonConcerns: ['risk', 'compliance', 'auditability', 'availability'],
    persuasionTactics: ['authority', 'security_assurance', 'peer_validation'],
    communicationPreferences: ['email', 'security_doc', 'meeting'],
    buyingCycles: ['medium', 'long']
  },
  automotive: {
    industry: 'automotive',
    decisionMakingStyle: 'data_driven',
    commonConcerns: ['compatibility', 'supply', 'timing', 'cost'],
    persuasionTactics: ['ROI', 'case_study', 'timeline_assurance'],
    communicationPreferences: ['email', 'case_study', 'meeting'],
    buyingCycles: ['medium']
  },
  retail: {
    industry: 'retail',
    decisionMakingStyle: 'consensus',
    commonConcerns: ['seasonality', 'time_to_value', 'ops_disruption'],
    persuasionTactics: ['social_proof', 'scarcity', 'ROI'],
    communicationPreferences: ['email', 'deck', 'call'],
    buyingCycles: ['short', 'medium']
  }
};

export class IndustryPsychologyModels {
  getModel(industry: Industry): IndustryPsychologyModel {
    return MODELS[industry];
  }

  /**
   * Apply an industry model to adapt messaging strategy
   */
  adaptMessage(
    industry: Industry,
    base: { subject: string; body: string }
  ): { subject: string; body: string; rationale: string[] } {
    const model = MODELS[industry];
    const rationale: string[] = [];
    let subject = base.subject;
    let body = base.body;

    if (model.persuasionTactics.includes('authority')) {
      rationale.push('industry_prefers_authority');
      subject = subject.includes('[Case Study]') ? subject : `[Case Study] ${subject}`;
    }

    if (model.persuasionTactics.includes('ROI')) {
      rationale.push('roi_focus');
      body += `\n\nExpected ROI window: 30–90 days based on similar ${industry} teams.`;
    }

    if (model.persuasionTactics.includes('timeline_assurance')) {
      rationale.push('timeline_assurance');
      body += `\n\nWe can de-risk your timeline with a staged rollout plan (week 1: setup, week 2: validation).`;
    }

    if (model.communicationPreferences.includes('security_doc')) {
      rationale.push('security_concerns');
      body += `\n\nSecurity + compliance summary attached (SOC2, GDPR alignment).`;
    }

    return { subject, body, rationale };
  }
}

export const industryPsychologyModels = new IndustryPsychologyModels();

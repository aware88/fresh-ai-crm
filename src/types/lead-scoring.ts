/**
 * Lead Scoring System Types
 * Comprehensive types for the lead qualification system
 */

export type QualificationStatus = 'hot' | 'warm' | 'cold' | 'unqualified';

export type ScoringCategory = 
  | 'demographic' 
  | 'behavioral' 
  | 'engagement' 
  | 'company' 
  | 'email' 
  | 'recency';

export type ConditionType = 
  | 'equals' 
  | 'contains' 
  | 'greater_than' 
  | 'less_than' 
  | 'exists' 
  | 'not_like';

export interface LeadScore {
  id: string;
  contact_id: string;
  overall_score: number;
  demographic_score: number;
  behavioral_score: number;
  engagement_score: number;
  company_score: number;
  email_interaction_score: number;
  recency_score: number;
  qualification_status: QualificationStatus;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  organization_id?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadScoringCriteria {
  id: string;
  criteria_name: string;
  criteria_category: ScoringCategory;
  weight: number;
  condition_type: ConditionType;
  condition_field: string;
  condition_value?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  organization_id?: string;
}

export interface LeadScoringHistory {
  id: string;
  contact_id: string;
  previous_score?: number;
  new_score: number;
  score_change: number;
  change_reason?: string;
  triggered_by: string;
  created_at: string;
  user_id: string;
  organization_id?: string;
}

export interface ContactWithScore {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  notes?: string;
  status: string;
  createdat: string;
  updatedat: string;
  lastcontact?: string;
  full_name?: string;
  user_id: string;
  organization_id?: string;
  lead_score?: LeadScore;
}

export interface ScoreBreakdown {
  demographic: {
    score: number;
    max: number;
    factors: string[];
  };
  behavioral: {
    score: number;
    max: number;
    factors: string[];
  };
  engagement: {
    score: number;
    max: number;
    factors: string[];
  };
  company: {
    score: number;
    max: number;
    factors: string[];
  };
  email_interaction: {
    score: number;
    max: number;
    factors: string[];
  };
  recency: {
    score: number;
    max: number;
    factors: string[];
  };
}

export interface LeadScoringSettings {
  auto_calculate: boolean;
  score_thresholds: {
    hot: number;
    warm: number;
    cold: number;
  };
  notification_settings: {
    score_increase: boolean;
    status_change: boolean;
    threshold: number;
  };
  custom_criteria: LeadScoringCriteria[];
}

export interface LeadScoringAnalytics {
  total_contacts: number;
  scored_contacts: number;
  qualification_distribution: {
    hot: number;
    warm: number;
    cold: number;
    unqualified: number;
  };
  average_score: number;
  score_trends: Array<{
    date: string;
    average_score: number;
    total_contacts: number;
  }>;
  top_scoring_factors: Array<{
    factor: string;
    impact: number;
    frequency: number;
  }>;
}
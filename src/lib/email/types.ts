/**
 * Email Learning Service Types
 * Extracted from email-learning-service for better type organization
 */

export interface EmailLearningPattern {
  id?: string;
  pattern_type: string;
  context_category: string;
  trigger_keywords: string[];
  trigger_phrases?: string[];
  sender_patterns?: string[];
  response_template: string;
  confidence_score: number;
  success_rate?: number;
  usage_count?: number;
  last_used_at?: string | null;
  example_pairs: Array<{ question: string; answer: string }>;
  learning_quality?: string;
  metadata?: {
    language?: string;
    writing_style_notes?: string;
    context_indicators?: string[];
    multilingual_notes?: string;
    relationship_context?: string;
    urgency_handling?: string;
    cultural_markers?: string[];
    formality_level?: string;
    response_length_preference?: string;
    technical_depth?: string;
  };
}

export interface LearningAnalysis {
  patterns_found: number;
  quality_score: number;
  recommendations: string[];
  processing_time_ms: number;
  cost_usd: number;
  tokens_used: number;
}

export interface EmailPair {
  received_email: {
    id: string;
    subject: string;
    body: string;
    sender: string;
    received_at: string;
  };
  sent_response?: {
    id: string;
    subject: string;
    body: string;
    sent_at: string;
  };
}

export interface LearningProgress {
  total_emails_analyzed: number;
  patterns_extracted: number;
  quality_improvements: number;
  last_learning_session: string | null;
  next_suggested_learning: string | null;
}

export interface LearningQualityMetrics {
  accuracy_score: number;
  response_relevance: number;
  language_consistency: number;
  style_matching: number;
  overall_quality: number;
}
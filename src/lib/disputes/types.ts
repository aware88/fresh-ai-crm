import { Contact } from '../contacts/types';

/**
 * Dispute categories
 */
export enum DisputeCategory {
  COMMUNICATION_MISUNDERSTANDING = 'communication_misunderstanding',
  DELIVERY_ISSUE = 'delivery_issue',
  QUALITY_CONCERN = 'quality_concern',
  PRICING_DISAGREEMENT = 'pricing_disagreement',
  CONTRACT_TERMS = 'contract_terms',
  TIMELINE_DELAY = 'timeline_delay',
  SCOPE_CREEP = 'scope_creep',
  PAYMENT_ISSUE = 'payment_issue',
  INTERPERSONAL_CONFLICT = 'interpersonal_conflict',
  OTHER = 'other'
}

/**
 * Dispute severity levels
 */
export enum DisputeSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Dispute status
 */
export enum DisputeStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated'
}

/**
 * Resolution step in a dispute resolution strategy
 */
export interface ResolutionStep {
  order: number;
  action: string;
  rationale: string;
  expectedResponse?: string;
}

/**
 * Resolution strategy for a dispute
 */
export interface ResolutionStrategy {
  summary: string;
  approachSteps: ResolutionStep[];
  communicationTips: string[];
  phrasesToUse: string[];
  phrasesToAvoid: string[];
  followUpRecommendation: string;
}

/**
 * Dispute details
 */
export interface DisputeDetails {
  id: string;
  contactId: string;
  category: DisputeCategory;
  severity: DisputeSeverity;
  status: DisputeStatus;
  description: string;
  context: string;
  desiredOutcome: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolutionStrategy?: ResolutionStrategy;
}

/**
 * Input for creating a dispute resolution request
 */
export interface DisputeResolutionRequest {
  contactId: string;
  category: DisputeCategory;
  severity: DisputeSeverity;
  description: string;
  context: string;
  desiredOutcome: string;
}

/**
 * Response from dispute resolution analysis
 */
export interface DisputeResolutionResponse {
  success: boolean;
  message: string;
  dispute?: DisputeDetails;
}

/**
 * Pipeline Management System Types
 * Comprehensive types for sales pipeline and opportunity management
 */

export type OpportunityStatus = 'active' | 'won' | 'lost' | 'on_hold';
export type OpportunityPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityType = 
  | 'stage_changed' 
  | 'value_updated' 
  | 'note_added' 
  | 'email_sent' 
  | 'call_made' 
  | 'meeting_scheduled'
  | 'document_shared'
  | 'proposal_sent'
  | 'contract_signed';

export type StageType = 'active' | 'won' | 'lost';

export interface SalesPipeline {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  organization_id?: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  description?: string;
  stage_type: StageType;
  probability: number; // 0-100
  sort_order: number;
  color: string;
  is_active: boolean;
  auto_advance_conditions?: Record<string, unknown>;
  required_fields?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  organization_id?: string;
  metadata?: Record<string, unknown>;
}

export interface SalesOpportunity {
  id: string;
  title: string;
  description?: string;
  contact_id?: string;
  pipeline_id: string;
  stage_id: string;
  lead_score_id?: string;
  
  // Financial information
  value?: number;
  currency: string;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  
  // Assignment and ownership
  assigned_to?: string;
  team_members: string[];
  
  // Status and tracking
  status: OpportunityStatus;
  source?: string;
  priority: OpportunityPriority;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  stage_entered_at: string;
  last_activity_at: string;
  
  // Multi-tenancy
  created_by: string;
  organization_id?: string;
  
  // Additional data
  tags: string[];
  custom_fields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface OpportunityActivity {
  id: string;
  opportunity_id: string;
  activity_type: ActivityType;
  description?: string;
  
  // Activity details
  previous_value?: string;
  new_value?: string;
  previous_stage_id?: string;
  new_stage_id?: string;
  
  // Activity metadata
  duration_minutes?: number;
  outcome?: string;
  next_action?: string;
  next_action_date?: string;
  
  // User and timing
  created_at: string;
  created_by: string;
  organization_id?: string;
  
  metadata?: Record<string, unknown>;
}

export interface PipelineMetrics {
  id: string;
  pipeline_id: string;
  stage_id?: string;
  metric_date: string;
  
  // Opportunity metrics
  opportunities_count: number;
  total_value: number;
  average_value: number;
  weighted_value: number;
  
  // Conversion metrics
  opportunities_entered: number;
  opportunities_advanced: number;
  opportunities_won: number;
  opportunities_lost: number;
  
  // Time metrics
  average_days_in_stage: number;
  median_days_in_stage: number;
  
  // Performance metrics
  conversion_rate: number;
  win_rate: number;
  velocity: number;
  
  created_at: string;
  organization_id?: string;
}

// Extended types for UI components
export interface OpportunityWithDetails extends SalesOpportunity {
  contact?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    company?: string;
  };
  pipeline?: SalesPipeline;
  stage?: PipelineStage;
  lead_score?: {
    overall_score: number;
    qualification_status: string;
  };
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  recent_activities?: OpportunityActivity[];
  activity_count?: number;
}

export interface PipelineWithStages extends SalesPipeline {
  stages: PipelineStage[];
  opportunities_count?: number;
  total_value?: number;
  weighted_value?: number;
}

export interface StageWithOpportunities extends PipelineStage {
  opportunities: OpportunityWithDetails[];
  opportunities_count: number;
  total_value: number;
  weighted_value: number;
}

export interface PipelineSummary {
  pipeline_id: string;
  pipeline_name: string;
  total_opportunities: number;
  total_value: number;
  weighted_value: number;
  average_deal_size: number;
  stages: Array<{
    stage_id: string;
    stage_name: string;
    sort_order: number;
    probability: number;
    color: string;
    opportunities_count: number;
    total_value: number;
    weighted_value: number;
  }>;
}

export interface PipelineAnalytics {
  pipeline_id: string;
  pipeline_name: string;
  date_range: {
    start: string;
    end: string;
  };
  
  // Overall metrics
  total_opportunities: number;
  total_value: number;
  weighted_pipeline_value: number;
  average_deal_size: number;
  
  // Performance metrics
  win_rate: number;
  average_sales_cycle: number; // days
  conversion_rate: number;
  velocity: number; // deals closed per month
  
  // Stage analysis
  stage_conversion_rates: Array<{
    stage_name: string;
    conversion_rate: number;
    average_time: number;
    drop_off_rate: number;
  }>;
  
  // Trend data
  monthly_trends: Array<{
    month: string;
    opportunities_created: number;
    opportunities_won: number;
    opportunities_lost: number;
    total_value: number;
    win_rate: number;
  }>;
  
  // Team performance
  team_performance: Array<{
    user_id: string;
    user_name: string;
    opportunities_count: number;
    total_value: number;
    win_rate: number;
    average_deal_size: number;
  }>;
  
  // Lead score correlation
  lead_score_performance?: Array<{
    score_range: string;
    opportunities_count: number;
    win_rate: number;
    average_value: number;
  }>;
}

export interface PipelineSettings {
  auto_advance_enabled: boolean;
  required_fields_per_stage: Record<string, string[]>;
  notification_settings: {
    stage_changes: boolean;
    stale_opportunities: boolean;
    close_date_reminders: boolean;
    threshold_days: number;
  };
  probability_settings: {
    auto_calculate: boolean;
    use_ai_predictions: boolean;
    manual_override: boolean;
  };
  team_settings: {
    auto_assignment: boolean;
    round_robin: boolean;
    load_balancing: boolean;
    assignment_rules: Array<{
      condition: string;
      assigned_to: string;
    }>;
  };
}

// Drag and drop types for UI
export interface DragItem {
  id: string;
  type: 'opportunity';
  opportunity: OpportunityWithDetails;
  sourceStageId: string;
}

export interface DropResult {
  opportunityId: string;
  sourceStageId: string;
  targetStageId: string;
  position?: number;
}

// Form types
export interface CreateOpportunityForm {
  title: string;
  description?: string;
  contact_id?: string;
  pipeline_id: string;
  stage_id: string;
  value?: number;
  currency?: string;
  expected_close_date?: string;
  assigned_to?: string;
  priority?: OpportunityPriority;
  source?: string;
  tags?: string[];
}

export interface UpdateOpportunityForm extends Partial<CreateOpportunityForm> {
  id: string;
}

export interface CreatePipelineForm {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  stages: Array<{
    name: string;
    description?: string;
    probability: number;
    color?: string;
  }>;
}

export interface MoveOpportunityRequest {
  opportunity_id: string;
  new_stage_id: string;
  note?: string;
}
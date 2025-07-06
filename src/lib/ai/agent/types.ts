/**
 * Sales Agent Types
 * 
 * This file defines the core types used by the sales agent system.
 */

import { AIMemoryType } from '../memory/ai-memory-service';

/**
 * Agent personality traits
 */
export interface AgentPersonality {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  tone: string[];
  communication_style: string;
  empathy_level: number; // 0-1 scale
  assertiveness_level: number; // 0-1 scale
  formality_level: number; // 0-1 scale
  humor_level: number; // 0-1 scale
  expertise_areas: string[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Agent conversation context
 */
export interface ConversationContext {
  id: string;
  organization_id: string;
  agent_id: string;
  contact_id?: string;
  conversation_id: string;
  current_goal?: string;
  contact_history?: string;
  recent_interactions?: string[];
  relevant_memories?: string[];
  conversation_state: ConversationState;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Conversation state enum
 */
export enum ConversationState {
  GREETING = 'GREETING',
  DISCOVERY = 'DISCOVERY',
  PRESENTING = 'PRESENTING',
  OBJECTION_HANDLING = 'OBJECTION_HANDLING',
  CLOSING = 'CLOSING',
  FOLLOW_UP = 'FOLLOW_UP',
  ENDED = 'ENDED'
}

/**
 * Agent decision types
 */
export enum AgentDecisionType {
  NEXT_MESSAGE = 'NEXT_MESSAGE',
  CHANGE_TOPIC = 'CHANGE_TOPIC',
  ASK_QUESTION = 'ASK_QUESTION',
  PRESENT_OFFER = 'PRESENT_OFFER',
  ADDRESS_OBJECTION = 'ADDRESS_OBJECTION',
  CLOSE_DEAL = 'CLOSE_DEAL',
  SCHEDULE_FOLLOW_UP = 'SCHEDULE_FOLLOW_UP',
  END_CONVERSATION = 'END_CONVERSATION'
}

/**
 * Agent decision
 */
export interface AgentDecision {
  id: string;
  organization_id: string;
  agent_id: string;
  conversation_id: string;
  decision_type: AgentDecisionType;
  reasoning: string;
  confidence_score: number; // 0-1 scale
  selected_action: string;
  alternative_actions?: string[];
  memory_id?: string; // Link to memory if stored
  created_at: string;
}

/**
 * Agent action result
 */
export interface AgentActionResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  memory_id?: string; // If action was stored in memory
  access_id?: string; // If memory was accessed
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  organization_id: string;
  name: string;
  description: string;
  personality_id: string;
  default_goals: string[];
  allowed_actions: string[];
  memory_access_level: MemoryAccessLevel;
  decision_confidence_threshold: number; // 0-1 scale
  max_message_length: number;
  response_time_target_ms: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Memory access level for agents
 */
export enum MemoryAccessLevel {
  NONE = 'NONE',
  READ_ONLY = 'READ_ONLY',
  READ_WRITE = 'READ_WRITE',
  FULL_ACCESS = 'FULL_ACCESS'
}

/**
 * Agent memory preferences
 */
export interface AgentMemoryPreferences {
  organization_id: string;
  agent_id: string;
  memory_types_to_create: AIMemoryType[];
  memory_types_to_access: AIMemoryType[];
  min_confidence_to_store: number; // 0-1 scale
  min_importance_to_access: number; // 0-1 scale
  max_memories_per_context: number;
  recency_weight: number; // 0-1 scale
  relevance_weight: number; // 0-1 scale
  importance_weight: number; // 0-1 scale
  created_at: string;
  updated_at: string;
}

/**
 * Agent message
 */
export interface AgentMessage {
  id: string;
  organization_id: string;
  agent_id: string;
  conversation_id: string;
  contact_id?: string;
  content: string;
  sentiment?: string;
  intent?: string;
  decision_id?: string;
  memory_ids?: string[];
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Contact message
 */
export interface ContactMessage {
  id: string;
  organization_id: string;
  contact_id: string;
  conversation_id: string;
  content: string;
  sentiment?: string;
  intent?: string;
  memory_ids?: string[];
  metadata: Record<string, any>;
  created_at: string;
}

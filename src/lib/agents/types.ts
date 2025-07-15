// Agent System Types and Interfaces

export interface AgentThought {
  id: string;
  agentId: string;
  timestamp: Date;
  type: 'observation' | 'reasoning' | 'planning' | 'action' | 'reflection';
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentAction {
  id: string;
  type: string;
  parameters: Record<string, any>;
  timestamp: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface AgentTask {
  id: string;
  type: 'email_response' | 'product_search' | 'customer_analysis' | 'data_query' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
  output?: Record<string, any>;
  agentId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export interface AgentState {
  id: string;
  name: string;
  type: 'email' | 'sales' | 'customer_success' | 'data_analyst' | 'general';
  status: 'idle' | 'thinking' | 'acting' | 'waiting' | 'error';
  currentTask?: string;
  capabilities: AgentCapability[];
  memory: AgentMemory;
  thoughts: AgentThought[];
  createdAt: Date;
  lastActivity: Date;
  metrics: AgentMetrics;
}

export interface AgentMemory {
  conversationHistory: ConversationEntry[];
  contextualMemory: Record<string, any>;
  longTermMemory: Record<string, any>;
  workingMemory: Record<string, any>;
}

export interface ConversationEntry {
  id: string;
  timestamp: Date;
  role: 'user' | 'agent' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentMetrics {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  lastError?: string;
  totalThoughts: number;
  totalActions: number;
}

export interface AgentConfig {
  maxConcurrentTasks: number;
  thoughtRetentionDays: number;
  enableAutoMode: boolean;
  requireHumanApproval: boolean;
  allowedActions: string[];
  personalityTraits: Record<string, any>;
}

export interface AgentSystem {
  agents: Map<string, AgentState>;
  taskQueue: AgentTask[];
  isRunning: boolean;
  config: AgentConfig;
}

// Event types for real-time updates
export interface AgentEvent {
  type: 'thought' | 'action' | 'task_update' | 'agent_status' | 'error' | 'system' | 'approval';
  agentId: string;
  data: any;
  timestamp: Date;
}

// API Response types
export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  thoughts?: AgentThought[];
  actions?: AgentAction[];
}

// Human oversight types
export interface HumanApprovalRequest {
  id: string;
  agentId: string;
  taskId: string;
  action: AgentAction;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
} 